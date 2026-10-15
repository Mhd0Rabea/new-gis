import { AiClass, ClassificationPrediction, FeatureVector, ModelVersion } from './ai-classification.types';
const keys:(keyof FeatureVector)[]=['relativeHeight','localDensity','verticalSpread','intensity','red','green','blue'];
export function classifyPoint(features:FeatureVector,model:ModelVersion,threshold=model.confidenceThreshold):ClassificationPrediction{
 const vector=keys.map((key,index)=>(features[key]-model.normalization.means[index])/(model.normalization.standardDeviations[index]||1));
 const ranked=model.classes.map(label=>({label,distance:Math.sqrt(model.centroids[label].reduce((sum,value,index)=>sum+(vector[index]-value)**2,0))})).sort((a,b)=>a.distance-b.distance);
 const margin=(ranked[1].distance-ranked[0].distance)/(ranked[1].distance+ranked[0].distance+Number.EPSILON);const confidence=Math.max(0,Math.min(1,0.5+margin));
 return{predictedClass:(confidence>=threshold?ranked[0].label:'unknown') as AiClass,confidence:Number((confidence*100).toFixed(2)),distances:Object.fromEntries(ranked.map(item=>[item.label,Number(item.distance.toFixed(6))]))};
}
