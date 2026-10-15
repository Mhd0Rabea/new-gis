import { useState } from 'react';
import { Image, Palette, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/Modal.jsx';
import { getLayerConfiguration } from '../config/layers.js';
import { getArabicFieldLabel } from '../config/fieldPresentation.js';

const COLOR_PRESETS = ['#2563EB', '#7C3AED', '#DC2626', '#EA580C', '#0F766E', '#A16207', '#0369A1', '#7E22CE'];
const DEFAULT_OUTLINE = Object.freeze({ enabled: false, color: '#FFFFFF', width: 1 });
const DEFAULT_OPACITY = 100;
const OPERATORS = [
  { value: 'eq', label: 'يساوي' },
  { value: 'neq', label: 'لا يساوي' },
  { value: 'gt', label: 'أكبر من' },
  { value: 'gte', label: 'أكبر من أو يساوي' },
  { value: 'lt', label: 'أصغر من' },
  { value: 'lte', label: 'أصغر من أو يساوي' },
  { value: 'contains', label: 'يحتوي على' },
];

function createRule(layer) {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    field: layer?.editableFields?.[0] ?? '',
    operator: 'gte',
    value: '',
    color: '#DC2626',
  };
}

export function MapLegend({ visibleLayers, activeLayerName, layerOrder, layerColors, layerOutlines, layerOpacities, layerRules, onStyleChange }) {
  const [editorLayerName, setEditorLayerName] = useState(null);
  const editorLayer = getLayerConfiguration(editorLayerName);
  const visibleConfigurations = layerOrder
    .map((name) => getLayerConfiguration(name))
    .filter((layer) => layer && visibleLayers.has(layer.name));
  const activeLayer = getLayerConfiguration(activeLayerName);
  const [draftColor, setDraftColor] = useState('#2563EB');
  const [draftOutline, setDraftOutline] = useState(DEFAULT_OUTLINE);
  const [draftOpacity, setDraftOpacity] = useState(DEFAULT_OPACITY);
  const [draftRules, setDraftRules] = useState([]);

  const openStyleEditor = (layer) => {
    setDraftColor(layerColors[layer.name] ?? layer.legend?.color ?? '#2563EB');
    setDraftOutline(layerOutlines[layer.name] ?? DEFAULT_OUTLINE);
    setDraftOpacity(layerOpacities[layer.name] ?? DEFAULT_OPACITY);
    setDraftRules(layerRules[layer.name] ?? []);
    setEditorLayerName(layer.name);
  };

  const saveStyle = () => {
    if (!editorLayer) return;
    const completeRules = draftRules.filter((rule) => rule.field && String(rule.value).trim());
    onStyleChange(editorLayer.name, { color: draftColor, opacity: draftOpacity, outline: draftOutline, rules: completeRules });
    setEditorLayerName(null);
  };

  const resetStyle = () => {
    if (!editorLayer) return;
    setDraftColor(editorLayer.legend?.color ?? '#2563EB');
    setDraftOutline(DEFAULT_OUTLINE);
    setDraftOpacity(DEFAULT_OPACITY);
    setDraftRules([]);
  };

  const updateRule = (id, patch) => {
    setDraftRules((current) => current.map((rule) => rule.id === id ? { ...rule, ...patch } : rule));
  };

  return (
    <section className="map-legend map-stage-legend" aria-labelledby="map-legend-title">
      <div className="map-legend-heading">
        <h3 id="map-legend-title"><Image size={16} aria-hidden="true" /> مفتاح الخريطة</h3>
        <span className="map-legend-count" aria-label={'عدد الطبقات الظاهرة: ' + visibleConfigurations.length}>{visibleConfigurations.length}</span>
      </div>
      {visibleConfigurations.length === 0 ? <p className="map-panel-note">شغّل طبقة واحدة على الأقل لعرض مفتاحها.</p> : (
        <ul className="map-legend-list">
          {visibleConfigurations.map((layer) => {
            const isActive = layer.name === activeLayer?.name;
            const legend = layer.legend ?? { color: '#4fe0bd', fill: '#4fe0bd', symbol: 'point', geometryLabel: 'معلم' };
            const color = layerColors[layer.name] ?? legend.color;
            const opacity = layerOpacities[layer.name] ?? DEFAULT_OPACITY;
            const outline = layerOutlines[layer.name] ?? DEFAULT_OUTLINE;
            const rulesCount = layerRules[layer.name]?.length ?? 0;
            return <li key={layer.name}>
              <button className={'map-legend-item' + (isActive ? ' is-active' : '')} type="button" onClick={() => openStyleEditor(layer)} title={'تعديل نمط تمثيل ' + layer.label}
                style={{ color: 'inherit', '--legend-color': color, '--legend-fill': color, '--legend-opacity': opacity / 100, '--legend-outline': outline.enabled ? outline.color : 'transparent', '--legend-outline-width': outline.enabled ? `${outline.width}px` : '0px' }}>
                <span className={'map-legend-symbol map-legend-symbol--' + legend.symbol} aria-hidden="true" />
                <span className="map-legend-copy"><strong>{layer.label}</strong><small>{rulesCount ? rulesCount + ' شروط' : legend.geometryLabel}</small></span>
                <Palette className="map-legend-palette" size={14} aria-hidden="true" />
              </button>
            </li>;
          })}
        </ul>
      )}

      <Modal isOpen={Boolean(editorLayer)} onClose={() => setEditorLayerName(null)} title={editorLayer ? 'نمط تمثيل ' + editorLayer.label : 'نمط الطبقة'} size="large" className="map-tool-modal map-color-modal">
        {editorLayer ? <div className="map-color-editor">
          <div className="map-color-preview" style={{ '--preview-color': draftColor, '--legend-opacity': draftOpacity / 100, '--legend-outline': draftOutline.enabled ? draftOutline.color : 'transparent', '--legend-outline-width': draftOutline.enabled ? `${draftOutline.width}px` : '0px' }}>
            <span className={'map-legend-symbol map-legend-symbol--' + (editorLayer.legend?.symbol ?? 'point')} aria-hidden="true" />
            <div><strong>{editorLayer.label}</strong><small>معاينة اللون والشفافية والحد</small></div>
          </div>

          <div className="map-style-section">
            <span className="map-style-section-title">لون وشفافية التمثيل</span>
            <div className="map-color-input-row"><input aria-label="لون التمثيل" type="color" value={draftColor} onChange={(event) => setDraftColor(event.target.value.toUpperCase())} /><code>{draftColor.toUpperCase()}</code></div>
            <div className="map-color-presets" aria-label="ألوان مقترحة">
              {COLOR_PRESETS.map((color) => <button key={color} type="button" aria-label={'اختيار اللون ' + color} aria-pressed={draftColor.toUpperCase() === color} style={{ '--preset-color': color }} onClick={() => setDraftColor(color)} />)}
            </div>
            <label className="map-opacity-control"><span>شفافية الطبقة <code>{draftOpacity}%</code></span><input aria-label="شفافية الطبقة" type="range" min="15" max="100" step="5" value={draftOpacity} onChange={(event) => setDraftOpacity(Number(event.target.value))} /></label>
          </div>

          <div className={'map-style-section map-outline-section' + (draftOutline.enabled ? ' is-enabled' : '')}>
            <label className="map-outline-toggle"><span><strong>حد خارجي</strong><small>حد رفيع اختياري لفصل المعلم عن الخلفية</small></span><input type="checkbox" checked={draftOutline.enabled} onChange={(event) => setDraftOutline((current) => ({ ...current, enabled: event.target.checked }))} /></label>
            {draftOutline.enabled ? <div className="map-outline-controls">
              <label><span>لون الحد</span><div className="map-color-input-row"><input aria-label="لون الحد الخارجي" type="color" value={draftOutline.color} onChange={(event) => setDraftOutline((current) => ({ ...current, color: event.target.value.toUpperCase() }))} /><code>{draftOutline.color.toUpperCase()}</code></div></label>
              <label className="map-outline-width"><span>السماكة <code>{draftOutline.width}px</code></span><input aria-label="سماكة الحد الخارجي" type="range" min="0.5" max="3" step="0.5" value={draftOutline.width} onChange={(event) => setDraftOutline((current) => ({ ...current, width: Number(event.target.value) }))} /></label>
            </div> : null}
          </div>

          <div className="map-style-section map-rules-section">
            <div className="map-rules-heading"><span><strong>التلوين الشرطي</strong><small>أول شرط مطابق يحدد لون المعلم</small></span><button type="button" onClick={() => setDraftRules((current) => [...current, createRule(editorLayer)])}><Plus size={16} aria-hidden="true" />إضافة شرط</button></div>
            {draftRules.length === 0 ? <p className="map-rules-empty">لا توجد شروط. أضف شرطًا مثل: درجة الخطورة أكبر من أو تساوي 20 باللون الأحمر.</p> : <div className="map-rules-list">
              {draftRules.map((rule, index) => <article className="map-rule-row" key={rule.id}>
                <span className="map-rule-index">{index + 1}</span>
                <label><span>الحقل</span><select value={rule.field} onChange={(event) => updateRule(rule.id, { field: event.target.value })}>{editorLayer.editableFields.map((field) => <option key={field} value={field}>{getArabicFieldLabel(field)}</option>)}</select></label>
                <label><span>الشرط</span><select value={rule.operator} onChange={(event) => updateRule(rule.id, { operator: event.target.value })}>{OPERATORS.map((operator) => <option key={operator.value} value={operator.value}>{operator.label}</option>)}</select></label>
                <label><span>القيمة</span><input type="text" inputMode="decimal" value={rule.value} onChange={(event) => updateRule(rule.id, { value: event.target.value })} placeholder="20" /></label>
                <label className="map-rule-color"><span>اللون</span><input type="color" value={rule.color} onChange={(event) => updateRule(rule.id, { color: event.target.value.toUpperCase() })} /></label>
                <button className="map-rule-delete" type="button" onClick={() => setDraftRules((current) => current.filter((item) => item.id !== rule.id))} aria-label={'حذف الشرط ' + (index + 1)} title="حذف الشرط"><Trash2 size={17} aria-hidden="true" /></button>
              </article>)}
            </div>}
          </div>

          <div className="map-tool-actions"><button className="button button-primary" type="button" onClick={saveStyle}>حفظ النمط</button><button className="button button-secondary" type="button" onClick={resetStyle}><RotateCcw size={16} aria-hidden="true" /> الافتراضي</button></div>
        </div> : null}
      </Modal>
    </section>
  );
}
