import { BrainCircuit, Camera, CheckCircle2, Clock3, Radar, Radio } from 'lucide-react';

const capabilities = [
  { title: 'تصنيف سحابات النقاط', description: 'تصنيف للملفات التي ترفعها مع حد ثقة ومراجعة بشرية قبل الاعتماد.', status: 'متاح الآن', detail: 'المخرج: فئات نقطية مؤقتة قابلة للمراجعة.', icon: BrainCircuit, available: true },
  { title: 'تحليل التهديدات', description: 'تجميع مؤشرات مكانية وزمنية لمساندة المراجع، دون قرار تلقائي.', status: 'مخطط', detail: 'يتطلب نموذج تقييم واعتمادًا تخصصيًا قبل الإتاحة.', icon: Radar },
  { title: 'تحليل الصور الجوية', description: 'استخراج مؤشرات من صور جوية أو مسيّرات ضمن سير مراجعة واضح.', status: 'مخطط', detail: 'خارج بيانات وعقود الإصدار الحالي.', icon: Camera },
  { title: 'التتبع اللحظي', description: 'عرض تدفقات مواقع مع قواعد تنبيه قابلة للتدقيق.', status: 'مخطط', detail: 'يتطلب مصدر بث حي وسياسة احتفاظ بالبيانات.', icon: Radio },
];

export function AiCapabilityMap() {
  return (
    <section className="ops-panel ai-capability-map" aria-labelledby="ai-capabilities-title">
      <div className="panel-head">
        <div>
          <span className="ops-kicker">نطاق الذكاء الاصطناعي</span>
          <h3 id="ai-capabilities-title">خارطة القدرات</h3>
          <p>تُظهر الحالة الفعلية لكل قدرة؛ لا تتحول أي نتيجة إلى سجل معتمد قبل المراجعة البشرية.</p>
        </div>
        <span className="ai-review-note"><CheckCircle2 size={17} /> مراجعة بشرية</span>
      </div>
      <div className="ai-capability-grid">
        {capabilities.map(({ title, description, status, detail, icon: Icon, available }) => (
          <article className="ai-capability-card" key={title}>
            <span className={`ai-capability-icon${available ? ' is-available' : ''}`} aria-hidden="true"><Icon size={21} /></span>
            <div className="ai-capability-copy">
              <div className="ai-capability-title-row">
                <h4>{title}</h4>
                <span className={`ai-capability-status${available ? ' is-available' : ''}`}>
                  {available ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}{status}
                </span>
              </div>
              <p>{description}</p>
              <small>{detail}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
