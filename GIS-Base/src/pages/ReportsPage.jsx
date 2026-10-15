import { Download, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { publishedLayers } from '../features/map/config/layers.js';
import { getArabicFieldLabel } from '../features/map/config/fieldPresentation.js';
import { loadLayerPage } from '../features/operations/services/operationsData.js';
import { displayValue } from '../features/operations/utils/formatters.js';
import { createCsv, downloadCsv } from '../features/operations/utils/csv.js';
import { Button } from '../components/Button.jsx';
export function ReportsPage() {
 const [layerName,setLayerName]=useState(publishedLayers[0].name); const [features,setFeatures]=useState([]); const layer=publishedLayers.find((item)=>item.name===layerName); const fields=layer.editableFields.slice(0,6);
 useEffect(()=>{const c=new AbortController();loadLayerPage(layerName,{limit:100,signal:c.signal}).then((data)=>setFeatures(data.features??[])).catch((error)=>{if(!c.signal.aborted){console.error('تعذر تحميل بيانات التقرير',error);setFeatures([])}});return()=>c.abort()},[layerName]);
 const download=()=>downloadCsv(layerName+'.csv',createCsv(fields.map(getArabicFieldLabel),features.map((feature)=>fields.map((field)=>displayValue(feature.properties?.[field])))));
 return <div className="ops-page report-page"><section className="ops-panel report-controls"><label>طبقة التقرير<select value={layerName} onChange={(e)=>setLayerName(e.target.value)}>{publishedLayers.map((item)=><option key={item.name} value={item.name}>{item.label}</option>)}</select></label><div><Button variant="secondary" size="compact" onClick={()=>window.print()}><Printer size={17} aria-hidden="true"/>طباعة</Button><Button size="compact" onClick={download}><Download size={17} aria-hidden="true"/>تنزيل CSV</Button></div></section><section className="ops-panel report-sheet"><header><span>MGOS</span><h2>{layer.label}</h2><p>تقرير تشغيلي من البيانات التدريبية</p></header><table className="data-table"><thead><tr>{fields.map((field)=><th key={field}>{getArabicFieldLabel(field)}</th>)}</tr></thead><tbody>{features.map((feature)=><tr key={feature.id}>{fields.map((field)=><td key={field}>{displayValue(feature.properties?.[field])}</td>)}</tr>)}</tbody></table></section></div>;
}
