import { AiClass, FeatureVector } from './ai-classification.types';
export const BASELINE_VERSION='explicit-rules-v1';
export function classifyByRules(f:FeatureVector):AiClass{
 if(f.relativeHeight<0.12&&f.verticalSpread<0.18)return'ground';
 if(f.relativeHeight>0.62&&f.verticalSpread<0.3)return'building';
 if(f.verticalSpread>0.42&&f.green>f.red)return'vegetation';
 if(f.relativeHeight<0.38&&f.intensity>0.65&&f.localDensity>0.55)return'vehicle';
 return'unknown';
}
