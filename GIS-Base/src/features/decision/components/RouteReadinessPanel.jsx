import { Clock3, Route } from 'lucide-react';

export function RouteReadinessPanel({ routes = [] }) {
  return <article className="ops-panel decision-route-panel">
    <header><div><span className="ops-kicker">جاهزية المسارات</span><h3>بدائل مرتبة وقابلة للمراجعة</h3></div><Route size={20} /></header>
    <div className="decision-records">{routes.map((item, index) => <div className="decision-record route-readiness-record" key={item.id}>
      <div><strong><i>{index + 1}</i>{item.name}</strong><span>{item.roadStatus || 'حالة الطريق غير مدخلة'} · خطر {item.risk}%</span></div>
      <b className="readiness-score">{item.readiness}<small>%</small></b>
      <p>{item.constraints.length ? item.constraints.join(' ') : 'لا توجد قيود مسجلة في الحقول المتاحة.'}</p>
      {item.travelTimeMinutes !== null && <span className="route-duration"><Clock3 size={13} />{item.travelTimeMinutes} دقيقة</span>}
    </div>)}</div>
  </article>;
}