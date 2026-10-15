import { getLayerDefinition } from '../features/layers.config';

type DomainEntry={value:number;labels:string[]};
export type ImportValidationIssue={severity:'warning'|'error';field?:string;code:string;message:string;value?:unknown};
const DOMAINS:Record<string,DomainEntry[]>={
 base_type:[{value:1,labels:['land base','قاعدة برية','برية']},{value:2,labels:['air base','قاعدة جوية','جوية']},{value:3,labels:['naval base','قاعدة بحرية','بحرية']},{value:4,labels:['command center','مركز قيادة','قيادة']},{value:5,labels:['training camp','معسكر تدريب','تدريب']}],
 status:[{value:1,labels:['active','نشط','نشطة']},{value:2,labels:['reserve','احتياط']},{value:3,labels:['damaged','متضرر','متضررة']},{value:4,labels:['closed','مغلق','مغلقة']}],
 security_level:[{value:1,labels:['low','منخفض','منخفضة']},{value:2,labels:['medium','متوسط','متوسطة']},{value:3,labels:['high','عالي','عالية','مرتفع','مرتفعة']}]
};
const ALIASES:Record<string,string>={baseid:'source_id',base_id:'source_id',objectid:'source_id',globalid:'source_id'};
const INTEGER_FIELDS=new Set(['soldiers_count','vehicles_count','personnel','daily_vehicles','troops_count','checkpoints_count','enemy_count','convoys_count','capacity','runways','aircraft_capacity']);
const NUMBER_FIELDS=new Set(['area_size','elevation','length_km','travel_time','security_percentage','danger_percentage','fill_percentage','temperature','coverage','signal_strength']);
const DATE_FIELDS=new Set(['last_operation','last_detected','last_supply','last_inventory','last_maintenance','last_inspection','last_patrol','arrival_time']);

export function normalizeImportProperties(layerName:string,input:Record<string,unknown>){
 const layer=getLayerDefinition(layerName);if(!layer)throw new Error('الطبقة غير معتمدة.');
 const normalized:Record<string,unknown>={},unknown:string[]=[],transformations:Array<{field:string;from:unknown;to:unknown}>=[];
 for(const [raw,value] of Object.entries(input??{})){
  const key=raw.trim().replace(/([a-z])([A-Z])/g,'$1_$2').replace(/[\s-]+/g,'_').toLowerCase();
  const canonical=ALIASES[key]??key;
  if(canonical==='source_id'){normalized.source_id=value==null?null:String(value);continue}
  if(!layer.editableFields.includes(canonical)){unknown.push(raw);continue}
  const converted=normalizeDomain(canonical,value);normalized[canonical]=converted;
  if(converted!==value)transformations.push({field:canonical,from:value,to:converted});
 }
 return{normalized,unknown,transformations};
}

export function validateImportProperties(properties:Record<string,unknown>):ImportValidationIssue[]{
 const issues:ImportValidationIssue[]=[];
 for(const [field,value] of Object.entries(properties)){
  if(value===null||value===undefined||value==='')continue;
  if(DOMAINS[field]&&!DOMAINS[field].some(entry=>entry.value===value))issues.push({severity:'error',field,code:'domain',message:`القيمة غير معتمدة ضمن دومين الحقل: ${field}`,value});
  else if(INTEGER_FIELDS.has(field)&&(!Number.isInteger(Number(value))||Number(value)<0))issues.push({severity:'error',field,code:'integer',message:`يجب أن تكون قيمة ${field} عددًا صحيحًا غير سالب.`,value});
  else if(NUMBER_FIELDS.has(field)&&!Number.isFinite(Number(value)))issues.push({severity:'error',field,code:'number',message:`يجب أن تكون قيمة ${field} رقمًا صالحًا.`,value});
  else if(DATE_FIELDS.has(field)&&Number.isNaN(Date.parse(String(value))))issues.push({severity:'error',field,code:'date',message:`تاريخ غير صالح في الحقل: ${field}`,value});
  else if(typeof value==='string'&&value.length>(field==='notes'?4000:255))issues.push({severity:'error',field,code:'length',message:`تجاوزت قيمة ${field} الحد المسموح.`,value});
 }
 return issues;
}

function normalizeDomain(field:string,value:unknown){
 if(value===null||value===undefined||value==='')return null;
 const entries=DOMAINS[field];if(!entries)return value;
 if(typeof value==='number')return value;
 const text=String(value).trim().toLowerCase();
 for(const entry of entries)if(entry.labels.some(label=>text===label||text.includes(label)))return entry.value;
 const numeric=Number(text);return Number.isFinite(numeric)?numeric:value;
}
