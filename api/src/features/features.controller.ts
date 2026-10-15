import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FeatureInputDto, FeaturePatchDto, ListFeaturesQueryDto } from './dto/feature.dto';
import { FeaturesService } from './features.service';

@ApiTags('features')
@Controller('features')
export class FeaturesController {
  constructor(private readonly features: FeaturesService, private readonly config: ConfigService) {}

  @Get('tables/:table')
  @ApiOperation({ summary: 'List an allowed standalone MGOS table' })
  listStandaloneTable(@Param('table') table: string) {
    return this.features.listStandaloneTable(table);
  }
  @Get(':layer')
  @ApiOperation({ summary: 'List features from an allowed layer' })
  @ApiParam({ name: 'layer', description: 'Canonical MGOS layer name' })
  @ApiResponse({ status: 200, description: 'GeoJSON FeatureCollection in EPSG:4326' })
  list(@Param('layer') layer: string, @Query() query: ListFeaturesQueryDto) {
    return this.features.list(layer, query);
  }

  @Get(':layer/:id/related/:table')
  @ApiOperation({ summary: 'List allowed related records' })
  related(
    @Param('layer') layer: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('table') table: string,
  ) {
    return this.features.related(layer, id, table);
  }

  @Get(':layer/:id')
  @ApiOperation({ summary: 'Get one feature' })
  getOne(@Param('layer') layer: string, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.features.getOne(layer, id);
  }

  @Post(':layer/import')
  @UseInterceptors(FileInterceptor('file',{limits:{fileSize:100*1024*1024,files:1}}))
  async importLayer(@Param('layer') layer:string,@UploadedFile() file:{originalname:string;buffer:Buffer;size:number}){
    if(!file?.buffer)throw new BadRequestException('ملف الطبقة مطلوب.');
    const ext=path.extname(file.originalname).toLowerCase();
    if(!['.geojson','.json','.gpkg','.zip'].includes(ext))throw new BadRequestException('الامتدادات المدعومة هي GeoJSON وGeoPackage وShapefile المضغوط.');
    const temp=await mkdtemp(path.join(os.tmpdir(),'mgos-import-'));
    try{
      const source=path.join(temp,'source'+ext),output=path.join(temp,'output.geojson');await writeFile(source,file.buffer);
      let document: {type?:string;features?:FeatureInputDto[]};
      if(['.geojson','.json'].includes(ext))document=JSON.parse(file.buffer.toString('utf8'));
      else {const bin=this.config.get<string>('PROCESSING_TOOLS_BIN');if(!bin)throw new BadRequestException('لم تُضبط أدوات التحويل المحلي.');const ogr=path.join(bin,'ogr2ogr.exe');await new Promise<void>((resolve,reject)=>execFile(ogr,['-f','GeoJSON','-t_srs','EPSG:4326',output,source],{maxBuffer:16777216},error=>error?reject(error):resolve()));document=JSON.parse(await (await import('node:fs/promises')).readFile(output,'utf8'));}
      const features=document.type==='FeatureCollection'?document.features:document.type==='Feature'?[document as FeatureInputDto]:[];
      if(!Array.isArray(features)||!features.length)throw new BadRequestException('لا يحتوي الملف على معالم قابلة للاستيراد.');
      const failures:string[]=[];let imported=0;for(let index=0;index<features.length;index++){try{const feature=features[index];await this.features.create(layer,{type:'Feature',geometry:feature.geometry,properties:feature.properties});imported++;}catch(error){failures.push('المعلم '+(index+1)+': '+(error instanceof Error?error.message:'خطأ غير معروف'));}}
      return{imported,total:features.length,failures};
    }catch(error){if(error instanceof BadRequestException)throw error;throw new BadRequestException('تعذر تحويل أو قراءة ملف الطبقة. تحقق من سلامة الملف ونظام الإحداثيات.');}
    finally{await rm(temp,{recursive:true,force:true});}
  }
  @Post(':layer')
  @ApiOperation({ summary: 'Create a feature in an editable layer' })
  @ApiBody({ type: FeatureInputDto })
  @ApiResponse({ status: 201, description: 'Created feature' })
  create(@Param('layer') layer: string, @Body() input: FeatureInputDto) {
    return this.features.create(layer, input);
  }

  @Patch(':layer/:id')
  @ApiOperation({ summary: 'Partially update a feature' })
  @ApiBody({ type: FeaturePatchDto })
  update(
    @Param('layer') layer: string,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: FeaturePatchDto,
  ) {
    return this.features.update(layer, id, input);
  }

  @Delete(':layer/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a feature' })
  async remove(@Param('layer') layer: string, @Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.features.remove(layer, id);
  }
}
