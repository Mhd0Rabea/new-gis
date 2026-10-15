import {
  Activity, AlertTriangle, ArrowLeft, CheckCircle2, Database, FileCog, Layers3,
  Map, Radar, RefreshCw, Route, ShieldAlert, Sparkles, TrendingUp,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadLayerSummaries } from '../features/operations/services/operationsData.js';
import { formatNumber } from '../features/operations/utils/formatters.js';
import { ErrorState, LoadingState } from '../components/StateViews.jsx';

const layerTone = ['mint', 'blue', 'violet', 'amber'];
const highRiskValues = new Set(['high', 'critical', 'مرتفع', 'حرج', 'عالي']);

function firstValue(properties, fields) {
  for (const field of fields) {
    const value = properties?.[field];
    if (value !== undefined && value !== null && value !== '') return String(value).trim();
  }
  return null;
}

function getRiskCount(rows) {
  return rows.reduce((sum, row) => sum + row.features.filter((feature) => {
    const value = firstValue(feature.properties, ['risk_level', 'threat_level', 'level', 'risk', 'security_level']);
    return value && highRiskValues.has(value.toLowerCase());
  }).length, 0);
}

function getRecentUpdates(rows) {
  return rows
    .flatMap((row) => row.features.map((feature) => ({
      layer: row.layer,
      name: firstValue(feature.properties, [row.layer.labelField, 'name', 'base_name']) ?? 'معلم دون تسمية',
      updatedAt: firstValue(feature.properties, ['updated_at', 'created_at', 'last_patrol', 'last_operation', 'last_detected']),
    })))
    .filter((item) => item.updatedAt)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium' }).format(date);
}

export function HomePage() {
  const [state, setState] = useState({ status: 'loading', rows: [], error: null });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loadLayerSummaries(controller.signal)
      .then((rows) => setState({ status: 'ready', rows, error: null }))
      .catch((error) => !controller.signal.aborted && setState({ status: 'error', rows: [], error: error.message }));
    return () => controller.abort();
  }, [retry]);

  const dashboard = useMemo(() => {
    const total = state.rows.reduce((sum, row) => sum + row.total, 0);
    const available = state.rows.filter((row) => !row.error);
    const unavailable = state.rows.filter((row) => row.error);
    const max = Math.max(1, ...state.rows.map((row) => row.total));
    return {
      total,
      available,
      unavailable,
      max,
      riskCount: getRiskCount(available),
      updates: getRecentUpdates(available),
      coverage: state.rows.length ? Math.round((available.length / state.rows.length) * 100) : 0,
    };
  }, [state.rows]);

  if (state.status === 'loading') return <LoadingState label="جاري بناء الصورة التشغيلية..." />;
  if (state.status === 'error') return <ErrorState message={state.error} onRetry={() => setRetry((value) => value + 1)} />;

  return <div className="dashboard-page">
    <section className="dashboard-command" aria-labelledby="command-title">
      <div className="dashboard-command-copy">
        <span className="dashboard-eyebrow"><Radar size={15} aria-hidden="true" /> صورة العمليات</span>
        <h2 id="command-title">البيانات جاهزة لقراءة القرار</h2>
        <p>ملخص مباشر من الطبقات المنشورة؛ يبدأ من الجاهزية وينتهي بالإجراء التالي.</p>
      </div>
      <div className="readiness-gauge" aria-label={`جاهزية الطبقات ${dashboard.coverage}%`}>
        <svg viewBox="0 0 42 42" aria-hidden="true"><circle className="gauge-track" cx="21" cy="21" r="16" /><circle className="gauge-value" cx="21" cy="21" r="16" pathLength="100" strokeDasharray={`${dashboard.coverage} 100`} /></svg>
        <div><strong>{dashboard.coverage}<small>%</small></strong><span>جاهزية الطبقات</span></div>
      </div>
      <Link className="dashboard-command-action" to="/map"><Map size={18} aria-hidden="true" /><span>الانتقال إلى الخريطة</span><ArrowLeft size={16} aria-hidden="true" /></Link>
    </section>

    <section className="dashboard-metrics" aria-label="المؤشرات التشغيلية">
      <article className="dashboard-metric metric-mint"><Layers3 aria-hidden="true" /><span>طبقات جاهزة</span><strong>{formatNumber(dashboard.available.length)}<small> / {formatNumber(state.rows.length)}</small></strong><p>{dashboard.unavailable.length ? `${formatNumber(dashboard.unavailable.length)} تحتاج استعادة اتصال` : 'جميع الطبقات متاحة للعرض'}</p></article>
      <article className="dashboard-metric metric-blue"><Database aria-hidden="true" /><span>المعالم المرصودة</span><strong>{formatNumber(dashboard.total)}</strong><p>إجمالي السجلات في الطبقات المنشورة</p></article>
      <article className="dashboard-metric metric-amber"><ShieldAlert aria-hidden="true" /><span>إشارات مرتفعة</span><strong>{formatNumber(dashboard.riskCount)}</strong><p>{dashboard.riskCount ? 'ضمن الحقول المصنفة في السجلات المعروضة' : 'لا توجد إشارة مرتفعة في العينة الحالية'}</p></article>
      <article className="dashboard-metric metric-violet"><Activity aria-hidden="true" /><span>مسار المعالجة</span><strong>جاهز</strong><p>المعالجة وسحابات النقاط متاحة عند الحاجة</p></article>
    </section>

    <section className="dashboard-grid">
      <article className="dashboard-panel dashboard-distribution">
        <header><div><span className="dashboard-eyebrow"><TrendingUp size={14} aria-hidden="true" /> توزيع البيانات</span><h3>أين تتركز المعالم؟</h3></div><Link to="/analytics" className="dashboard-text-link">تحليلات موسعة <ArrowLeft size={15} aria-hidden="true" /></Link></header>
        <div className="distribution-list">
          {state.rows.map((row, index) => <div className="distribution-row" key={row.layer.name}>
            <div className="distribution-label"><i className={`tone-${layerTone[index % layerTone.length]}`} aria-hidden="true" /><span>{row.layer.label}</span></div>
            <div className="distribution-bar" aria-label={`${row.layer.label}: ${formatNumber(row.total)} معلم`}><i style={{ width: `${Math.max(row.total ? 7 : 0, row.total / dashboard.max * 100)}%` }} /></div>
            <strong>{row.error ? 'غير متاح' : formatNumber(row.total)}</strong>
          </div>)}
        </div>
        <footer><span>المصدر: واجهة البيانات الحالية</span><span><Sparkles size={14} aria-hidden="true" /> قراءة وصفية</span></footer>
      </article>

      <article className="dashboard-panel dashboard-watchlist">
        <header><div><span className="dashboard-eyebrow"><AlertTriangle size={14} aria-hidden="true" /> قائمة المتابعة</span><h3>ما الذي يحتاج انتباهًا؟</h3></div><span className={`dashboard-status ${dashboard.unavailable.length ? 'is-warning' : ''}`}>{dashboard.unavailable.length ? 'مراجعة مطلوبة' : 'الوضع مستقر'}</span></header>
        <div className="watchlist-items">
          {dashboard.unavailable.map((row) => <div className="watchlist-item watchlist-alert" key={row.layer.name}><AlertTriangle aria-hidden="true" /><div><strong>{row.layer.label}</strong><span>{row.error}</span></div><Link to="/data" aria-label={`فتح إدارة بيانات ${row.layer.label}`} title="فتح إدارة البيانات"><ArrowLeft size={16} /></Link></div>)}
          {dashboard.riskCount > 0 && <div className="watchlist-item watchlist-risk"><ShieldAlert aria-hidden="true" /><div><strong>إشارات بحاجة مراجعة</strong><span>{formatNumber(dashboard.riskCount)} سجلًا يحمل مستوى مرتفعًا ضمن البيانات المقروءة</span></div><Link to="/data" aria-label="فتح إدارة البيانات لمراجعة السجلات" title="فتح إدارة البيانات"><ArrowLeft size={16} /></Link></div>}
          {!dashboard.unavailable.length && !dashboard.riskCount && <div className="watchlist-empty"><CheckCircle2 aria-hidden="true" /><strong>لا توجد عناصر تتطلب تدخلاً فوريًا</strong><span>استمر بمراجعة طبقات الخريطة أو شغّل تحليلًا وصفيًا.</span></div>}
        </div>
        <Link to="/data" className="dashboard-panel-action"><Database size={17} aria-hidden="true" />مراجعة البيانات<ArrowLeft size={16} aria-hidden="true" /></Link>
      </article>

      <article className="dashboard-panel dashboard-activity">
        <header><div><span className="dashboard-eyebrow"><RefreshCw size={14} aria-hidden="true" /> آخر نشاط مسجل</span><h3>تحديثات السجلات</h3></div></header>
        {dashboard.updates.length ? <ol className="activity-list">{dashboard.updates.map((item) => <li key={`${item.layer.name}-${item.name}-${item.updatedAt}`}><span className="activity-marker" aria-hidden="true" /><div><strong>{item.name}</strong><span>{item.layer.label}</span></div><time dateTime={item.updatedAt}>{formatDate(item.updatedAt)}</time></li>)}</ol> : <div className="activity-empty"><Route aria-hidden="true" /><span>لا يوجد حقل تحديث مؤرخ في السجلات المعروضة بعد.</span></div>}
      </article>

      <article className="dashboard-next-step">
        <div><span className="dashboard-eyebrow"><FileCog size={14} aria-hidden="true" /> الإجراء التالي</span><h3>هل لديك مخرج جديد أو سحابة نقاط؟</h3><p>انتقل إلى مركز المعالجة لتشغيل التحويل أو التصنيف، ثم راجع النتيجة بشريًا قبل اعتمادها.</p></div>
        <Link to="/processing"><span>فتح مركز المعالجة</span><ArrowLeft size={17} aria-hidden="true" /></Link>
      </article>
    </section>
  </div>;
}
