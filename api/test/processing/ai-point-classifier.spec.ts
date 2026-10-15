import { readFileSync } from 'node:fs';
import path from 'node:path';
import { classifyPoint } from '../../src/processing/ai/point-classifier';
import { FeatureVector, ModelVersion } from '../../src/processing/ai/ai-classification.types';
describe('point classifier',()=>{const model=JSON.parse(readFileSync(path.resolve(process.cwd(),'models','point-classifier-v1.json'),'utf8').replace(/^\uFEFF/,'')) as ModelVersion;it.each(Object.entries(model.centroids))('classifies centroid %s',(label,values)=>{const f=Object.fromEntries(model.featureSchema.map((key,index)=>[key,values[index]])) as FeatureVector;expect(classifyPoint(f,model).predictedClass).toBe(label)});it('abstains when threshold is above ambiguous confidence',()=>{const f={relativeHeight:.4,localDensity:.5,verticalSpread:.3,intensity:.5,red:.4,green:.4,blue:.4};expect(classifyPoint(f,model,.95).predictedClass).toBe('unknown')});});
