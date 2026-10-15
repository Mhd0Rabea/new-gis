import { useState } from 'react';
import { Database, Eye, Layers3, MousePointer2, X } from 'lucide-react';
import { Button } from '../../../components/Button.jsx';
import { Modal } from '../../../components/Modal.jsx';
import { getArcGisDomainOptions } from '../config/domains.js';
import {
  formatPropertyValue,
  getArabicFieldLabel,
  getArabicRelatedTableLabel,
} from '../config/fieldPresentation.js';

function getDisplayValue(name, value, layer) {
  const domainOptions = getArcGisDomainOptions(layer?.fieldDomains?.[name]);
  const domainOption = domainOptions?.find((option) => String(option.value) === String(value));
  return domainOption
    ? { text: domainOption.label, code: false }
    : formatPropertyValue(name, value);
}

const RELATED_RECORD_NAME_FIELDS = [
  'full_name',
  'vehicle_name',
  'weapon_name',
  'device_name',
  'report_title',
  'name',
  'code_name',
];

function isTechnicalRelationField(name) {
  return name === 'id'
    || name === 'objectid'
    || name === 'globalid'
    || name.endsWith('_idfk');
}

function getRelatedRecordEntries(record) {
  const entries = Object.entries(record).filter(([name]) => !isTechnicalRelationField(name));
  const priority = new Map(RELATED_RECORD_NAME_FIELDS.map((name, index) => [name, index]));

  return entries
    .sort(([left], [right]) => (priority.get(left) ?? 100) - (priority.get(right) ?? 100))
    .slice(0, 4);
}
function PropertyValue({ name, value, layer = undefined }) {
  const formatted = getDisplayValue(name, value, layer);
  if (!formatted.code) return <bdi>{formatted.text}</bdi>;

  return (
    <code
      className={`property-value-code${formatted.kind === 'date' ? ' property-value-date' : ''}`}
      dir={formatted.kind === 'date' ? 'rtl' : 'ltr'}
      title={formatted.title}
    >
      <bdi>{formatted.text}</bdi>
    </code>
  );
}

export function FeatureDetails({
  feature,
  layer,
  relatedRecords,
  status,
  error,
  statusMessage,
  onClose,
}) {
  const [dismissedFeatureKey, setDismissedFeatureKey] = useState(null);
  const properties = Object.entries(feature?.properties ?? {}).filter(([name]) => !['id', 'objectid', 'globalid'].includes(name.toLowerCase()));
  const featureKey = feature ? feature.id ?? JSON.stringify(feature.properties ?? {}) : null;
  const detailsOpen = Boolean(feature) && dismissedFeatureKey !== featureKey;

  const clearSelection = () => {
    setDismissedFeatureKey(null);
    onClose();
  };

  return (
    <>
      <section className="feature-details map-panel" aria-labelledby="feature-details-title" aria-busy={status === 'loading'}>
        <div className="map-panel-heading">
          <div>
            <span className="map-panel-eyebrow"><MousePointer2 size={15} aria-hidden="true" /> نتيجة التحديد</span>
            <h2 id="feature-details-title">تفاصيل المعلم</h2>
          </div>
          {feature ? (
            <button className="map-icon-button" type="button" onClick={clearSelection} aria-label="إلغاء تحديد المعلم" title="إلغاء التحديد">
              <X size={18} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <p className="sr-only" role="status">{statusMessage}</p>
        {error ? <p className="feature-details-error" role="alert">{error}</p> : null}

        {status === 'loading' ? (
          <p className="feature-details-note">جاري تحميل الخصائص والعلاقات...</p>
        ) : null}

        {status !== 'loading' && !feature ? (
          <div className="feature-details-empty">
            <MousePointer2 size={28} aria-hidden="true" />
            <p>اختر طبقة استعلام، ثم انقر على معلم ظاهر في الخريطة.</p>
          </div>
        ) : null}

        {feature ? (
          <div className="feature-details-preview">
            <div className="feature-details-preview-icon" aria-hidden="true"><Layers3 size={20} /></div>
            <div className="feature-details-preview-copy">
              <strong>{layer?.label ?? 'طبقة'}</strong>
            </div>
            <Button size="compact" onClick={() => setDismissedFeatureKey(null)}>
              <Eye size={17} aria-hidden="true" /> عرض التفاصيل
            </Button>
          </div>
        ) : null}
      </section>

      <Modal
        isOpen={Boolean(feature) && detailsOpen}
        onClose={() => setDismissedFeatureKey(featureKey)}
        title="تفاصيل المعلم المحدد"
        size="large"
        className="feature-details-modal"
      >
        {feature ? (
          <div className="feature-details-modal-content">
            <header className="feature-details-hero">
              <div className="feature-details-hero-icon" aria-hidden="true"><Layers3 size={24} /></div>
              <div className="feature-details-hero-copy">
                <span>طبقة المعلم</span>
                <h3>{layer?.label ?? 'طبقة'}</h3>
              </div>
            </header>

            <section className="feature-details-section" aria-labelledby="feature-properties-title">
              <div className="feature-details-section-heading">
                <h3 id="feature-properties-title">خصائص المعلم</h3>
                <span className="feature-field-count">عدد الحقول <code dir="ltr">{properties.length}</code></span>
              </div>
              {properties.length ? (
                <dl className="feature-properties">
                  {properties.map(([name, value]) => (
                    <div key={name}>
                      <dt>{getArabicFieldLabel(name)}</dt>
                      <dd><PropertyValue name={name} value={value} layer={layer} /></dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="feature-details-note">لا توجد خصائص متاحة لهذا المعلم.</p>
              )}
            </section>

            <section className="feature-details-section related-records" aria-labelledby="related-records-title">
              <div className="feature-details-section-heading">
                <h3 id="related-records-title"><Database size={17} aria-hidden="true" /> السجلات المرتبطة</h3>
              </div>
              {layer?.relatedTables.length ? (
                layer.relatedTables.map((table) => {
                  const records = relatedRecords?.[table] ?? [];
                  return (
                    <section key={table} aria-labelledby={'related-' + table}>
                      <h4 id={'related-' + table}>
                        {getArabicRelatedTableLabel(table)} <code dir="ltr">({records.length})</code>
                      </h4>
                      {records.length === 0 ? (
                        <p className="feature-details-note">لا توجد سجلات مرتبطة.</p>
                      ) : (
                        <ul>
                          {records.map((record, index) => (
                            <li key={record.id ?? record.objectid ?? index}>
                              {getRelatedRecordEntries(record).map(([name, value]) => (
                                <span key={name}>
                                  <strong>{getArabicFieldLabel(name)}:</strong>{' '}
                                  <PropertyValue name={name} value={value} />
                                </span>
                              ))}
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                })
              ) : (
                <p className="feature-details-note">لا توجد علاقات معرفة لهذه الطبقة.</p>
              )}
            </section>

            <div className="drawer-actions feature-details-actions">
              <Button onClick={() => setDismissedFeatureKey(featureKey)}>إغلاق النافذة</Button>
              <Button variant="secondary" onClick={clearSelection}>إلغاء التحديد</Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}