import { AlertTriangle } from 'lucide-react';

const riskTone = (score) => score >= 75 ? 'high' : score >= 45 ? 'medium' : 'low';

export function RiskAssessmentPanel({ risks = [] }) {
  return <article className="ops-panel decision-risk-panel">
    <header><div><span className="ops-kicker">تقييم المخاطر</span><h3>ترتيب العناصر حسب الأولوية</h3></div><AlertTriangle size={20} /></header>
    <div className="decision-records">{risks.map((risk) => <div className="decision-record" key={`${risk.layer}-${risk.id}`}>
      <div><strong>{risk.name}</strong><span>{risk.layer === 'Operation_Sectors' ? 'قطاع عمليات' : 'مسار دورية'} · ثقة {Math.round(risk.confidence * 100)}%</span></div>
      <b className={`risk-${riskTone(risk.score)}`}>{risk.score}<small>/100</small></b>
      <p>{risk.factors.filter((factor) => factor.available).map((factor) => `${factor.label} (${factor.contribution})`).join('، ') || 'العوامل المتاحة غير كافية.'}</p>
    </div>)}</div>
  </article>;
}