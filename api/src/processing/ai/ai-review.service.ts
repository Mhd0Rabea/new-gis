import { Injectable } from '@nestjs/common';
import { AiClass, ReviewDecisionType } from './ai-classification.types';
import { AiClassificationService } from './ai-classification.service';
@Injectable()
export class AiReviewService{constructor(private readonly classifications:AiClassificationService){}async create(resultId:string,body:{featureId?:string;decision:ReviewDecisionType;reviewedClass?:AiClass;reason?:string}){return this.classifications.review(resultId,body)}list(resultId:string){return this.classifications.getResult(resultId).reviews;}}

