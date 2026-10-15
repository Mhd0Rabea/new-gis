import path from 'node:path';
import { ProcessingOperation } from '../processing.config';
export type ToolCommand={executable:string;args:string[];outputFile?:string};
export function buildGdalCommand(toolsBin:string,operation:ProcessingOperation,input:string,workDir:string,jobId:string):ToolCommand{
 if(operation==='raster-info')return{executable:path.join(toolsBin,'gdalinfo.exe'),args:['-json','-stats',input]};
 if(operation==='hillshade'){const output=path.join(workDir,jobId+'-hillshade.png');return{executable:path.join(toolsBin,'gdaldem.exe'),args:['hillshade',input,output,'-of','PNG','-compute_edges'],outputFile:output};}
 if(operation==='contours'){const output=path.join(workDir,jobId+'-contours.geojson');return{executable:path.join(toolsBin,'gdal_contour.exe'),args:['-a','elevation','-i','25',input,output],outputFile:output};}
 if(operation==='raster-reproject'){const output=path.join(workDir,jobId+'-epsg4326.tif');return{executable:path.join(toolsBin,'gdalwarp.exe'),args:['-t_srs','EPSG:4326','-of','GTiff',input,output],outputFile:output};}
 throw new Error('عملية GDAL غير مدعومة.');
}

