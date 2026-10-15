import { BadgeCheck, Check, FileCheck2, FileDown, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/Button.jsx';
import { downloadAiArtifact, reviewAiClassification } from '../services/processingApi.js';

const labels = { ground: 'أرض', building: 'مبنى', vegetation: 'غطاء نباتي', vehicle: 'مركبة', unknown: 'غير محدد' };

export function ClassificationReview({ result, onReviewed, onError }) {
  const [selected, setSelected] = useState(result?.features?.[0]?.sourcePointId ?? '');
  const [reviewedClass, setReviewedClass] = useState('ground');
  if (!result) return null;
  const feature = result.features.find(item => item.sourcePointId === selected) ?? result.features[0];
  const selectedValue = feature?.sourcePointId ?? '';
  const send = async (decision, whole = false) => {
    try {
      await reviewAiClassification(result.id, { featureId: whole ? undefined : feature?.sourcePointId, decision, reviewedClass: decision === 'correct' ? reviewedClass : undefined });
      await onReviewed();
    } catch (error) { onError(error?.response?.data?.message ?? 'تعذر حفظ قرار المراجعة.'); }
  };
  const download = async reviewed => {
    try { await downloadAiArtifact(result.id, reviewed); }
    catch (error) { onError(error?.response?.data?.message ?? 'تعذر تنزيل النتيجة.'); }
  };

  return <section className="ops-panel ai-review">
    <div className="panel-head"><div><span className="ops-kicker">مراجعة بشرية</span><h3>قرار المراجع</h3></div><span className={`review-state ${result.status}`}>{result.status === 'approved' ? 'معتمدة' : result.status === 'rejected' ? 'مرفوضة' : result.status === 'in_review' ? 'قيد المراجعة' : 'مؤقتة'}</span></div>
    <div className="review-fields">
      <label className="review-field"><span>النقطة</span><select value={selectedValue} onChange={event => setSelected(event.target.value)}>{result.features.map(item => <option key={item.sourcePointId} value={item.sourcePointId}>{item.sourcePointId} — {labels[item.reviewedClass ?? item.predictedClass]} ({item.confidence}%)</option>)}</select></label>
      <label className="review-field"><span>تصحيح إلى</span><select value={reviewedClass} onChange={event => setReviewedClass(event.target.value)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    <div className="review-toolbar" aria-label="إجراءات المراجعة">
      <div className="review-action-group" aria-label="قرارات النقطة">
        <Button variant="success" size="compact" iconOnly aria-label="قبول النقطة" data-tooltip="قبول النقطة" onClick={() => send('accept')}><Check size={18} /></Button>
        <Button variant="secondary" size="compact" iconOnly aria-label="حفظ التصحيح" data-tooltip="حفظ التصحيح" onClick={() => send('correct')}><Pencil size={18} /></Button>
        <Button variant="danger" size="compact" iconOnly aria-label="رفض النقطة" data-tooltip="رفض النقطة" onClick={() => send('reject')}><X size={18} /></Button>
      </div>
      <div className="review-action-group review-export-actions" aria-label="اعتماد وتنزيل النتيجة">
        <Button size="compact" iconOnly aria-label="اعتماد النتيجة بعد المراجعة" data-tooltip="اعتماد النتيجة بعد المراجعة" onClick={() => send('accept', true)}><BadgeCheck size={18} /></Button>
        <Button variant="secondary" size="compact" iconOnly aria-label="تنزيل النتيجة المؤقتة" data-tooltip="تنزيل النتيجة المؤقتة" onClick={() => download(false)}><FileDown size={18} /></Button>
        {result.status !== 'temporary' && <Button variant="secondary" size="compact" iconOnly aria-label="تنزيل النتيجة المراجعة" data-tooltip="تنزيل النتيجة المراجعة" onClick={() => download(true)}><FileCheck2 size={18} /></Button>}
      </div>
    </div>
  </section>;
}