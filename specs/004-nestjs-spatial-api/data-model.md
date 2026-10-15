# Data Model: NestJS Spatial API

## LayerDefinition

| Field | Meaning |
|---|---|
| `name` | الاسم القانوني المقبول في URL |
| `table` | اسم جدول PostGIS الموثوق |
| `geometryType` | Point أو LineString أو Polygon |
| `editableFields` | الحقول التي يسمح POST/PATCH بكتابتها |
| `filterableFields` | الحقول التي يسمح GET بفلترتها |
| `relatedTables` | أسماء العلاقات المسموحة وحقول FK |

القائمة القانونية: `Military_Bases`, `Checkpoints`, `Operation_Sectors`, `Patrol_Routes`, `Threat_Areas`, `Supply_Routes`, `Military_Warehouses`, `Airports`, `Communication_Towers`.

## GeoJSON Feature Input

- `type`: يجب أن يكون `Feature`.
- `id`: غير مطلوب عند POST؛ UUID صالح عند PATCH/response.
- `geometry`: غير فارغة، من النوع المطابق للطبقة، وإحداثياتها WGS84.
- `properties`: object يحتوي فقط editable fields؛ معرفات النظام والوقت للقراءة فقط.

## GeoJSON Feature Output

- `type`: `Feature`.
- `id`: UUID.
- `geometry`: محولة إلى `EPSG:4326`.
- `properties`: business ID والحقول العامة وtimestamps، دون أسرار أو حقول داخلية.

## FeatureCollection

- `type`: `FeatureCollection`.
- `features`: صفحة المعالم.
- `metadata`: `limit`, `offset`, `returned`, و`total` عند طلبه.
- الحد الافتراضي 100 والأقصى 500.

## RelatedRecord

سجل وصفي بلا هندسة يعود فقط عند وجود mapping صريح بين layer وtable. العلاقات الست تتبع نموذج PostGIS في `../002-postgis-integration/data-model.md`.

## ApiError

| Field | Type | Rule |
|---|---|---|
| `statusCode` | integer | HTTP status |
| `code` | string | ثابت قابل للمعالجة |
| `message` | string | رسالة آمنة ومفهومة |
| `details` | array | أخطاء الحقول عند وجودها، دون SQL أو credentials |

## State Transitions

- POST: غير موجود -> موجود بمعرف UUID.
- PATCH: موجود -> نسخة محدثة مع `updated_at` جديد.
- DELETE: موجود -> غير موجود؛ يفشل 409 عند وجود علاقة تمنع الحذف.
- عمليات التحقق الفاشلة لا تغير الحالة.
