import { AiClass, EvaluationMetrics, PerClassMetric } from './ai-classification.types';
const classes:Exclude<AiClass,'unknown'>[]=['ground','building','vegetation','vehicle'];
export function evaluatePredictions(truth:Exclude<AiClass,'unknown'>[],predicted:AiClass[]):EvaluationMetrics{
 const matrix:Record<string,Record<string,number>>=Object.fromEntries(classes.map(c=>[c,Object.fromEntries([...classes,'unknown'].map(p=>[p,0]))]));truth.forEach((value,index)=>{matrix[value][predicted[index]]=(matrix[value][predicted[index]]??0)+1});
 const perClass:Record<string,PerClassMetric>={};let correct=0,unknown=0;
 for(const c of classes){const tp=matrix[c][c];correct+=tp;const fp=classes.reduce((sum,t)=>sum+(t===c?0:matrix[t][c]),0);const fn=Object.values(matrix[c]).reduce((a,b)=>a+b,0)-tp;const precision=tp/(tp+fp||1),recall=tp/(tp+fn||1);perClass[c]={precision,recall,f1:2*precision*recall/(precision+recall||1),support:truth.filter(v=>v===c).length};}
 unknown=predicted.filter(v=>v==='unknown').length;const macroF1=classes.reduce((sum,c)=>sum+perClass[c].f1,0)/classes.length;
 return{confusionMatrix:matrix,perClass,macroF1,accuracy:correct/(truth.length||1),abstentionRate:unknown/(truth.length||1),passed:macroF1>=.8&&classes.every(c=>perClass[c].support>0)};
}
