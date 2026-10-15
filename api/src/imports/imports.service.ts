import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Pool, PoolClient } from 'pg';
import { DATABASE_POOL } from '../config/database.config';
import { getLayerDefinition, LayerDefinition } from '../features/layers.config';
import { ImportValidationIssue, normalizeImportProperties, validateImportProperties } from './import-mappings';

type UploadFile={originalname:string;buffer:Buffer;size:number};
type GeoFeature={type?:string;id?:string|number;geometry?:{type?:string;coordinates?:unknown};properties?:Record<string,unknown>};
type Decision={stagedFeatureId:string;action:'create'|'update'|'skip';matchedFeatureId?:string};

@Injectable()
export class ImportsService{
 constructor(@Inject(DATABASE_POOL)private readonly pool:Pool){}

 async create(layerName:string,file:UploadFile,sourceName:string,actor='local-user'){
  const layer=this.layer(layerName);
  if(!file?.buffer)throw new BadRequestException('ملف GeoJSON مطلوب.');
  if(file.size>100*1024*1024)throw new BadRequestException('حجم الملف يتجاوز 100 ميغابايت.');
  let document:any;try{document=JSON.parse(file.buffer.toString('utf8').replace(/^\uFEFF/,''));}catch{throw new BadRequestException('ملف GeoJSON غير صالح.');}
  const declaredCrs=String(document?.crs?.properties?.name??'').toUpperCase();
  if(declaredCrs&&!declaredCrs.includes('4326')&&!declaredCrs.includes('CRS84'))throw new BadRequestException('يجب أن يكون ملف GeoJSON بنظام EPSG:4326.');
  const features:GeoFeature[]=document?.type==='FeatureCollection'?document.features:document?.type==='Feature'?[document]:[];
  if(!Array.isArray(features)||!features.length)throw new BadRequestException('لا يحتوي الملف على معالم قابلة للفحص.');
  const client=await this.pool.connect();
  try{
   await client.query('BEGIN');
   const hash=createHash('sha256').update(file.buffer).digest('hex');
   const batch=(await client.query(`INSERT INTO mgos_staging.import_batches(layer_name,source_name,file_name,file_sha256,status,created_by)
    VALUES($1,$2,$3,$4,'review',$5) RETURNING *`,[layer.name,sourceName||file.originalname,file.originalname,hash,actor])).rows[0];
   let valid=0,warnings=0,invalid=0,duplicates=0,unresolved=0;
   for(let index=0;index<features.length;index++){
    const feature=features[index],issues:{severity:'warning'|'error';field?:string;code:string;message:string;value?:unknown}[]=[];
    if(feature?.type!=='Feature'||!feature.geometry||!feature.properties)throw new BadRequestException(`المعلم ${index+1} لا يحتوي geometry وproperties صالحين.`);
    if(!layer.geometryTypes.includes(feature.geometry.type as never))issues.push({severity:'error',code:'geometry_type',message:`نوع الهندسة غير متوافق. الأنواع المقبولة: ${layer.geometryTypes.join(', ')}`});
    if(!this.coordinatesValid(feature.geometry.coordinates))issues.push({severity:'error',code:'coordinates',message:'الإحداثيات غير صالحة لنظام EPSG:4326.'});
    const {normalized,unknown,transformations}=normalizeImportProperties(layer.name,feature.properties);
    issues.push(...validateImportProperties(normalized));
    for(const field of unknown)issues.push({severity:'warning',field,code:'unknown_field',message:`سيتم تجاهل الحقل غير المعتمد: ${field}`});
    for(const field of layer.requiredFields)if(normalized[field]===null||normalized[field]===undefined||normalized[field]==='')issues.push({severity:'error',field,code:'required',message:`الحقل المطلوب ناقص: ${field}`});
    const sourceId=normalized.source_id??feature.id??null;delete normalized.source_id;
    const matches=issues.some(x=>x.severity==='error')?[]:await this.findDuplicates(client,layer,sourceName,String(sourceId??''),normalized,feature.geometry);
    const match=matches[0]??null;
    const status=issues.some(x=>x.severity==='error')?'invalid':issues.length?'warning':'valid';
    if(status==='invalid')invalid++;else {valid++;if(status==='warning')warnings++}
    if(match){duplicates++;unresolved++}
    const staged=(await client.query(`INSERT INTO mgos_staging.staged_features
     (batch_id,feature_index,source_id,original_properties,normalized_properties,transformations,geom,validation_status,duplicate_kind,duplicate_candidates,matched_feature_id,matched_row_version)
     VALUES($1,$2,$3,$4,$5,$6,ST_SetSRID(ST_GeomFromGeoJSON($7),4326),$8,$9,$10,$11,$12) RETURNING id`,
     [batch.id,index+1,sourceId,feature.properties,normalized,JSON.stringify(transformations),JSON.stringify(feature.geometry),status,match?.kind??'none',JSON.stringify(matches),match?.id??null,match?.rowVersion??null])).rows[0];
    for(const issue of issues)await client.query(`INSERT INTO mgos_staging.validation_issues(staged_feature_id,severity,field_name,code,message_ar,original_value)
     VALUES($1,$2,$3,$4,$5,$6)`,[staged.id,issue.severity,issue.field??null,issue.code,issue.message,issue.value===undefined?null:JSON.stringify(issue.value)]);
    if(!match&&status!=='invalid')await client.query(`INSERT INTO mgos_staging.import_decisions(staged_feature_id,action,decided_by) VALUES($1,'create',$2)`,[staged.id,actor]);
   }
   const totals={total:features.length,valid,warnings,invalid,duplicates,unresolved};
   const state=invalid?'review':unresolved?'review':'ready';
   await client.query('UPDATE mgos_staging.import_batches SET totals=$2,status=$3,reviewed_at=CURRENT_TIMESTAMP WHERE id=$1',[batch.id,totals,state]);
   await client.query('COMMIT');
   return this.get(batch.id);
  }catch(error){await client.query('ROLLBACK');throw error}finally{client.release()}
 }

 async get(id:string){
  const batch=(await this.pool.query('SELECT * FROM mgos_staging.import_batches WHERE id=$1',[id])).rows[0];
  if(!batch)throw new NotFoundException('دفعة الاستيراد غير موجودة.');
  const features=(await this.pool.query(`SELECT sf.id,sf.feature_index,sf.source_id,sf.normalized_properties,sf.transformations,sf.duplicate_candidates,
   ST_AsGeoJSON(sf.geom)::jsonb geometry,sf.validation_status,sf.duplicate_kind,sf.matched_feature_id,sf.matched_row_version,
   d.action,COALESCE(jsonb_agg(jsonb_build_object('severity',i.severity,'field',i.field_name,'code',i.code,'message',i.message_ar))
   FILTER(WHERE i.id IS NOT NULL),'[]'::jsonb) issues
   FROM mgos_staging.staged_features sf LEFT JOIN mgos_staging.import_decisions d ON d.staged_feature_id=sf.id
   LEFT JOIN mgos_staging.validation_issues i ON i.staged_feature_id=sf.id WHERE sf.batch_id=$1
   GROUP BY sf.id,d.action ORDER BY sf.feature_index LIMIT 500`,[id])).rows;
  return{...batch,features};
 }

 async list(limit=25){
  const safe=Math.min(Math.max(Number(limit)||25,1),100);
  return (await this.pool.query(`SELECT id,layer_name,source_name,file_name,status,totals,created_by,created_at,reviewed_at,committed_at,error_message
   FROM mgos_staging.import_batches ORDER BY created_at DESC LIMIT $1`,[safe])).rows;
 }

 async remove(id:string){await this.ensureMutable(id);await this.pool.query('DELETE FROM mgos_staging.import_batches WHERE id=$1',[id]);return{status:'deleted'};}

 async revalidate(id:string,actor='local-user'){
  const batch=await this.ensureMutable(id),layer=this.layer(batch.layer_name),client=await this.pool.connect();
  try{await client.query('BEGIN');
   const rows=(await client.query(`SELECT id,feature_index,source_id,original_properties,ST_AsGeoJSON(geom)::jsonb geometry FROM mgos_staging.staged_features WHERE batch_id=$1 ORDER BY feature_index FOR UPDATE`,[id])).rows;
   await client.query('DELETE FROM mgos_staging.import_decisions WHERE staged_feature_id IN(SELECT id FROM mgos_staging.staged_features WHERE batch_id=$1)',[id]);
   await client.query('DELETE FROM mgos_staging.validation_issues WHERE staged_feature_id IN(SELECT id FROM mgos_staging.staged_features WHERE batch_id=$1)',[id]);
   let valid=0,warnings=0,invalid=0,duplicates=0,unresolved=0;
   for(const row of rows){
    const issues:ImportValidationIssue[]=[];
    const {normalized,unknown,transformations}=normalizeImportProperties(layer.name,row.original_properties);
    issues.push(...validateImportProperties(normalized));
    for(const field of unknown)issues.push({severity:'warning',field,code:'unknown_field',message:`سيتم تجاهل الحقل غير المعتمد: ${field}`});
    for(const field of layer.requiredFields)if(normalized[field]===null||normalized[field]===undefined||normalized[field]==='')issues.push({severity:'error',field,code:'required',message:`الحقل المطلوب ناقص: ${field}`});
    const matches=issues.some(item=>item.severity==='error')?[]:await this.findDuplicates(client,layer,batch.source_name,String(row.source_id??''),normalized,row.geometry);
    const match=matches[0]??null,status=issues.some(item=>item.severity==='error')?'invalid':issues.length?'warning':'valid';
    if(status==='invalid')invalid++;else{valid++;if(status==='warning')warnings++;}if(match){duplicates++;unresolved++;}
    await client.query(`UPDATE mgos_staging.staged_features SET normalized_properties=$2,transformations=$3,validation_status=$4,duplicate_kind=$5,duplicate_candidates=$6,matched_feature_id=$7,matched_row_version=$8 WHERE id=$1`,[row.id,normalized,JSON.stringify(transformations),status,match?.kind??'none',JSON.stringify(matches),match?.id??null,match?.rowVersion??null]);
    for(const issue of issues)await client.query(`INSERT INTO mgos_staging.validation_issues(staged_feature_id,severity,field_name,code,message_ar,original_value) VALUES($1,$2,$3,$4,$5,$6)`,[row.id,issue.severity,issue.field??null,issue.code,issue.message,issue.value===undefined?null:JSON.stringify(issue.value)]);
    if(!match&&status!=='invalid')await client.query(`INSERT INTO mgos_staging.import_decisions(staged_feature_id,action,decided_by) VALUES($1,'create',$2)`,[row.id,actor]);
   }
   const totals={total:rows.length,valid,warnings,invalid,duplicates,unresolved},status=invalid||unresolved?'review':'ready';
   await client.query('UPDATE mgos_staging.import_batches SET totals=$2,status=$3,reviewed_at=CURRENT_TIMESTAMP,error_message=NULL WHERE id=$1',[id,totals,status]);
   await client.query('COMMIT');return this.get(id);
  }catch(error){await client.query('ROLLBACK');throw error}finally{client.release();}
 }
 async decide(id:string,decisions:Decision[],actor='local-user'){
  await this.ensureMutable(id);const client=await this.pool.connect();
  try{await client.query('BEGIN');
   for(const decision of decisions){
    if(!['create','update','skip'].includes(decision.action))throw new BadRequestException('قرار الاستيراد غير صالح.');
    const row=(await client.query('SELECT duplicate_kind,matched_feature_id,validation_status FROM mgos_staging.staged_features WHERE id=$1 AND batch_id=$2',[decision.stagedFeatureId,id])).rows[0];
    if(!row)throw new BadRequestException('المعلم المرحلي غير موجود.');
    if(row.validation_status==='invalid')throw new BadRequestException('لا يمكن اعتماد معلم يحوي خطأ مانعًا.');
    if(decision.matchedFeatureId){
     const candidate=(await client.query(`SELECT candidate FROM mgos_staging.staged_features sf CROSS JOIN LATERAL jsonb_array_elements(sf.duplicate_candidates) candidate WHERE sf.id=$1 AND candidate->>'id'=$2`,[decision.stagedFeatureId,decision.matchedFeatureId])).rows[0]?.candidate;
     if(!candidate)throw new BadRequestException('التطابق المختار غير متاح.');
     await client.query('UPDATE mgos_staging.staged_features SET matched_feature_id=$2,matched_row_version=$3 WHERE id=$1',[decision.stagedFeatureId,candidate.id,candidate.rowVersion]);
     row.matched_feature_id=candidate.id;
    }
    if(decision.action==='update'&&!row.matched_feature_id)throw new BadRequestException('لا يوجد سجل مطابق لتحديثه.');
    await client.query(`INSERT INTO mgos_staging.import_decisions(staged_feature_id,action,decided_by)VALUES($1,$2,$3)
     ON CONFLICT(staged_feature_id)DO UPDATE SET action=EXCLUDED.action,decided_by=EXCLUDED.decided_by,decided_at=CURRENT_TIMESTAMP`,[decision.stagedFeatureId,decision.action,actor]);
   }
   const unresolved=Number((await client.query(`SELECT count(*) FROM mgos_staging.staged_features sf LEFT JOIN mgos_staging.import_decisions d ON d.staged_feature_id=sf.id
    WHERE sf.batch_id=$1 AND sf.validation_status<>'invalid' AND d.action IS NULL`,[id])).rows[0].count);
   const errors=Number((await client.query(`SELECT count(*) FROM mgos_staging.staged_features WHERE batch_id=$1 AND validation_status='invalid'`,[id])).rows[0].count);
   await client.query('UPDATE mgos_staging.import_batches SET status=$2,totals=jsonb_set(totals,\'{unresolved}\',to_jsonb($3::int)) WHERE id=$1',[id,!errors&&!unresolved?'ready':'review',unresolved]);
   await client.query('COMMIT');return this.get(id);
  }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
 }

 async commit(id:string,actor='local-user'){
  const batch=await this.ensureMutable(id);if(batch.status!=='ready')throw new ConflictException('الدفعة غير جاهزة للاعتماد.');
  const layer=this.layer(batch.layer_name),client=await this.pool.connect();
  let created=0,updated=0,skipped=0;
  try{await client.query('BEGIN');await client.query(`SELECT set_config('mgos.updated_by',$1,true)`,[actor]);
   const rows=(await client.query(`SELECT sf.*,d.action FROM mgos_staging.staged_features sf JOIN mgos_staging.import_decisions d ON d.staged_feature_id=sf.id WHERE sf.batch_id=$1 ORDER BY sf.feature_index FOR UPDATE`,[id])).rows;
   for(const row of rows){
    if(row.action==='skip'){skipped++;continue}
    const properties=row.normalized_properties as Record<string,unknown>,fields=Object.keys(properties).filter(f=>layer.editableFields.includes(f));
    if(row.action==='create'){
     const columns=[...fields.map(f=>this.ident(f)),'source_name','source_id','updated_by','geom'];
     const values=[...fields.map(f=>properties[f]),batch.source_name,row.source_id,actor];
     const placeholders=values.map((_,i)=>`$${i+1}`);
     await client.query(`INSERT INTO mgos.${this.ident(layer.table)}(${columns.join(',')}) VALUES(${placeholders.join(',')},ST_Transform((SELECT geom FROM mgos_staging.staged_features WHERE id=$${values.length+1}),32637))`,[...values,row.id]);created++;
    }else{
     const values=fields.map(f=>properties[f]),sets=fields.map((f,i)=>`${this.ident(f)}=$${i+1}`);
     values.push(batch.source_name,row.source_id,actor,row.matched_feature_id,row.matched_row_version);
     const base=fields.length;
     const result=await client.query(`UPDATE mgos.${this.ident(layer.table)} SET ${sets.join(',')},source_name=$${base+1},source_id=$${base+2},updated_by=$${base+3},
      geom=ST_Transform((SELECT geom FROM mgos_staging.staged_features WHERE id='${row.id}'::uuid),32637)
      WHERE id=$${base+4} AND row_version=$${base+5}`,values);
     if(result.rowCount!==1)throw new ConflictException(`تغير السجل المطابق للمعلم ${row.feature_index} بعد الفحص. أعد فحص الدفعة.`);updated++;
    }
   }
   await client.query(`UPDATE mgos_staging.import_batches SET status='committed',committed_at=CURRENT_TIMESTAMP,error_message=NULL,totals=totals||$2::jsonb WHERE id=$1`,[id,JSON.stringify({created,updated,skipped})]);
   await client.query('COMMIT');return{status:'committed',created,updated,skipped};
  }catch(e){await client.query('ROLLBACK');await this.pool.query('UPDATE mgos_staging.import_batches SET error_message=$2 WHERE id=$1',[id,e instanceof Error?e.message:'فشل الاعتماد']);throw e}finally{client.release()}
 }

 async reject(id:string,actor='local-user',reason?:string){await this.ensureMutable(id);await this.pool.query(`UPDATE mgos_staging.import_batches SET status='rejected',reviewed_at=CURRENT_TIMESTAMP,error_message=$2,totals=totals||jsonb_build_object('rejectedBy',$3) WHERE id=$1`,[id,reason??null,actor]);return{status:'rejected'}}

 async report(id:string){const data=await this.get(id);const header='index,status,duplicate,decision,issues\n';return header+data.features.map((f:any)=>[f.feature_index,f.validation_status,f.duplicate_kind,f.action??'',JSON.stringify(f.issues).replaceAll('"','""')].map((x:any)=>`"${x}"`).join(',')).join('\n')}

 private async ensureMutable(id:string){const row=(await this.pool.query('SELECT * FROM mgos_staging.import_batches WHERE id=$1',[id])).rows[0];if(!row)throw new NotFoundException('دفعة الاستيراد غير موجودة.');if(['committed','rejected'].includes(row.status))throw new ConflictException('انتهت هذه الدفعة ولا يمكن تعديلها.');return row}
 private async findDuplicates(client:PoolClient,layer:LayerDefinition,sourceName:string,sourceId:string,properties:Record<string,unknown>,geometry:any){
  if(sourceId){
   const exact=(await client.query(`SELECT id,row_version FROM mgos.${this.ident(layer.table)} WHERE source_name=$1 AND source_id=$2 LIMIT 1`,[sourceName,sourceId])).rows[0];
   if(exact)return[{kind:'exact',id:exact.id,rowVersion:exact.row_version}];
  }
  const nameField=layer.name==='Military_Bases'?'base_name':'name',name=properties[nameField];
  if(!name)return[];
  const possible=(await client.query(`SELECT id,row_version FROM mgos.${this.ident(layer.table)} WHERE lower(${this.ident(nameField)})=lower($1::text)
   AND ST_DWithin(geom,ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($2),4326),32637),25)
   ORDER BY ST_Distance(geom,ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($2),4326),32637)) LIMIT 20`,[name,JSON.stringify(geometry)])).rows;
  return possible.map(item=>({kind:'possible',id:item.id,rowVersion:item.row_version}));
 }
 private coordinatesValid(value:unknown):boolean{if(!Array.isArray(value)||!value.length)return false;if(typeof value[0]==='number'){const [x,y]=value as number[];return value.every(Number.isFinite)&&x>=-180&&x<=180&&y>=-90&&y<=90}return value.every(v=>this.coordinatesValid(v))}
 private layer(name:string){const layer=getLayerDefinition(name);if(!layer)throw new BadRequestException('الطبقة غير معتمدة.');return layer}
 private ident(value:string){return '"'+value.replaceAll('"','""')+'"'}
}
