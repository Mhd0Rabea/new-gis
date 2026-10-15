import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { execFile, ChildProcess } from 'node:child_process';
import { access, mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isProcessingOperation, ProcessingOperation, PROCESSING_EXTENSIONS } from './processing.config';
import { buildGdalCommand } from './adapters/gdal.adapter';
import { buildPdalCommand } from './adapters/pdal.adapter';
import { DATABASE_POOL } from '../config/database.config';
import { AiClassificationService } from './ai/ai-classification.service';
export type JobStatus='pending'|'running'|'completed'|'failed'|'cancelled';
export type ProcessingJob={id:string;operation:ProcessingOperation;inputFile:string;status:JobStatus;progress:number;result?:unknown;error?:string;createdAt:string;startedAt?:string;finishedAt?:string;outputFile?:string;parameters?:Record<string,unknown>};
@Injectable()
export class ProcessingService implements OnModuleInit {
 private readonly jobs=new Map<string,ProcessingJob>();
 private readonly processes=new Map<string,ChildProcess>();
 private readonly queue:string[]=[];
 private active=0;
 private readonly concurrency:number;
 private readonly toolsBin:string;
 private readonly inputDir:string;
 private readonly cleanupHours:number;
 private readonly workDir:string;
 private readonly manifestFile:string;
 private databaseReady=false;
 constructor(config:ConfigService,@Optional() @Inject(DATABASE_POOL) private readonly pool?:Pool,private readonly ai?:AiClassificationService){
  const configuredTools=config.get<string>('PROCESSING_TOOLS_BIN');
  if(!configuredTools)throw new Error('PROCESSING_TOOLS_BIN is required.');
  this.toolsBin=path.resolve(configuredTools);
  const configuredInput=config.get<string>('PROCESSING_INPUT_DIR');
  if(!configuredInput)throw new Error('PROCESSING_INPUT_DIR is required.');
  this.inputDir=path.resolve(configuredInput);
  this.cleanupHours=Math.max(1,Number(config.get<string>('PROCESSING_CLEANUP_HOURS','24'))||24);
  this.workDir=path.resolve(config.get<string>('PROCESSING_WORK_DIR',path.resolve(process.cwd(),'..','.processing-work')));
  this.manifestFile=path.join(this.workDir,'jobs.json');
  this.concurrency=Math.max(1,Math.min(4,Number(config.get<string>('PROCESSING_CONCURRENCY','1'))||1));
 }
 async onModuleInit(){
  await mkdir(this.workDir,{recursive:true});await mkdir(this.inputDir,{recursive:true});
  try{
   const saved=await this.loadJobs();
   for(const job of saved){
    if(job.status==='running'||job.status==='pending')Object.assign(job,{status:'pending',progress:0,error:undefined,startedAt:undefined,finishedAt:undefined});
    this.jobs.set(job.id,job);
    if(job.status==='pending')this.queue.push(job.id);
   }
  }catch{ /* First run or an unreadable empty manifest starts cleanly. */ }
  await this.cleanupExpired();await this.persist(); this.drain();
 }
 async saveUpload(file:{originalname:string;buffer:Buffer;size:number}){
  if(!file||!Buffer.isBuffer(file.buffer))throw new BadRequestException('ملف الرفع مطلوب.');
  if(file.size>50*1024*1024)throw new BadRequestException('حجم الملف يتجاوز الحد المسموح 50 ميغابايت.');
  const original=path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g,'-');
  const ext=path.extname(original).toLowerCase();
  if(!PROCESSING_EXTENSIONS.has(ext))throw new BadRequestException('امتداد الملف غير مسموح.');
  const stored=`${randomUUID()}-${original}`;
  await mkdir(this.inputDir,{recursive:true});
  const target=path.join(this.inputDir,stored);
  await writeFile(target,file.buffer);
  try{await this.validateSpatialFile(target,ext);}catch(error){await unlink(target).catch(()=>undefined);throw error;}
  return{fileName:stored,originalName:file.originalname,size:file.size};
 }
 list(){return [...this.jobs.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 get(id:string){const job=this.jobs.get(id);if(!job)throw new NotFoundException('مهمة المعالجة غير موجودة.');return job;}
 create(operationValue:unknown,inputValue:unknown,parameters:Record<string,unknown>={}){
  if(!isProcessingOperation(operationValue))throw new BadRequestException('عملية المعالجة غير مسموحة.');
  if(typeof inputValue!=='string'||path.basename(inputValue)!==inputValue)throw new BadRequestException('اسم ملف الإدخال غير صالح.');
  const ext=path.extname(inputValue).toLowerCase();if(!PROCESSING_EXTENSIONS.has(ext))throw new BadRequestException('امتداد الملف غير مسموح.');
  if((operationValue.startsWith('raster')||operationValue==='hillshade'||operationValue==='contours')&&!['.tif','.tiff'].includes(ext))throw new BadRequestException('تتطلب العملية ملف Raster.');
  if((operationValue.startsWith('point-cloud')||operationValue==='ai-point-classification')&&!['.las','.laz'].includes(ext))throw new BadRequestException('تتطلب العملية ملف LAS أو LAZ.');
  const job:ProcessingJob={id:randomUUID(),operation:operationValue,inputFile:inputValue,status:'pending',progress:0,createdAt:new Date().toISOString(),parameters:{operation:operationValue,inputFile:inputValue,...parameters}};
  this.jobs.set(job.id,job);this.queue.push(job.id);void this.persist();this.drain();return job;
 }
 retry(id:string){const source=this.get(id);if(!['completed','failed','cancelled'].includes(source.status))throw new ConflictException('لا يمكن إعادة تشغيل مهمة نشطة.');return this.create(source.operation,source.inputFile,{...(source.parameters??{}),operation:source.operation,inputFile:source.inputFile});}
 cancel(id:string){
  const job=this.get(id);if(['completed','failed','cancelled'].includes(job.status))throw new ConflictException('انتهت المهمة ولا يمكن إلغاؤها.');
  this.processes.get(id)?.kill();Object.assign(job,{status:'cancelled',progress:100,finishedAt:new Date().toISOString()});void this.persist();return job;
 }
 async artifact(id:string){
  const job=this.get(id);if(job.status!=='completed'||!job.outputFile)throw new NotFoundException('لا يوجد مخرج لهذه المهمة.');
  const file=path.resolve(this.workDir,job.outputFile);if(!file.startsWith(this.workDir+path.sep))throw new BadRequestException('مسار المخرج غير صالح.');
  await stat(file);return{file,name:path.basename(file)};
 }
 async preview(id:string){
  const artifact=await this.artifact(id);if(!artifact.name.toLowerCase().endsWith('.tif'))return artifact;
  const previewFile=path.join(this.workDir,`${id}-preview.png`);const root=path.dirname(this.toolsBin);const env={...process.env,PROJ_DATA:path.join(root,'share','proj'),GDAL_DATA:path.join(root,'share','gdal')};
  await new Promise<void>((resolve,reject)=>execFile(path.join(this.toolsBin,'gdal_translate.exe'),['-of','PNG','-b','1','-scale',artifact.file,previewFile],{env},(error)=>error?reject(new BadRequestException('تعذر إنشاء معاينة للمخرج.')):resolve()));
  return{file:previewFile,name:path.basename(previewFile)};
 }
 async remove(id:string){
  const job=this.get(id);if(['pending','running'].includes(job.status))throw new ConflictException('ألغ المهمة قبل حذفها.');
  if(job.outputFile){const file=path.resolve(this.workDir,job.outputFile);if(file.startsWith(this.workDir+path.sep))await unlink(file).catch(()=>undefined);}
  this.jobs.delete(id);await this.persist();return{id,deleted:true};
 }
 private drain(){while(this.active<this.concurrency&&this.queue.length){const id=this.queue.shift();const job=id?this.jobs.get(id):undefined;if(!job||job.status!=='pending')continue;this.active++;void this.run(job).catch(async(error)=>{if(job.status!=='cancelled'){Object.assign(job,{status:'failed',progress:100,error:error instanceof Error?error.message:'تعذر تشغيل مهمة المعالجة.',finishedAt:new Date().toISOString()});await this.persist();}}).finally(()=>{this.active--;this.drain();});}}
 private async loadJobs():Promise<ProcessingJob[]>{
  if(this.pool){try{await this.initializeDatabase();const {rows}=await this.pool.query(`SELECT id, operation, status, input_name, output_name, progress, error_message, result, parameters, created_at, started_at, finished_at FROM mgos.processing_jobs ORDER BY created_at DESC`);this.databaseReady=true;return rows.map((row)=>({id:row.id,operation:row.operation,inputFile:row.input_name,outputFile:row.output_name??undefined,status:row.status,progress:row.progress,error:row.error_message??undefined,result:row.result??undefined,parameters:row.parameters??undefined,createdAt:new Date(row.created_at).toISOString(),startedAt:row.started_at?new Date(row.started_at).toISOString():undefined,finishedAt:row.finished_at?new Date(row.finished_at).toISOString():undefined}));}catch{this.databaseReady=false;}}
  return JSON.parse(await readFile(this.manifestFile,'utf8')) as ProcessingJob[];
 }
 private async initializeDatabase(){if(!this.pool)return;await this.pool.query('CREATE SCHEMA IF NOT EXISTS mgos');await this.pool.query(`CREATE TABLE IF NOT EXISTS mgos.processing_jobs (id uuid PRIMARY KEY, operation text NOT NULL, status text NOT NULL CHECK (status IN ('pending','running','completed','failed','cancelled')), input_name text NOT NULL, output_name text, progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100), error_message text, result jsonb, parameters jsonb, created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, finished_at timestamptz)`);await this.pool.query('ALTER TABLE mgos.processing_jobs ADD COLUMN IF NOT EXISTS parameters jsonb');}
 private async persist(){
  if(this.databaseReady&&this.pool){const client=await this.pool.connect();try{await client.query('BEGIN');for(const job of this.jobs.values())await client.query(`INSERT INTO mgos.processing_jobs (id,operation,status,input_name,output_name,progress,error_message,result,parameters,created_at,started_at,finished_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,output_name=EXCLUDED.output_name,progress=EXCLUDED.progress,error_message=EXCLUDED.error_message,result=EXCLUDED.result,parameters=EXCLUDED.parameters,started_at=EXCLUDED.started_at,finished_at=EXCLUDED.finished_at`,[job.id,job.operation,job.status,job.inputFile,job.outputFile??null,job.progress,job.error??null,job.result??null,job.parameters??null,job.createdAt,job.startedAt??null,job.finishedAt??null]);const ids=[...this.jobs.keys()];if(ids.length)await client.query('DELETE FROM mgos.processing_jobs WHERE NOT (id = ANY($1::uuid[]))',[ids]);else await client.query('DELETE FROM mgos.processing_jobs');await client.query('COMMIT');return;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
  await mkdir(this.workDir,{recursive:true});const temp=this.manifestFile+'.tmp';await writeFile(temp,JSON.stringify(this.list(),null,2),'utf8');await writeFile(this.manifestFile,await readFile(temp));await unlink(temp).catch(()=>undefined);
 }
 private async validateSpatialFile(file:string,ext:string){
  const root=path.dirname(this.toolsBin);const env={...process.env,PROJ_DATA:path.join(root,'share','proj'),GDAL_DATA:path.join(root,'share','gdal')};
  const raster=['.tif','.tiff'].includes(ext);const executable=path.join(this.toolsBin,raster?'gdalinfo.exe':'pdal.exe');const args=raster?['-json',file]:['info','--summary',file];
  let output:string;try{output=await new Promise<string>((resolve,reject)=>execFile(executable,args,{env,maxBuffer:8388608},(error,stdout)=>error?reject(error):resolve(stdout)));}catch(error){if(this.isSpawnPermissionError(error))throw error;throw new BadRequestException('الملف تالف أو غير قابل للقراءة.');}
  let metadata:any;try{metadata=JSON.parse(output);}catch{throw new BadRequestException('تعذر قراءة البيانات المكانية للملف.');}
  const extent=raster?metadata.wgs84Extent?.coordinates?.[0]:metadata.summary?.bounds;
  const crs=raster?metadata.coordinateSystem?.wkt:metadata.summary?.srs?.wkt;
  if(!crs)throw new BadRequestException('الملف لا يحتوي على CRS معتمد.');
  let xs:number[],ys:number[];if(!raster&&extent&&Number.isFinite(extent.minx)){xs=[Number(extent.minx),Number(extent.maxx)];ys=[Number(extent.miny),Number(extent.maxy)];}else{const values=JSON.stringify(extent).match(/-?\d+(?:\.\d+)?/g)?.map(Number)??[];xs=values.filter((_,i)=>i%2===0);ys=values.filter((_,i)=>i%2===1);}
  if(!xs.length||Math.min(...xs)<35||Math.max(...xs)>43||Math.min(...ys)<32||Math.max(...ys)>38)throw new BadRequestException('الملف خارج النطاق المكاني المعتمد.');
 }
 private isSpawnPermissionError(error:unknown){return (error as {code?:string})?.code==='EPERM';}
 private async cleanupExpired(){const cutoff=Date.now()-this.cleanupHours*3600000;for(const dir of [this.inputDir,this.workDir]){for(const name of await readdir(dir).catch(()=>[])){if(name==='jobs.json'||name.endsWith('.tmp'))continue;const file=path.join(dir,name);const info=await stat(file).catch(()=>null);if(info?.isFile()&&info.mtimeMs<cutoff)await unlink(file).catch(()=>undefined);}}}
 private async run(job:ProcessingJob){
  Object.assign(job,{status:'running',progress:10,startedAt:new Date().toISOString()});await this.persist();
  const input=path.join(this.inputDir,job.inputFile);try{await access(input);}catch{throw new BadRequestException('ملف الإدخال غير موجود. ارفعه من جديد قبل تشغيل العملية.');}const root=path.dirname(this.toolsBin);const env={...process.env,PROJ_DATA:path.join(root,'share','proj'),GDAL_DATA:path.join(root,'share','gdal')};
  if(job.operation==='ai-point-classification'&&this.ai){
   try{
    await access(input);
    await this.validateSpatialFile(input,path.extname(input).toLowerCase());
    const command=buildPdalCommand(this.toolsBin,job.operation,input,this.workDir,job.id);
    const aiCommand=command as import('./adapters/pdal.adapter').PdalFeatureExportCommand;
    if('pipelineFile' in aiCommand)await writeFile(aiCommand.pipelineFile,JSON.stringify(aiCommand.pipeline),'utf8');
    try{await new Promise<void>((resolve,reject)=>{const child=execFile(command.executable,command.args,{env,maxBuffer:16777216},error=>{this.processes.delete(job.id);if(job.status==='cancelled'){resolve();return;}error?reject(error):resolve();});this.processes.set(job.id,child);});}
    finally{if('pipelineFile' in aiCommand)await unlink(aiCommand.pipelineFile).catch(()=>undefined);}
    if(job.status==='cancelled'){await this.persist();return;}
    const aiResult=await this.ai.execute(job,this.workDir,command.outputFile);
    job.outputFile=aiResult.artifactFile;
    Object.assign(job,{status:'completed',progress:100,result:aiResult,finishedAt:new Date().toISOString()});
   }catch(error){
    if(job.status!=='cancelled'){Object.assign(job,{status:'failed',progress:100,error:'تعذر إكمال التصنيف الذكي: '+(error instanceof Error?error.message:'خطأ غير معروف'),finishedAt:new Date().toISOString()});}
   }
   await this.persist();return;
  }
  const command=job.operation.startsWith('point-cloud')?buildPdalCommand(this.toolsBin,job.operation,input,this.workDir,job.id):buildGdalCommand(this.toolsBin,job.operation,input,this.workDir,job.id);
  const {executable,args}=command;if(command.outputFile)job.outputFile=path.basename(command.outputFile);
  await new Promise<void>((resolve)=>{const child=execFile(executable,args,{env,maxBuffer:16777216},(error,stdout)=>{this.processes.delete(job.id);if(job.status==='cancelled'){resolve();return;}if(error){Object.assign(job,{status:'failed',progress:100,error:'فشلت أداة المعالجة. تحقق من الملف وإعداد الأدوات.',finishedAt:new Date().toISOString()});resolve();return;}let result:unknown={message:'اكتملت العملية.',outputFile:job.outputFile};if(stdout.trim()){try{result=JSON.parse(stdout)}catch{result={message:stdout.trim(),outputFile:job.outputFile}}}Object.assign(job,{status:'completed',progress:100,result,finishedAt:new Date().toISOString()});resolve();});this.processes.set(job.id,child);});
  await this.persist();
 }
}











