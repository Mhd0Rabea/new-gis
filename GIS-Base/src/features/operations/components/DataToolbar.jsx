import { Search } from 'lucide-react';
import { formatNumber } from '../utils/formatters.js';

export function DataToolbar({ layers, layerName, query, resultCount, onLayerChange, onQueryChange }) {
  return (
    <section className="ops-panel data-toolbar">
      <div className="data-query-group">
        <label>
          الطبقة
          <select value={layerName} onChange={(event) => onLayerChange(event.target.value)}>
            {layers.map((layer) => <option key={layer.name} value={layer.name}>{layer.label}</option>)}
          </select>
        </label>
        <label>
          البحث
          <div className="search-field">
            <Search size={18} aria-hidden="true" />
            <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="ابحث ضمن السجلات" />
          </div>
        </label>
      </div>
      <span className="result-count">{formatNumber(resultCount)} نتيجة</span>
    </section>
  );
}