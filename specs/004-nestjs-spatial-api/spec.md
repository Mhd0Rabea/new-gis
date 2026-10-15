# Feature Specification: NestJS Spatial API

**Feature Branch**: `004-nestjs-spatial-api`

**Created**: 2026-10-03

**Status**: Implemented and verified

**Input**: واجهة API مكانية صغيرة لإدارة طبقات MGOS في PostGIS بصيغة GeoJSON.

## User Scenarios & Testing

### User Story 1 - قراءة الطبقات والمعالم (Priority: P1)

كمستهلك API، أريد قراءة قائمة معالم طبقة أو معلم واحد ضمن نطاق مكاني كي أبني واجهة خرائط دون الوصول المباشر إلى قاعدة البيانات.

**Why this priority**: القراءة هي أقل شريحة API مفيدة ويمكن اختبارها قبل السماح بالكتابة.

**Independent Test**: طلب طبقة مسموحة مع BBOX ثم طلب معلم بالمعرف ومقارنة GeoJSON بالبيانات المرجعية.

**Acceptance Scenarios**:

1. **Given** اسم طبقة مسموح، **When** يطلب العميل مجموعة معالم، **Then** تعود FeatureCollection في `EPSG:4326`.
2. **Given** اسم غير مسموح، **When** يطلبه العميل، **Then** يعود خطأ واضح ولا تُنفذ SQL بأسماء ديناميكية غير موثوقة.

---

### User Story 2 - إنشاء وتعديل وحذف معلم (Priority: P2)

كمستخدم محلي، أريد إدارة معلم مكاني عبر API كي تصبح NestJS قناة الكتابة الوحيدة من تطبيق الويب.

**Why this priority**: تثبت دورة CRUD مع قواعد الهندسة والحقول.

**Independent Test**: إنشاء معلم اصطناعي، قراءته، تعديل خاصية وهندسة، ثم حذفه والتحقق من كل حالة.

**Acceptance Scenarios**:

1. **Given** GeoJSON صالح، **When** يُنشأ معلم، **Then** يُخزن بالـCRS الداخلي ويعاد بمعرف ثابت.
2. **Given** هندسة خاطئة أو نوع مخالف، **When** يرسل العميل الطلب، **Then** يُرفض دون تغيير البيانات.

---

### User Story 3 - قراءة السجلات المرتبطة (Priority: P3)

كمستخدم خريطة، أريد عرض السجلات المرتبطة بالمعلم المحدد كي أرى أفراد وآليات القاعدة أو حوادث القطاع.

**Why this priority**: تضيف قيمة العلاقات بعد اكتمال CRUD الأساسي.

**Independent Test**: طلب العلاقات لقاعدة وقطاع ومقارنة النتائج بالمفاتيح الأجنبية في PostGIS.

**Acceptance Scenarios**:

1. **Given** قاعدة لها سجلات مرتبطة، **When** يُطلب جدول مسموح، **Then** تعود السجلات التابعة فقط.
2. **Given** علاقة غير مسموحة، **When** تُطلب، **Then** يعود خطأ ولا يُكشف جدول آخر.

### Edge Cases

- BBOX غير صالح أو يعبر نطاقًا خارج منطقة التدريب.
- FeatureCollection كبيرة تتجاوز حد الصفحة.
- UUID غير صالح أو غير موجود.
- تعارض تعديل سجل حُذف أو تغير.
- قاعدة البيانات أو GeoServer متوقفان.
- حقول للقراءة فقط تظهر في payload الكتابة.

## Requirements

### Functional Requirements

- **FR-001**: MUST توفير Module واحد باسم `features` دون بنية خدمات زائدة.
- **FR-002**: MUST استخدام قائمة سماح ثابتة تربط أسماء الطبقات القانونية بجداولها وأنواع هندستها وعلاقاتها.
- **FR-003**: MUST توفير `GET /api/features/:layer` مع BBOX وPagination ومرشحات مسموحة فقط.
- **FR-004**: MUST توفير `GET /api/features/:layer/:id`.
- **FR-005**: MUST توفير `POST`, `PATCH`, و`DELETE` للطبقات القابلة للتحرير.
- **FR-006**: MUST توفير `GET /api/features/:layer/:id/related/:table` للعلاقات المسموحة.
- **FR-007**: MUST استقبال وإرجاع GeoJSON في `EPSG:4326` وتحويله من وإلى `EPSG:32637` داخل قاعدة البيانات.
- **FR-008**: MUST التحقق من UUID ونوع الهندسة وصحتها والحقول المطلوبة وDomain codes قبل الكتابة.
- **FR-009**: MUST استخدام SQL parameterized ومنع إدراج أسماء العميل مباشرة في SQL.
- **FR-010**: MUST إرجاع أخطاء موحدة للحالات 400 و404 و409 و500 دون كشف تفاصيل الاتصال.
- **FR-011**: MUST توثيق العقد في OpenAPI مع أمثلة GeoJSON صالحة وغير صالحة.
- **FR-012**: MUST توفير اختبارات عقد وتكامل لكل endpoint أساسي.
- **FR-013**: MUST NOT إضافة ORM أو Authentication أو Microservices في النسخة الأولى.

### Key Entities

- **Layer Definition**: إعداد Allowlist للاسم ونوع الهندسة والحقول والعلاقات.
- **GeoJSON Feature**: هندسة وخصائص ومعرف ثابت.
- **Related Record**: سجل وصفي تابع لمعلم مكاني.
- **API Error**: استجابة موحدة تحمل code وmessage وتفاصيل تحقق آمنة.

## Success Criteria

### Measurable Outcomes

- **SC-001**: تنجح جميع سيناريوهات CRUD للنواة عبر العقد المنشور.
- **SC-002**: ترفض 100% من أسماء الطبقات والجداول غير الموجودة في Allowlist.
- **SC-003**: تعود جميع الهندسات الخارجية في `EPSG:4326` وتبقى المخزنة في `EPSG:32637`.
- **SC-004**: لا تغير الطلبات غير الصالحة عدد السجلات أو بياناتها.
- **SC-005**: تغطي اختبارات العقد جميع endpoints وحالات الخطأ المحددة.

## Assumptions

- PostGIS وGeoServer جاهزان محليًا.
- API محلية وللتعلم، لذلك المصادقة مؤجلة.
- واجهة React ستستهلك العقد بعد وصول القالب.
