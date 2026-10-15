import { Activity, Check, FileUp, Play, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/Button.jsx';
import { analyzeForecast, reviewForecast } from '../services/decisionApi.js';

async function validateIndicatorFile(file) {
  try {
    const document = JSON.parse(await file.text());
    const validPeriod = document?.period?.start && document?.period?.end;
    if (!document?.metric || !document?.scope || !validPeriod || !Array.isArray(document?.values) || document.values.length < 3) {
      return 'الملف المختار ليس ملف مؤشرات. يلزم JSON يحتوي على: metric وscope وperiod وvalues (3 قيم على الأقل).';
    }
    return '';
  } catch {
    return 'تعذر قراءة الملف. اختر ملف JSON صالحًا مخصصًا للمؤشرات، وليس نسخة احتياطية لطبقة.';
  }
}

export function ForecastPanel() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectFile = (event) => {
    setFile(event.target.files?.[0] || null);
    setError('');
  };

  const analyze = async () => {
    if (!file) { setError('اختر ملف مؤشرات JSON أولًا.'); return; }
    setBusy(true);
    setError('');
    const validationError = await validateIndicatorFile(file);
    if (validationError) {
      setError(validationError);
      setBusy(false);
      return;
    }
    try {
      setResult(await analyzeForecast(file));
      setReviewNote('');
    } catch (exception) {
      setError(exception?.response?.data?.message || 'تعذر احتساب المؤشر.');
    } finally {
      setBusy(false);
    }
  };

  const review = async (decision) => {
    setBusy(true);
    setError('');
    try {
      setResult(await reviewForecast(result.id, decision, reviewNote));
    } catch (exception) {
      setError(exception?.response?.data?.message || 'تعذر حفظ المراجعة.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="ops-panel forecast-panel"><header><div><span className="ops-kicker">تحليل جديد</span><h3>احتساب توقع من ملف مؤشرات</h3></div><Activity size={20} /></header>
    <div className="tracking-controls"><label className="processing-file"><span>ملف المؤشرات JSON</span><input type="file" accept=".json,application/json" onChange={selectFile} /><span className="processing-file-value"><FileUp size={16} />{file?.name || 'اختر ملف مؤشرات'}</span></label><Button onClick={analyze} loading={busy}><Play size={17} />احتساب الاتجاه</Button></div>
    <p className="decision-file-hint">الحقول المطلوبة: <code>metric · scope · period · values</code></p>
    {error && <p className="decision-inline-error">{error}</p>}
    {result && <div className="forecast-result"><div><span>المؤشر</span><strong>{result.metric}</strong></div><div><span>النطاق</span><strong>{result.scope}</strong></div><div><span>الفترة</span><strong>{new Intl.DateTimeFormat('ar-SY', { dateStyle: 'medium' }).formatRange(new Date(result.periodStart), new Date(result.periodEnd))}</strong></div><div><span>خط الأساس</span><strong>{result.baseline}</strong></div><div><span>التوقع التالي</span><strong>{result.forecast}</strong></div><div><span>الثقة</span><strong>{Math.round(result.confidence * 100)}%</strong></div><p>{result.constraints.join(' ')}</p>{result.reviewStatus === 'pending' ? <div className="decision-review-row"><input className="decision-review-note" value={reviewNote} maxLength={500} onChange={(event) => setReviewNote(event.target.value)} placeholder="ملاحظة المراجع (اختيارية)" aria-label="ملاحظة مراجعة التوقع" /><div className="forecast-review"><Button variant="success" onClick={() => review('accepted')}><Check size={16} />قبول</Button><Button variant="danger" onClick={() => review('rejected')}><X size={16} />رفض</Button></div></div> : <div className="review-summary"><span className="review-state">{result.reviewStatus === 'accepted' ? 'مقبول بشريًا' : 'مرفوض بشريًا'}</span>{result.reviewNote && <small>{result.reviewNote}</small>}</div>}</div>}
  </section>;
}
