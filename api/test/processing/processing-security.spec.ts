import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProcessingService } from '../../src/processing/processing.service';

describe('ProcessingService security validation', () => {
 let service: ProcessingService;
 beforeEach(() => {
  service = new ProcessingService(new ConfigService({
   PROCESSING_TOOLS_BIN: 'C:/Program Files/QGIS 3.44.13/bin',
   PROCESSING_SAMPLES_DIR: 'C:/samples',
   PROCESSING_INPUT_DIR: 'C:/inputs',
   PROCESSING_WORK_DIR: 'C:/work',
  }));
 });

 it.each([
  ['unknown-operation', 'synthetic-idlib-dem.tif'],
  ['raster-info', '../secret.tif'],
  ['raster-info', 'C:/secret.tif'],
  ['raster-info', 'payload.exe'],
  ['raster-info', 'synthetic-idlib-cloud.las'],
  ['point-cloud-info', 'synthetic-idlib-dem.tif'],
 ])('rejects operation %s with input %s', (operation, inputFile) => {
  expect(() => service.create(operation, inputFile)).toThrow(BadRequestException);
 });
});

