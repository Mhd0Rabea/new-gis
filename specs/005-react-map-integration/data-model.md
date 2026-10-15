# Data Model: React Map Integration

هذه الوثيقة تصف نماذج حالة الواجهة، ولا تنشئ جداول جديدة.

## LayerConfiguration

يمثل طبقة واحدة في سجل الإعداد المركزي.

| Field | Type | Rule |
|---|---|---|
| `name` | string | اسم Canonical مطابق لعقد API وGeoServer |
| `label` | string | عنوان عربي للواجهة |
| `wmsName` | string | `mgos:<name>` |
| `geometryTypes` | string[] | الأنواع المسموحة في عقد API |
| `visibleByDefault` | boolean | طبقة واحدة أو عدد محدود افتراضيًا |
| `queryable` | boolean | يحدد ظهور الاستعلام |
| `editable` | boolean | يحدد أدوات الرسم والتعديل |
| `relatedTables` | string[] | allowlist للعلاقات المتاحة |

الأسماء الأساسية للعرض: `Military_Bases`, `Checkpoints`, `Operation_Sectors`, `Patrol_Routes`.

## MapViewState

| Field | Type | Rule |
|---|---|---|
| `visibleLayers` | Set<string> | أسماء موجودة في LayerConfiguration فقط |
| `activeLayer` | string/null | طبقة واحدة للاستعلام والتحرير |
| `selectedFeatureId` | UUID/null | يأتي من API |
| `filter` | object | حقول وقيم allowlisted للطبقة |
| `status` | idle/loading/ready/empty/error | حالة تحميل واضحة |
| `error` | string/null | رسالة قابلة للعرض دون تفاصيل حساسة |

## SelectedFeature

| Field | Type | Rule |
|---|---|---|
| `type` | `Feature` | ثابت |
| `id` | UUID | معرف API |
| `geometry` | GeoJSON Geometry | `EPSG:4326` |
| `properties` | object | خصائص الطبقة |
| `related` | Record<string, object[]> | لا يطلب إلا الجداول المسموحة |

## EditDraft

| Field | Type | Rule |
|---|---|---|
| `mode` | create/update/delete/null | وضع واحد فقط |
| `layer` | string | طبقة editable |
| `geometry` | GeoJSON Geometry/null | النوع يطابق LayerConfiguration |
| `properties` | object | الحقول القابلة للتحرير فقط |
| `dirty` | boolean | يمنع فقدان المسودة بصمت |
| `status` | idle/saving/succeeded/failed | حالة عملية الحفظ |
| `validationErrors` | object | أخطاء الحقول أو الهندسة |

## State Transitions

1. `idle → loading → ready|empty|error` عند تحميل طبقة أو فلتر.
2. `ready → selected` عند اختيار معلم.
3. `selected → editing → saving → ready` عند تعديل ناجح.
4. `ready → drawing → saving → ready` عند إنشاء ناجح.
5. عند فشل الحفظ تبقى المسودة `dirty` وقابلة للتصحيح.
6. تغيير الطبقة مع مسودة `dirty` يتطلب تأكيد المستخدم.