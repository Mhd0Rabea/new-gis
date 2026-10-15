import { Activity, BellRing, Check, ClipboardCheck, Image, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/Button.jsx';
import {
  getChanges,
  getForecasts,
  getTrackingSessions,
  reviewChange,
  reviewForecast,
  reviewTrackingAlert,
} from '../services/decisionApi.js';

const errorMessage = (error) => error?.response?.data?.message || 'تعذر تحميل نتائج المراجعة المحفوظة.';
const itemKey = (item) => `${item.type}:${item.id}`;

export function DecisionReviewQueue() {
  const [records, setRecords] = useState({ sessions: [], forecasts: [], changes: [] });
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [sessions, forecasts, changes] = await Promise.all([
        getTrackingSessions(),
        getForecasts(),
        getChanges(),
      ]);
      setRecords({ sessions, forecasts, changes });
    } catch (exception) {
      setError(errorMessage(exception));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([getTrackingSessions(), getForecasts(), getChanges()])
      .then(([sessions, forecasts, changes]) => {
        if (active) setRecords({ sessions, forecasts, changes });
      })
      .catch((exception) => {
        if (active) setError(errorMessage(exception));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const pending = useMemo(() => [
    ...records.sessions.flatMap((session) => session.alerts
      .filter((alert) => alert.status === 'pending')
      .map((alert) => ({ ...alert, type: 'tracking', sessionId: session.id, sourceFileName: session.sourceFileName }))),
    ...records.forecasts.filter((item) => item.reviewStatus === 'pending').map((item) => ({ ...item, type: 'forecast' })),
    ...records.changes.filter((item) => item.reviewStatus === 'pending').map((item) => ({ ...item, type: 'change' })),
  ], [records]);

  const decide = async (item, decision) => {
    const key = itemKey(item);
    setBusyKey(key);
    setError('');
    setMessage('');
    try {
      const note = notes[key] || '';
      if (item.type === 'tracking') await reviewTrackingAlert(item.sessionId, item.id, decision, note);
      if (item.type === 'forecast') await reviewForecast(item.id, decision, note);
      if (item.type === 'change') await reviewChange(item.id, decision, note);
      setMessage(decision === 'accepted' ? 'تم قبول النتيجة وحفظ قرار المراجعة.' : 'تم رفض النتيجة وحفظ قرار المراجعة.');
      setNotes((current) => ({ ...current, [key]: '' }));
      await load(false);
    } catch (exception) {
      setError(exception?.response?.data?.message || 'تعذر حفظ قرار المراجعة.');
    } finally {
      setBusyKey('');
    }
  };

  return <section className="ops-panel decision-review-queue" aria-labelledby="decision-review-title">
    <header className="decision-review-header">
      <div className="decision-review-title"><ClipboardCheck size={21} /><div><span className="ops-kicker">مراجعة بشرية</span><h3 id="decision-review-title">نتائج بانتظار قرارك</h3></div></div>
      <div className="decision-review-status"><strong>{pending.length}</strong><span>معلّقة</span><button type="button" onClick={() => load()} disabled={loading} aria-label="تحديث قائمة المراجعة" title="تحديث قائمة المراجعة"><RefreshCw size={16} /></button></div>
    </header>
    {loading && <div className="decision-review-empty">جاري جلب النتائج المحفوظة…</div>}
    {!loading && error && <p className="decision-inline-error">{error}</p>}
    {!loading && !error && pending.length === 0 && <div className="decision-review-empty"><Check size={20} /><span>لا توجد نتائج معلّقة للمراجعة.</span></div>}
    {!loading && !error && pending.length > 0 && <div className="decision-review-grid">
      {pending.map((item) => {
        const key = itemKey(item);
        const icon = item.type === 'tracking' ? <BellRing size={18} /> : item.type === 'forecast' ? <Activity size={18} /> : <Image size={18} />;
        const label = item.type === 'tracking' ? 'إنذار تتبع' : item.type === 'forecast' ? 'توقع مؤشر' : 'كشف تغير';
        const title = item.type === 'tracking' ? item.reason : item.type === 'forecast' ? item.metric : item.summary;
        return <article className="decision-review-card" key={key}>
          <div className="decision-review-card-head"><span className={`decision-review-type is-${item.type}`}>{icon}{label}</span>{item.type === 'tracking' && <span className={`decision-severity is-${item.severity}`}>{item.severity === 'high' ? 'مرتفع' : 'متوسط'}</span>}</div>
          <h4>{title}</h4>
          {item.type === 'tracking' && <p>{item.sourceFileName}</p>}
          {item.type === 'forecast' && <div className="decision-review-metrics"><span>{item.scope}</span><strong dir="ltr">{item.baseline} → {item.forecast}</strong><small>الثقة {Math.round(item.confidence * 100)}%</small></div>}
          {item.type === 'change' && <div className="decision-review-metrics"><span>{item.baselineFileName} / {item.currentFileName}</span><strong dir="ltr">{item.changePercent}%</strong><small>الثقة {Math.round(item.confidence * 100)}%</small></div>}
          <label className="decision-review-field"><span>ملاحظة المراجع <small>اختيارية</small></span><input value={notes[key] || ''} maxLength={500} onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))} placeholder="أضف سبب القرار إن لزم" /></label>
          <div className="decision-review-actions"><Button variant="success" loading={busyKey === key} disabled={Boolean(busyKey)} onClick={() => decide(item, 'accepted')}><Check size={16} />قبول</Button><Button variant="danger" disabled={Boolean(busyKey)} onClick={() => decide(item, 'rejected')}><X size={16} />رفض</Button></div>
        </article>;
      })}
    </div>}
    {message && <p className="decision-review-message" role="status">{message}</p>}
  </section>;
}
