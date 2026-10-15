import { MapPinned } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getArabicFieldLabel } from '../../map/config/fieldPresentation.js';
import { displayValue } from '../utils/formatters.js';
export function LayerDataView({ layerName, fields, features }) {
 return <section className="ops-panel"><div className="data-table-wrap"><table className="data-table"><thead><tr>{fields.map((field) => <th key={field}>{getArabicFieldLabel(field)}</th>)}<th>الإجراء</th></tr></thead><tbody>{features.map((feature) => <tr key={feature.id}>{fields.map((field) => <td key={field} data-label={getArabicFieldLabel(field)}>{displayValue(feature.properties?.[field])}</td>)}<td data-label="الإجراء"><Link className="icon-action" aria-label="عرض على الخريطة" to={'/map?layer=' + layerName + '&id=' + feature.id}><MapPinned size={18} /></Link></td></tr>)}</tbody></table>{!features.length && <p className="empty-inline">لا توجد نتائج مطابقة.</p>}</div></section>;
}
