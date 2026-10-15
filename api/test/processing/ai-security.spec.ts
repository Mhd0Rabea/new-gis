import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProcessingService } from '../../src/processing/processing.service';
describe('AI processing security',()=>{const service=new ProcessingService(new ConfigService({PROCESSING_TOOLS_BIN:'C:/tools',PROCESSING_INPUT_DIR:'C:/inputs',PROCESSING_WORK_DIR:'C:/work'}));it.each(['../secret.las','C:/secret.las','real-site.csv','sample.tif'])('rejects unsafe AI input %s',input=>{expect(()=>service.create('ai-point-classification',input,{modelVersionId:'point-centroid-v1'})).toThrow(BadRequestException)});});
