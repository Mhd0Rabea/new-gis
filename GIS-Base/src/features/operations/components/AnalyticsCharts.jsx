import { formatNumber } from '../utils/formatters.js';
export function AnalyticsCharts({ rows }) {
 const max = Math.max(1, ...rows.map((row) => row.total));
 return <div className="analytics-bars">{rows.map((row) => <div key={row.layer.name}><span>{row.layer.label}</span><i aria-hidden="true"><em style={{ width: (row.total / max * 100) + '%' }} /></i><b>{formatNumber(row.total)}</b></div>)}</div>;
}
