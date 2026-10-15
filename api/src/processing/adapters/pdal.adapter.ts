import path from 'node:path';
import { ProcessingOperation } from '../processing.config';
import { ToolCommand } from './gdal.adapter';
export type PdalFeatureExportCommand=ToolCommand&{pipelineFile:string;pipeline:unknown[]};
export function buildPdalFeatureExportCommand(toolsBin:string,input:string,workDir:string,jobId:string):PdalFeatureExportCommand{const output=path.join(workDir,jobId+'-ai-features.csv');const pipelineFile=path.join(workDir,jobId+'-ai-pipeline.json');return{executable:path.join(toolsBin,'pdal.exe'),args:['pipeline',pipelineFile],outputFile:output,pipelineFile,pipeline:[input,{type:'filters.reprojection',out_srs:'EPSG:4326'},{type:'writers.text',filename:output,format:'csv',order:'X,Y,Z,Intensity,Red,Green,Blue,Classification'}]};}
export function buildPdalCommand(toolsBin:string,operation:ProcessingOperation,input:string,workDir:string,jobId:string):ToolCommand{
 if(operation==='point-cloud-info')return{executable:path.join(toolsBin,'pdal.exe'),args:['info','--summary',input]};
 if(operation==='point-cloud-classification')return{executable:path.join(toolsBin,'pdal.exe'),args:['info','--stats','--metadata',input]};
 if(operation==='point-cloud-dem'){const output=path.join(workDir,jobId+'-point-cloud-dem.tif');return{executable:path.join(toolsBin,'pdal.exe'),args:['translate',input,output,'--writers.gdal.resolution=0.001'],outputFile:output};}
 if(operation==='ai-point-classification')return buildPdalFeatureExportCommand(toolsBin,input,workDir,jobId);
 throw new Error('عملية PDAL غير مدعومة.');
}
