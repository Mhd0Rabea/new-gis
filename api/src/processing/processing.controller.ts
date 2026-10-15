import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Res, StreamableFile, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'node:fs';
import type { Response } from 'express';
import { ProcessingService } from './processing.service';
import { AiClassificationService } from './ai/ai-classification.service';
import { AI_CLASSES, ReviewDecisionType } from './ai/ai-classification.types';
import { AiReviewService } from './ai/ai-review.service';
type UploadedProcessingFile={originalname:string;buffer:Buffer;size:number};
@Controller('processing')
export class ProcessingController {
 constructor(private readonly processing:ProcessingService,private readonly ai:AiClassificationService,private readonly reviews:AiReviewService){}
 @Get('ai/models') aiModels(){return this.ai.listModels();}
 @Post('ai/models') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:2*1024*1024,files:1}})) uploadAiModel(@UploadedFile() file:UploadedProcessingFile){if(!file?.originalname?.toLowerCase().endsWith('.json'))throw new BadRequestException('ارفع ملف إعداد نموذج بصيغة JSON.');return this.ai.registerModel(file);}
 @Post('ai/classifications') createAi(@Body() body:{inputFile?:unknown;modelVersionId?:unknown;confidenceThreshold?:unknown}){const threshold=Number(body.confidenceThreshold??.7);if(typeof body.inputFile!=='string'||!body.inputFile)throw new BadRequestException('ارفع ملف LAS أو LAZ قبل تشغيل التصنيف.');if(typeof body.modelVersionId!=='string'||!this.ai.listModels().some(model=>model.id===body.modelVersionId))throw new BadRequestException('ارفع أو اختر نموذج تصنيف معتمد أولًا.');if(!Number.isFinite(threshold)||threshold<.5||threshold>.95)throw new BadRequestException('حد الثقة يجب أن يكون بين 50% و95%.');return this.processing.create('ai-point-classification',body.inputFile,{modelVersionId:body.modelVersionId,confidenceThreshold:threshold});}
 @Get('ai/classifications/:id') aiResult(@Param('id') id:string){return this.ai.getResult(id);}
 @Get('ai/classifications/by-job/:jobId') aiResultByJob(@Param('jobId') jobId:string){return this.ai.getByJob(jobId);}
 @Get('ai/classifications/:id/evaluation') aiEvaluation(@Param('id') id:string){const result=this.ai.getResult(id);return{model:result.metrics,baseline:result.baselineMetrics};}
 @Get('ai/classifications/:id/reviews') aiReviews(@Param('id') id:string){return this.reviews.list(id);}
 @Post('ai/classifications/:id/reviews') aiReview(@Param('id') id:string,@Body() body:{featureId?:string;decision?:ReviewDecisionType;reviewedClass?:string;reason?:string}){if(!body.decision||!['accept','correct','reject'].includes(body.decision))throw new BadRequestException('قرار المراجعة غير صالح.');if(body.decision==='correct'&&(!body.reviewedClass||!AI_CLASSES.includes(body.reviewedClass as never)))throw new BadRequestException('الفئة المصححة مطلوبة.');return this.reviews.create(id,{featureId:body.featureId,decision:body.decision,reviewedClass:body.reviewedClass as never,reason:body.reason});}
 @Get('ai/classifications/:id/artifact') async aiArtifact(@Param('id') id:string,@Res({passthrough:true}) response:Response){const artifact=await this.ai.getArtifact(id,false);response.setHeader('Content-Type','application/geo+json');response.setHeader('Content-Disposition',`attachment; filename="${artifact.name}"`);return new StreamableFile(createReadStream(artifact.file));}
 @Get('ai/classifications/:id/artifact/reviewed') async aiReviewedArtifact(@Param('id') id:string,@Res({passthrough:true}) response:Response){const artifact=await this.ai.getArtifact(id,true);response.setHeader('Content-Type','application/geo+json');response.setHeader('Content-Disposition',`attachment; filename="${artifact.name}"`);return new StreamableFile(createReadStream(artifact.file));} @Post('files') @UseInterceptors(FileInterceptor('file',{limits:{fileSize:50*1024*1024,files:1}})) upload(@UploadedFile() file:UploadedProcessingFile){return this.processing.saveUpload(file);}
 @Get('jobs') list(){return this.processing.list();}
 @Get('jobs/:id') get(@Param('id') id:string){return this.processing.get(id);}
 @Post('jobs') create(@Body() body:{operation?:unknown;inputFile?:unknown}){return this.processing.create(body.operation,body.inputFile);}
 @Post('jobs/:id/retry') retry(@Param('id') id:string){return this.processing.retry(id);}
 @Post('jobs/:id/cancel') cancel(@Param('id') id:string){return this.processing.cancel(id);}
 @Get('jobs/:id/output') async output(@Param('id') id:string,@Res({passthrough:true}) response:Response){const artifact=await this.processing.artifact(id);response.setHeader('Content-Disposition',`attachment; filename="${artifact.name}"`);return new StreamableFile(createReadStream(artifact.file));}
 @Get('jobs/:id/preview') async preview(@Param('id') id:string,@Res({passthrough:true}) response:Response){const artifact=await this.processing.preview(id);response.setHeader('Content-Type',artifact.name.endsWith('.png')?'image/png':'application/octet-stream');return new StreamableFile(createReadStream(artifact.file));}
 @Delete('jobs/:id') remove(@Param('id') id:string){return this.processing.remove(id);}
}






