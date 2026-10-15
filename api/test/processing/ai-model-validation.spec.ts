import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ModelVersion } from '../../src/processing/ai/ai-classification.types';
describe('AI model contract',()=>{
 const model=JSON.parse(readFileSync(path.resolve(process.cwd(),'models','point-classifier-v1.json'),'utf8').replace(/^\uFEFF/,'')) as ModelVersion;
 const training=JSON.parse(readFileSync(path.resolve(process.cwd(),'..','gis','samples','ai','synthetic-point-training.json'),'utf8').replace(/^\uFEFF/,''));
 const test=JSON.parse(readFileSync(path.resolve(process.cwd(),'..','gis','samples','ai','synthetic-point-test.json'),'utf8').replace(/^\uFEFF/,''));
 it('documents version, four classes, features and threshold',()=>{expect(model.version).toMatch(/^\d+\.\d+\.\d+$/);expect(model.classes).toEqual(['ground','building','vegetation','vehicle']);expect(model.featureSchema).toHaveLength(7);expect(model.confidenceThreshold).toBe(.7);expect(model.trainingDatasetId).toBe(training.datasetId);});
 it('keeps training and test identities separate and balanced',()=>{const ids=new Set(training.points.map((p:{id:string})=>p.id));expect(test.points.every((p:{id:string})=>!ids.has(p.id))).toBe(true);for(const label of model.classes)expect(test.points.filter((p:{label:string})=>p.label===label)).toHaveLength(50);});
});
