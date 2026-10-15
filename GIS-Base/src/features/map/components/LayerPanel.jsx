import { useState } from 'react';
import {
  Eye,
  Filter,
  GripVertical,
  LocateFixed,
  MousePointer2,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Modal } from '../../../components/Modal.jsx';
import { getLayerConfiguration, publishedLayers } from '../config/layers.js';
import { getArabicFieldLabel } from '../config/fieldPresentation.js';

export function LayerPanel({
  visibleLayers,
  activeLayerName,
  layerOrder,
  filter,
  filterStatus,
  filterResultCount,
  onToggleLayer,
  onZoomLayer,
  onRetry,
  onChangeActiveLayer,
  onApplyFilter,
  onClearFilter,
  onReorderLayer,
  onMoveLayer,
}) {
  const activeLayer = getLayerConfiguration(activeLayerName) ?? publishedLayers[0];
  const [queryOpen, setQueryOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingQueryLayer, setPendingQueryLayer] = useState(activeLayer.name);
  const [filterField, setFilterField] = useState(activeLayer.filterableFields[0]);
  const [filterValue, setFilterValue] = useState('');
  const [draggedLayerName, setDraggedLayerName] = useState(null);
  const [dragTargetName, setDragTargetName] = useState(null);
  const orderedConfigurations = layerOrder
    .map((name) => getLayerConfiguration(name))
    .filter(Boolean);
  const visibleConfigurations = orderedConfigurations.filter((layer) => visibleLayers.has(layer.name));

  const activateLayer = (layerName) => {
    const nextLayer = getLayerConfiguration(layerName);
    if (!nextLayer) return;
    onChangeActiveLayer(nextLayer.name);
  };

  const handleZoomLayer = (layer) => {
    activateLayer(layer.name);
    onZoomLayer(layer);
  };

  const openQuery = () => {
    setPendingQueryLayer(activeLayer.name);
    setQueryOpen(true);
  };

  const openFilter = () => {
    setFilterField(activeLayer.filterableFields[0]);
    setFilterValue('');
    setFilterOpen(true);
  };

  const handleQuerySubmit = (event) => {
    event.preventDefault();
    activateLayer(pendingQueryLayer);
    setQueryOpen(false);
  };

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    await onApplyFilter({ [filterField]: filterValue.trim() });
    setFilterOpen(false);
  };

  const handleClearFilter = () => {
    setFilterValue('');
    onClearFilter();
  };

  const handleDragStart = (event, layerName) => {
    setDraggedLayerName(layerName);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', layerName);
  };

  const handleDrop = (event, targetLayerName) => {
    event.preventDefault();
    const sourceLayerName = draggedLayerName || event.dataTransfer.getData('text/plain');
    if (sourceLayerName && sourceLayerName !== targetLayerName) {
      onReorderLayer(sourceLayerName, targetLayerName);
    }
    setDraggedLayerName(null);
    setDragTargetName(null);
  };

  return (
    <aside className="map-panel map-layers-panel" aria-labelledby="map-layers-title">
      <div className="map-panel-heading">
        <div>
          <span className="map-panel-eyebrow"><Eye size={15} aria-hidden="true" /> التحكم بالعرض</span>
          <h2 id="map-layers-title">طبقات الخريطة</h2>
        </div>
        <button className="map-icon-button" type="button" onClick={onRetry} aria-label="إعادة تحميل طبقات الخريطة" title="إعادة التحميل">
          <RefreshCw size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="map-layer-tools" aria-label="أدوات الاستعلام والفلترة">
        <button type="button" onClick={openQuery}>
          <MousePointer2 size={17} aria-hidden="true" />
          <span>الاستعلام</span>
          <small>{activeLayer.label}</small>
        </button>
        <button type="button" onClick={openFilter} className={Object.keys(filter).length ? 'is-active' : ''}>
          <Filter size={17} aria-hidden="true" />
          <span>الفلترة</span>
          {filterStatus === 'ready' ? <small>{filterResultCount} نتيجة</small> : <small>حسب الحقول</small>}
        </button>
      </div>

      <fieldset className="map-layer-list">
        <legend className="sr-only">اختر الطبقات الظاهرة ورتبها</legend>
        {orderedConfigurations.map((layer, index) => {
          const checked = visibleLayers.has(layer.name);
          const isActive = layer.name === activeLayer.name;
          const isDragging = draggedLayerName === layer.name;
          const isDragTarget = dragTargetName === layer.name && !isDragging;
          return (
            <div
              className={'map-layer-row' + (isActive ? ' is-active' : '') + (isDragging ? ' is-dragging' : '') + (isDragTarget ? ' is-drag-target' : '')}
              key={layer.name}
              draggable
              onDragStart={(event) => handleDragStart(event, layer.name)}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDragTargetName(layer.name);
              }}
              onDragLeave={() => setDragTargetName((current) => current === layer.name ? null : current)}
              onDrop={(event) => handleDrop(event, layer.name)}
              onDragEnd={() => {
                setDraggedLayerName(null);
                setDragTargetName(null);
              }}
            >
              <label className="map-layer-visibility">
                <input type="checkbox" checked={checked} onChange={() => onToggleLayer(layer.name)} />
                <span className="sr-only">إظهار {layer.label}</span>
              </label>
              <button
                className="map-layer-select"
                type="button"
                onClick={() => activateLayer(layer.name)}
                aria-pressed={isActive}
                title={'استخدام ' + layer.label + ' للتحديد والاستعلام'}
              >
                <span><strong>{layer.label}</strong></span>
                {isActive ? <span className="map-layer-active-label">التحديد</span> : null}
              </button>
              <button
                className="map-icon-button map-layer-zoom"
                type="button"
                onClick={() => handleZoomLayer(layer)}
                aria-label={'تكبير إلى نطاق ' + layer.label}
                title="تكبير إلى النطاق"
              >
                <LocateFixed size={17} aria-hidden="true" />
              </button>
              <button
                className="map-layer-order-handle"
                type="button"
                aria-label={'تحريك ترتيب ' + layer.label + '. استخدم السهمين للأعلى والأسفل'}
                title="اسحب لترتيب الطبقة"
                onKeyDown={(event) => {
                  if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    onMoveLayer(layer.name, -1);
                  } else if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    onMoveLayer(layer.name, 1);
                  }
                }}
                disabled={(index === 0 && orderedConfigurations.length === 1)}
              >
                <GripVertical size={18} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </fieldset>

      <Modal isOpen={queryOpen} onClose={() => setQueryOpen(false)} title="الاستعلام عن طبقة" size="small" className="map-tool-modal">
        <form className="map-tool-form" onSubmit={handleQuerySubmit}>
          <div className="map-tool-intro">
            <MousePointer2 size={20} aria-hidden="true" />
            <p>اختر الطبقة التي ستستقبل النقرات والاستعلامات على الخريطة.</p>
          </div>
          <label htmlFor="map-query-layer">طبقة الاستعلام</label>
          <select id="map-query-layer" value={pendingQueryLayer} onChange={(event) => setPendingQueryLayer(event.target.value)}>
            {visibleConfigurations.map((layer) => <option key={layer.name} value={layer.name}>{layer.label}</option>)}
          </select>
          <div className="map-tool-actions">
            <button className="button button-primary" type="submit">اعتماد الطبقة</button>
            <button className="button button-secondary" type="button" onClick={() => setQueryOpen(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="فلترة المعالم" size="small" className="map-tool-modal">
        <form className="map-tool-form" onSubmit={handleFilterSubmit}>
          <div className="map-tool-intro">
            <Filter size={20} aria-hidden="true" />
            <p>طبّق قيمة على أحد حقول <strong>{activeLayer.label}</strong>.</p>
          </div>
          <label htmlFor="map-filter-field">الحقل</label>
          <select id="map-filter-field" value={filterField} onChange={(event) => setFilterField(event.target.value)}>
            {activeLayer.filterableFields.map((field) => <option key={field} value={field}>{getArabicFieldLabel(field)}</option>)}
          </select>
          <label htmlFor="map-filter-value">القيمة</label>
          <input
            id="map-filter-value"
            name="map-filter-value"
            type="text"
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
            placeholder="أدخل قيمة الفلتر"
            spellCheck="false"
          />
          <p className="map-filter-status" role="status">
            {filterStatus === 'loading' ? 'جاري تطبيق الفلتر...' : null}
            {filterStatus === 'ready' ? 'عدد النتائج: ' + filterResultCount : null}
            {filterStatus === 'error' ? 'تعذر تطبيق الفلتر.' : null}
          </p>
          <div className="map-tool-actions">
            <button className="button button-primary" type="submit" disabled={!filterValue.trim()}>
              <Search size={16} aria-hidden="true" /> تطبيق
            </button>
            <button className="button button-secondary" type="button" onClick={handleClearFilter}>
              <RotateCcw size={16} aria-hidden="true" /> مسح
            </button>
          </div>
        </form>
      </Modal>
    </aside>
  );
}
