import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ImportsService } from './imports.service';

@Controller('imports')
export class ImportsController{
 constructor(private readonly imports:ImportsService){}
 @Get() list(@Query('limit')limit?:string){return this.imports.list(Number(limit));}
 @Post(':layer') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:100*1024*1024,files:1}}))
 create(@Param('layer')layer:string,@UploadedFile()file:any,@Body('sourceName')sourceName?:string,@Body('actor')actor?:string){return this.imports.create(layer,file,sourceName?.trim()||file?.originalname,actor);}
 @Get(':id') get(@Param('id',new ParseUUIDPipe())id:string){return this.imports.get(id);}
 @Patch(':id/decisions') decide(@Param('id',new ParseUUIDPipe())id:string,@Body()body:{decisions?:any[];actor?:string}){return this.imports.decide(id,body.decisions??[],body.actor);}
 @Post(':id/revalidate') revalidate(@Param('id',new ParseUUIDPipe())id:string,@Body()body:{actor?:string}){return this.imports.revalidate(id,body.actor);}
 @Post(':id/commit') commit(@Param('id',new ParseUUIDPipe())id:string,@Body()body:{actor?:string}){return this.imports.commit(id,body.actor);}
 @Post(':id/reject') reject(@Param('id',new ParseUUIDPipe())id:string,@Body()body:{actor?:string;reason?:string}){return this.imports.reject(id,body.actor,body.reason);}
 @Delete(':id') remove(@Param('id',new ParseUUIDPipe())id:string){return this.imports.remove(id);}
 @Get(':id/report.csv') async report(@Param('id',new ParseUUIDPipe())id:string,@Res()response:Response){const csv=await this.imports.report(id);response.type('text/csv; charset=utf-8').attachment('import-'+id+'.csv').send('\uFEFF'+csv);}
}
