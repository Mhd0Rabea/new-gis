import { AlertTriangle, Check, Code2, Database, Download, FileSearch, FileUp, GitCompare, History, RefreshCw, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/Button.jsx';
import { useToast } from '../../components/Toast.jsx';
import { formatPropertyValue, getArabicFieldLabel } from '../map/config/fieldPresentation.js';
import { publishedLayers } from '../map/config/layers.js';
import { commitImportBatch, createImportBatch, deleteImportBatch, importReportUrl, listImportBatches, loadImportBatch, rejectImportBatch, revalidateImportBatch, saveImportDecisions } from './importsApi.js';

const statusLabels={review:'تحتاج مراجعة',ready:'جاهزة',committed:'معتمدة',rejected:'مرفوضة',failed:'فاشلة'};
const formatDate=value=>value?new Intl.DateTimeFormat('ar-SY',{dateStyle:'medium',timeStyle:'short',hour12:true}).format(new Date(value)):'—';

export function ImportWizard({onImported,onClose}){
 const toast=useToast(),[layer,setLayer]=useState(publishedLayers[0].name),[file,setFile]=useState(null),[source,setSource]=useState(''),[batch,setBatch]=useState(null),[busy,setBusy]=useState(false),[result,setResult]=useState(null),[history,setHistory]=useState([]);
 const duplicates=useMemo(()=>batch?.features?.filter(feature=>feature.duplicate_kind!=='none')??[],[batch]);
 const issues=useMemo(()=>batch?.features?.flatMap(feature=>feature.issues??[])??[],[batch]);
 const refreshHistory=()=>listImportBatches().then(setHistory).catch(()=>setHistory([]));
 useEffect(()=>{void refreshHistory()},[]);
 async function inspect(){if(!file)return toast.error('اختر ملف GeoJSON أولًا.');setBusy(true);try{const data=await createImportBatch(layer,file,source.trim()||file.name);setBatch(data);await refreshHistory();toast.success('اكتمل الفحص دون تعديل الطبقة التشغيلية.')}catch(error){toast.error(error?.response?.data?.message??'تعذر فحص الملف.')}finally{setBusy(false)}}
 async function decision(feature,action,matchedFeatureId){setBusy(true);try{setBatch(await saveImportDecisions(batch.id,[{stagedFeatureId:feature.id,action,matchedFeatureId}]))}catch(error){toast.error(error?.response?.data?.message??'تعذر حفظ القرار.')}finally{setBusy(false)}}
 async function commit(){setBusy(true);try{const data=await commitImportBatch(batch.id);setResult(data);onImported?.();await refreshHistory();toast.success('اعتمدت الدفعة كاملة بنجاح.')}catch(error){toast.error(error?.response?.data?.message??'تعذر اعتماد الدفعة.')}finally{setBusy(false)}}
 async function reject(){setBusy(true);try{await rejectImportBatch(batch.id,'رفضها المراجع');setBatch(null);await refreshHistory();toast.info('رُفضت الدفعة دون تغيير البيانات التشغيلية.')}catch(error){toast.error(error?.response?.data?.message??'تعذر رفض الدفعة.')}finally{setBusy(false)}}
 async function recheck(){setBusy(true);try{setBatch(await revalidateImportBatch(batch.id));toast.success('أعيد فحص الدفعة من البيانات المرحلية المحفوظة.')}catch(error){toast.error(error?.response?.data?.message??'تعذر إعادة الفحص.')}finally{setBusy(false)}}
 async function remove(){setBusy(true);try{await deleteImportBatch(batch.id);setBatch(null);await refreshHistory();toast.info('حُذفت الدفعة المرحلية.')}catch(error){toast.error(error?.response?.data?.message??'تعذر حذف الدفعة.')}finally{setBusy(false)}}
 async function openBatch(id){setBusy(true);try{setBatch(await loadImportBatch(id));setResult(null)}catch(error){toast.error(error?.response?.data?.message??'تعذر فتح الدفعة.')}finally{setBusy(false)}}
 if(result)return <div className="import-wizard"><div className="import-result"><Check size={28}/><strong>اكتمل الاعتماد</strong><div className="import-metrics"><span>أضيف <b>{result.created}</b></span><span>حُدث <b>{result.updated}</b></span><span>تُخطّي <b>{result.skipped}</b></span></div></div><Button onClick={onClose}>إغلاق</Button></div>;
 return <div className="import-wizard">
  <ol className="import-steps"><li className={!batch?'is-active':'is-done'}><FileUp size={16}/>الرفع</li><li className={batch?'is-active':''}><FileSearch size={16}/>الفحص والمراجعة</li><li><Database size={16}/>الاعتماد</li></ol>
  {!batch?<><div className="import-upload-grid">
   <label>الطبقة المستهدفة<select value={layer} onChange={event=>setLayer(event.target.value)}>{publishedLayers.map(item=><option key={item.name} value={item.name}>{item.label}</option>)}</select></label>
   <label>اسم المصدر<input value={source} onChange={event=>setSource(event.target.value)} placeholder="مثال: مسح ميداني أكتوبر"/></label>
   <label className="import-file">ملف GeoJSON<input type="file" accept=".geojson,.json,application/geo+json" onChange={event=>setFile(event.target.files?.[0]??null)}/><span><FileUp size={18}/>{file?.name??'اختر ملفًا حقيقيًا'}</span></label>
   <Button fullWidth loading={busy} onClick={inspect}><FileSearch size={17}/>فحص الملف</Button>
  </div><section className="import-history"><h3><History size={17}/>سجل الدفعات</h3>{history.length?<div>{history.map(item=><button type="button" key={item.id} onClick={()=>openBatch(item.id)}><span><b>{item.file_name}</b><small>{item.layer_name} · {formatDate(item.created_at)}</small></span><code>{statusLabels[item.status]??item.status}</code></button>)}</div>:<p>لا توجد دفعات محفوظة بعد.</p>}</section></>:<div className="import-review">
   <header className="import-batch-head"><div><strong>{batch.file_name}</strong><span>{batch.layer_name} · {formatDate(batch.created_at)}</span></div><code>{statusLabels[batch.status]??batch.status}</code></header>
   <div className="import-summary"><span>الإجمالي<b>{batch.totals.total}</b></span><span>صالح<b>{batch.totals.valid}</b></span><span>أخطاء<b>{batch.totals.invalid}</b></span><span>تكرارات<b>{batch.totals.duplicates}</b></span></div>
   {issues.length?<div className="import-issues"><AlertTriangle size={18}/><div><strong>ملاحظات الفحص</strong>{issues.slice(0,8).map((issue,index)=><span key={index}>{getArabicFieldLabel(issue.field)}: {issue.message}</span>)}</div></div>:null}
   <section className="import-normalized"><h3><Code2 size={17}/>معاينة القيم المطبّعة</h3>{batch.features.slice(0,8).map(feature=><article key={feature.id}><b>المعلم {feature.feature_index}</b><div>{Object.entries(feature.normalized_properties??{}).slice(0,8).map(([key,value])=><span key={key}><small>{getArabicFieldLabel(key)}</small><code>{formatPropertyValue(key,value).text}</code></span>)}</div>{feature.transformations?.length?<p>{feature.transformations.map(item=><span key={item.field}><code>{String(item.from)}</code> ← <code>{String(item.to)}</code></span>)}</p>:null}</article>)}</section>
   {duplicates.length?<div className="import-duplicates"><h3><GitCompare size={18}/>قرارات التكرار</h3>{duplicates.map(feature=><div className="duplicate-row" key={feature.id}><span>المعلم {feature.feature_index} · {feature.duplicate_kind==='exact'?'تطابق مؤكد':'تطابق محتمل'}{feature.duplicate_candidates?.length>1?` · ${feature.duplicate_candidates.length} مرشحين`:''}</span>{feature.duplicate_candidates?.length>1?<select aria-label="السجل المطابق" value={feature.matched_feature_id??''} onChange={event=>decision(feature,feature.action??'update',event.target.value)}>{feature.duplicate_candidates.map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.id}</option>)}</select>:null}<select value={feature.action??''} onChange={event=>decision(feature,event.target.value,feature.matched_feature_id)}><option value="" disabled>اختر القرار</option><option value="update">تحديث الموجود</option><option value="create">إنشاء جديد</option><option value="skip">تجاهل</option></select></div>)}</div>:null}
   <div className="import-tools"><a className="button button-secondary" href={importReportUrl(batch.id)}><Download size={16}/>تنزيل التقرير</a>{!['committed','rejected'].includes(batch.status)?<><Button variant="secondary" onClick={recheck} disabled={busy}><RefreshCw size={16}/>إعادة الفحص</Button><Button variant="secondary" onClick={remove} disabled={busy}><Trash2 size={16}/>حذف الدفعة</Button></>:null}</div>
   {!['committed','rejected'].includes(batch.status)?<div className="import-actions"><Button variant="danger" disabled={busy} onClick={reject}><X size={17}/>رفض الدفعة</Button><Button loading={busy} disabled={batch.status!=='ready'} onClick={commit}><Check size={17}/>اعتماد الدفعة</Button></div>:null}
   {batch.status!=='ready'&&!['committed','rejected'].includes(batch.status)?<p className="import-hint">عالج الأخطاء وحدد قرارًا لكل تكرار قبل الاعتماد.</p>:null}
  </div>}
 </div>
}
