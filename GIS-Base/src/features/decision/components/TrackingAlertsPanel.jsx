import { BellRing, Check, FileUp, Play, Square, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/Button.jsx';
import { reviewTrackingAlert, startTracking, stopTracking } from '../services/decisionApi.js';

export function TrackingAlertsPanel() {
  const [file, setFile] = useState(null);
  const [session, setSession] = useState(null);
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async () => { if (!file) { setError('اختر ملف تتبع JSON أولًا.'); return; } setBusy(true); setError(''); try { setSession(await startTracking(file)); setNotes({}); } catch (exception) { setError(exception?.response?.data?.message || 'تعذر بدء التتبع.'); } finally { setBusy(false); } };
  const stop = async () => { setBusy(true); setError(''); try { setSession(await stopTracking(session.id)); } catch (exception) { setError(exception?.response?.data?.message || 'تعذر إيقاف التتبع.'); } finally { setBusy(false); } };
  const review = async (alertId, decision) => { setBusy(true); setError(''); try { setSession(await reviewTrackingAlert(session.id, alertId, decision, notes[alertId] || '')); } catch (exception) { setError(exception?.response?.data?.message || 'تعذر حفظ قرار المراجعة.'); } finally { setBusy(false); } };
  return <section className="ops-panel tracking-panel">
    <header><div><span className="ops-kicker">التتبع والإنذارات</span><h3>تحليل ملف مواقع مرفوع</h3></div><BellRing size={20} /></header>
    <div className="tracking-controls"><label className="processing-file"><span>ملف نقاط التتبع</span><input type="file" accept=".json,application/json" onChange={(event) => setFile(event.target.files?.[0] || null)} /><span className="processing-file-value"><FileUp size={16} />{file?.name || 'اختر ملف JSON'}</span></label>{!session || session.status === 'stopped' ? <Button onClick={run} loading={busy}><Play size={17} />بدء التحليل</Button> : <Button variant="danger" onClick={stop} loading={busy}><Square size={16} />إيقاف</Button>}</div>
    {error && <p className="decision-inline-error">{error}</p>}
    {session && <div className="tracking-summary"><span>{session.pointsCount} نقطة</span><span>{session.alerts.length} إنذار</span><span>{session.status === 'running' ? 'قيد المراجعة' : 'متوقف'}</span></div>}
    {session?.alerts.length > 0 && <div className="decision-records">{session.alerts.map((alert) => <div className="decision-record tracking-alert" key={alert.id}><div><strong>{alert.reason}</strong><span>{new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium', timeStyle: 'short', hour12: true }).format(new Date(alert.timestamp))}</span></div><b>{alert.severity === 'high' ? 'مرتفع' : 'متوسط'}</b>{alert.status === 'pending' ? <div className="decision-review-row"><input className="decision-review-note" value={notes[alert.id] || ''} maxLength={500} onChange={(event) => setNotes((current) => ({ ...current, [alert.id]: event.target.value }))} placeholder="ملاحظة اختيارية" aria-label="ملاحظة مراجعة الإنذار" /><div className="tracking-review-actions"><Button iconOnly size="compact" variant="success" aria-label="قبول الإنذار" onClick={() => review(alert.id, 'accepted')}><Check size={16} /></Button><Button iconOnly size="compact" variant="danger" aria-label="رفض الإنذار" onClick={() => review(alert.id, 'rejected')}><X size={16} /></Button></div></div> : <div className="review-summary"><span className="review-state">{alert.status === 'accepted' ? 'مقبول' : 'مرفوض'}</span>{alert.reviewNote && <small>{alert.reviewNote}</small>}</div>}</div>)}</div>}
  </section>;
}