# Research: React Map Integration

## 1. مكتبة الخريطة

**Decision**: استخدام `ol` (OpenLayers) 10.10.0.

**Rationale**: توثيق OpenLayers الرسمي يوفر ضمن الحزمة نفسها `TileWMS`، وقراءة GeoJSON، و`Select` و`Draw` و`Modify`. هذا يحقق العرض والاستعلام والتحرير دون plugins أو wrapper خاص بـReact.

**Alternatives considered**:

- Leaflet: أبسط للعرض، لكنه يحتاج إضافات أو كودًا إضافيًا لدورة الرسم والتعديل المطلوبة.
- MapLibre GL JS: مناسب للـvector tiles، وهي ليست عقد العرض الحالي المبني على WMS.
- ArcGIS Maps SDK for JavaScript: يضيف منصة ثانية وعقودًا أوسع من الحاجة التعليمية الحالية.

## 2. مسار العرض والكتابة

**Decision**: WMS من GeoServer للعرض المنشور، وNestJS للقراءة التفصيلية والفلترة وجميع عمليات الكتابة.

**Rationale**: يحافظ على GeoServer كخدمة نشر ويمنع WFS-T كما تشترط المواصفة. بعد نجاح الكتابة تُحدّث طبقة WMS ويُعاد تحميل بيانات المتجه النشط فقط.

**Alternatives considered**:

- WFS-T: مرفوض صراحة.
- قراءة وكتابة كل شيء عبر WFS: يكرر عقد NestJS ويشتت التحقق.
- عرض كل المعالم كـGeoJSON فقط: لا يعلّم مسار WMS المطلوب.

## 3. الإسقاطات

**Decision**: تستخدم الخريطة `EPSG:3857` للعرض، وتقرأ وتكتب GeoJSON مع `dataProjection: EPSG:4326`. يبقى تحويل `EPSG:4326 ↔ EPSG:32637` داخل PostGIS عبر NestJS.

**Rationale**: هذا هو مسار OpenLayers القياسي للويب ويحافظ على عقد API الحالي.

**Alternatives considered**:

- تشغيل عرض الويب مباشرة على `EPSG:32637`: ممكن لكنه يزيد إعدادات الإسقاط دون فائدة في النسخة الأولى.
- إرسال `EPSG:3857` إلى API: يخالف العقد المعتمد.

## 4. إدارة الحالة

**Decision**: `useState` و`useReducer` محليان داخل feature الخريطة، دون مكتبة state.

**Rationale**: شاشة واحدة وعدد حالات محدود: الطبقات، التحديد، الفلتر، والمسودة. لا توجد مشاركة واسعة تبرر مكتبة جديدة.

## 5. الإعداد وملف البيئة

**Decision**: يستخدم المتصفح مسارين نسبيين افتراضيين `/api` و`/geoserver` من `public/runtime-config.js`. يقرأ Vite أثناء التطوير `MGOS_API_PROXY_TARGET` و`MGOS_GEOSERVER_PROXY_TARGET` من `.env`. يوفر المستودع `.env.example` فقط، بينما يبقى `.env` المحلي خارج Git.

**Rationale**: يمكن نقل build نفسه بين الأجهزة بتغيير إعداد التشغيل أو reverse proxy، ولا تظهر كلمات مرور أو عناوين PostgreSQL في المتصفح. متغيرات proxy ليست `VITE_*` لذلك لا تُضمّن في JavaScript العميل.

**Alternatives considered**:

- تثبيت `localhost` داخل React: غير قابل للنقل.
- الاعتماد على `VITE_*` وحدها: يفرض rebuild عند تغيير البيئة.
- وضع بيانات PostgreSQL في Frontend: غير آمن وغير مطلوب.

## 6. Authentication

**Decision**: لا Authentication أو token storage أو route guards في هذه المرحلة.

**Rationale**: هذا قرار المستخدم الحالي ومتوافق مع النطاق التعليمي المحلي. يظل API هو حد الوصول الوحيد للكتابة.
## Verified Toolchain

- Node.js: `24.19.0`
- npm: `11.17.0`
- OpenLayers registry version checked before installation: `10.10.0`
- Installed package: `ol@10.10.0`
- npm audit after installation: `0 vulnerabilities`