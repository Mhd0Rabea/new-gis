import { useEffect, useState } from 'react';
import { loadLayerSummaries } from '../features/operations/services/operationsData.js';
import { AnalyticsCharts } from '../features/operations/components/AnalyticsCharts.jsx';
import { LoadingState } from '../components/StateViews.jsx';
export function AnalyticsPage() {
 const [rows,setRows]=useState(null); useEffect(()=>{const c=new AbortController();loadLayerSummaries(c.signal).then(setRows);return()=>c.abort()},[]);
 if(!rows)return <LoadingState />;
 return <div className="ops-page"><section className="ops-panel"><div className="panel-head"><div><span className="ops-kicker">مقارنة وصفية</span><h2>المعالم حسب الطبقة</h2></div><small>المصدر: واجهة البيانات الحالية</small></div><AnalyticsCharts rows={rows}/></section><section className="analysis-note"><strong>قراءة وصفية فقط</strong><span>لا تتضمن هذه المؤشرات تنبؤاً أو تصنيفاً آلياً.</span></section></div>;
}
