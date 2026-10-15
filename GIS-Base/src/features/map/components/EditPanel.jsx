import { useEffect, useRef, useState } from 'react';
import { Braces, Crosshair, Edit3, ListChecks, MapPinPlus, Save, Trash2, X } from 'lucide-react';
import { Button } from '../../../components/Button.jsx';
import { FormField } from '../../../components/FormField.jsx';
import { Modal } from '../../../components/Modal.jsx';
import { getArcGisDomainOptions } from '../config/domains.js';
import { getArabicFieldLabel, getArabicGeometryLabel } from '../config/fieldPresentation.js';

function domainValue(options, rawValue) {
  if (rawValue === '') return '';
  return options.find((option) => String(option.value) === rawValue)?.value ?? rawValue;
}

export function EditPanel({
  layer,
  selectedFeature,
  draft,
  deleteStatus,
  onStartCreate,
  onStartUpdate,
  onPropertyChange,
  onGeometryTextChange,
  onSave,
  onCancel,
  onDelete,
}) {
  const formRef = useRef(null);
  const reopenAfterMapEditRef = useRef(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const isSaving = draft?.status === 'saving';
  const draftGeometry = draft?.geometry;
  const hasDraft = Boolean(draft);


  useEffect(() => {
    if (!draft?.validationErrors || !editorOpen) return;
    formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [draft?.validationErrors, editorOpen]);

  useEffect(() => {
    if (!hasDraft) {
      reopenAfterMapEditRef.current = false;
      return;
    }
    if (!reopenAfterMapEditRef.current || !draftGeometry) return;
    reopenAfterMapEditRef.current = false;
    setEditorOpen(true);
  }, [draftGeometry, hasDraft]);

  if (!layer?.editable) return null;

  const startCreate = () => {
    reopenAfterMapEditRef.current = false;
    onStartCreate();
    setEditorOpen(true);
  };

  const startUpdate = () => {
    if (!selectedFeature) return;
    reopenAfterMapEditRef.current = false;
    onStartUpdate();
    setEditorOpen(true);
  };

  const cancelEditing = () => {
    reopenAfterMapEditRef.current = false;
    onCancel();
  };

  const continueOnMap = () => {
    reopenAfterMapEditRef.current = true;
    setEditorOpen(false);
  };

  return (
    <section className="edit-panel map-panel edit-toolbar-panel" aria-labelledby="edit-panel-title">
      <h2 id="edit-panel-title" className="sr-only">التحرير المكاني</h2>

      {!draft ? (
        <div className="edit-toolbar" role="group" aria-label="أدوات التحرير المكاني">
          <Button
            iconOnly
            className="edit-tool-button edit-tool-create"
            onClick={startCreate}
            aria-label="إنشاء معلم جديد"
            data-tooltip="إنشاء معلم"
          >
            <MapPinPlus size={21} strokeWidth={1.8} aria-hidden="true" />
          </Button>
          <Button
            iconOnly
            variant="secondary"
            className={`edit-tool-button edit-tool-update${selectedFeature ? '' : ' is-disabled'}`}
            onClick={startUpdate}
            aria-label={selectedFeature ? 'تعديل المعلم المحدد' : 'تعديل المعلم — يتطلب تحديد معلم'}
            aria-disabled={!selectedFeature}
            data-tooltip={selectedFeature ? 'تعديل المحدد' : 'حدد معلمًا للتعديل'}
          >
            <Edit3 size={21} strokeWidth={1.8} aria-hidden="true" />
          </Button>
          <Button
            iconOnly
            variant="danger"
            className={`edit-tool-button edit-tool-delete${selectedFeature ? '' : ' is-disabled'}`}
            onClick={() => selectedFeature && setConfirmDelete(true)}
            aria-label={selectedFeature ? 'حذف المعلم المحدد' : 'حذف المعلم — يتطلب تحديد معلم'}
            aria-disabled={!selectedFeature}
            data-tooltip={selectedFeature ? 'حذف المحدد' : 'حدد معلمًا للحذف'}
          >
            <Trash2 size={21} strokeWidth={1.8} aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div className="edit-toolbar edit-toolbar-active" role="group" aria-label="أدوات وضع التحرير النشط">
          <span className="edit-mode-indicator" aria-hidden="true">
            <Crosshair size={20} strokeWidth={1.8} />
          </span>
          <Button
            iconOnly
            className="edit-tool-button edit-tool-open"
            onClick={() => setEditorOpen(true)}
            aria-label="فتح نموذج التحرير"
            data-tooltip="فتح نموذج التحرير"
          >
            <Edit3 size={21} strokeWidth={1.8} aria-hidden="true" />
          </Button>
          <Button
            iconOnly
            variant="danger"
            className="edit-tool-button edit-tool-cancel"
            onClick={cancelEditing}
            disabled={isSaving}
            aria-label="إنهاء التحرير"
            data-tooltip="إنهاء التحرير"
          >
            <X size={21} strokeWidth={1.8} aria-hidden="true" />
          </Button>
        </div>
      )}

      <Modal
        isOpen={Boolean(draft) && editorOpen}
        onClose={() => setEditorOpen(false)}
        title={draft?.mode === 'create' ? `إنشاء معلم — ${layer.label}` : `تعديل معلم — ${layer.label}`}
        size="full"
        className="edit-modal"
        returnFocusSelector=".edit-tool-open"
      >
        {draft ? (
          <form ref={formRef} className="edit-form" onSubmit={onSave} noValidate aria-busy={isSaving}>
            <div className="edit-instruction">
              <Crosshair size={20} strokeWidth={1.8} aria-hidden="true" />
              <div>
                <strong>{draft.mode === 'create' ? 'حدّد الموقع ثم أكمل البيانات' : 'عدّل الموقع أو البيانات'}</strong>
                <span>
                  {draft.mode === 'create'
                    ? `ارسم ${getArabicGeometryLabel(layer.geometryTypes[0])} على الخريطة، ثم أكمل الحقول المطلوبة.`
                    : 'يمكنك تعديل الهندسة على الخريطة أو تغيير الخصائص قبل الحفظ.'}
                </span>
              </div>
            </div>

            {draft.error ? <p className="edit-error" role="alert">{draft.error}</p> : null}
            <section className="edit-geometry-card" aria-labelledby="edit-geometry-title">
              <div className={`edit-geometry-status${draft.geometry ? ' is-ready' : ''}`} role="status">
                <Braces size={19} strokeWidth={1.8} aria-hidden="true" />
                <div>
                  <strong id="edit-geometry-title">الهندسة المكانية</strong>
                  <span>{draft.geometry ? 'جاهزة للحفظ ويمكن تعديلها من الخريطة.' : 'مطلوبة: ارسمها على الخريطة أو أدخل GeoJSON.'}</span>
                </div>
                <span className="edit-geometry-badge">{draft.geometry ? 'جاهزة' : 'مطلوبة'}</span>
              </div>

              <details className="edit-geometry-input">
                <summary>إدخال GeoJSON يدويًا</summary>
                <FormField
                  label="هندسة GeoJSON (نظام الإحداثيات EPSG:4326)"
                  required
                  error={draft.validationErrors?.geometry}
                  htmlFor="edit-geometry-json"
                >
                  <textarea
                    id="edit-geometry-json"
                    name="geometry"
                    rows={7}
                    value={draft.geometryText ?? ''}
                    onChange={(event) => onGeometryTextChange(event.target.value)}
                    spellCheck="false"
                    dir="ltr"
                  />
                </FormField>
              </details>
            </section>

            <section className="edit-properties-section" aria-labelledby="edit-properties-title">
              <div className="edit-section-heading">
                <div>
                  <ListChecks size={19} strokeWidth={1.8} aria-hidden="true" />
                  <div>
                    <h3 id="edit-properties-title">بيانات المعلم</h3>
                    <span>أدخل الخصائص الوصفية للقيمة المكانية.</span>
                  </div>
                </div>
                <span className="edit-field-count">{layer.editableFields.length} حقلًا</span>
              </div>

              <div className="edit-fields">
                {layer.editableFields.map((field) => {
                  const domainOptions = getArcGisDomainOptions(layer.fieldDomains?.[field]);
                  return (
                    <FormField
                      key={field}
                      label={getArabicFieldLabel(field)}
                      required={layer.requiredFields.includes(field)}
                      error={draft.validationErrors?.[field]}
                      htmlFor={`edit-${field}`}
                    >
                      {domainOptions ? (
                        <select
                          id={`edit-${field}`}
                          name={field}
                          value={draft.properties[field] ?? ''}
                          onChange={(event) => onPropertyChange(field, domainValue(domainOptions, event.target.value))}
                        >
                          <option value="">اختر قيمة</option>
                          {domainOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`edit-${field}`}
                          name={field}
                          type="text"
                          value={draft.properties[field] ?? ''}
                          onChange={(event) => onPropertyChange(field, event.target.value)}
                          spellCheck="false"
                          dir="auto"
                        />
                      )}
                    </FormField>
                  );
                })}
              </div>
            </section>
            <div className="edit-actions">
              <Button type="submit" loading={isSaving} loadingLabel="جاري الحفظ...">
                <Save size={17} aria-hidden="true" /> حفظ
              </Button>
              <Button type="button" variant="secondary" onClick={continueOnMap} disabled={isSaving}>
                <Crosshair size={17} aria-hidden="true" /> الرسم على الخريطة
              </Button>
              <Button type="button" variant="secondary" onClick={cancelEditing} disabled={isSaving}>
                <X size={17} aria-hidden="true" /> إلغاء التحرير
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="تأكيد حذف المعلم"
        size="small"
      >
        <p>سيُحذف المعلم المحدد من PostGIS عبر NestJS. لا يمكن التراجع عن هذه العملية.</p>
        <div className="drawer-actions">
          <Button variant="danger" loading={deleteStatus === 'deleting'} loadingLabel="جاري الحذف..." onClick={async () => {
            const deleted = await onDelete();
            if (deleted) setConfirmDelete(false);
          }}>
            حذف المعلم
          </Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>إلغاء</Button>
        </div>
      </Modal>
    </section>
  );
}