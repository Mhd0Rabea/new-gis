import { BrainCircuit, Database, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RiskAssessmentPanel } from '../features/decision/components/RiskAssessmentPanel.jsx';
import { RouteReadinessPanel } from '../features/decision/components/RouteReadinessPanel.jsx';
import { TrackingAlertsPanel } from '../features/decision/components/TrackingAlertsPanel.jsx';
import { ForecastPanel } from '../features/decision/components/ForecastPanel.jsx';
import { ChangeAnalysisPanel } from '../features/decision/components/ChangeAnalysisPanel.jsx';
import { DecisionReviewQueue } from '../features/decision/components/DecisionReviewQueue.jsx';
import { getRiskAssessments, getRouteReadiness } from '../features/decision/services/decisionApi.js';

export function DecisionCenterPage() {
  const [state, setState] = useState({ loading: true, risks: [], routes: [], error: '' });
  useEffect(() => { let active = true; Promise.all([getRiskAssessments(), getRouteReadiness()]).then(([risks, routes]) => active && setState({ loading: false, risks, routes, error: '' })).catch((error) => active && setState({ loading: false, risks: [], routes: [], error: error?.response?.data?.message || 'تعذر قراءة الطبقات المرفوعة حاليًا.' })); return () => { active = false; }; }, []);
  const isEmpty = !state.loading && !state.error && !state.risks.length && !state.routes.length;
  return <div className="ops-page decision-page">
    <section className="data-pulse"><div><span className="ops-kicker">المرحلة 010</span><h2>مركز القرار المكاني</h2><p>مؤشرات قابلة للمراجعة تُحتسب من البيانات المحلية التي رفعتها فقط.</p></div><BrainCircuit size={36} /></section>
    {state.loading && <section className="ops-panel decision-loading">جاري احتساب مؤشرات البيانات المرفوعة…</section>}
    {state.error && <section className="ops-panel decision-error"><p>{state.error}</p><Link className="button button-primary" to="/data"><Database size={17} />إدارة البيانات</Link></section>}
    {isEmpty && <section className="ops-panel decision-empty-state"><ShieldAlert size={28} /><div><span className="ops-kicker">لا توجد نتائج افتراضية</span><h3>لا توجد طبقات تشغيلية كافية للتحليل</h3><p>ارفع قطاعات العمليات أو مسارات الدوريات من صفحة إدارة البيانات.</p></div><Link className="button button-primary" to="/data"><Database size={17} />رفع البيانات</Link></section>}
    {!state.loading && !state.error && !isEmpty && <section className="decision-grid" aria-label="تقييم المخاطر والجاهزية">{state.risks.length > 0 && <RiskAssessmentPanel risks={state.risks} />}{state.routes.length > 0 && <RouteReadinessPanel routes={state.routes} />}</section>}
    <DecisionReviewQueue />
    <section className="decision-tools-grid" aria-label="أدوات التحليل المكاني">
      <TrackingAlertsPanel />
      <ForecastPanel />
      <ChangeAnalysisPanel />
    </section>
  </div>;
}