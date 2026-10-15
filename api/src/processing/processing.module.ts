import { Module } from '@nestjs/common';
import { ProcessingController } from './processing.controller';
import { ProcessingService } from './processing.service';
import { AiClassificationService } from './ai/ai-classification.service';
import { AiClassificationRepository } from './ai/ai-classification.repository';
import { AiReviewService } from './ai/ai-review.service';
@Module({controllers:[ProcessingController],providers:[ProcessingService,AiClassificationService,AiClassificationRepository,AiReviewService]})
export class ProcessingModule {}
