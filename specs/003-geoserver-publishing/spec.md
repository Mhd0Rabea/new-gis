# Feature Specification: GeoServer Publishing

**Feature Branch**: `003-geoserver-publishing`

**Created**: 2026-10-03

**Status**: Implemented and verified (2026-10-06)

**Input**: نشر طبقات MGOS من PostGIS بواسطة GeoServer محلي للعرض والاستعلام فقط.

## User Scenarios & Testing

### User Story 1 - تشغيل GeoServer محليًا (Priority: P1)

كمطور، أريد تشغيل GeoServer محليًا باستخدام Java الموجودة كي أصل إلى لوحة الإدارة دون Docker أو تثبيت مكرر.

**Why this priority**: هو شرط النشر الأول ويحافظ على البيئة البسيطة.

**Independent Test**: فتح صفحة GeoServer المحلية وتسجيل إصدار الخادم ومسار Java وData Directory.

**Acceptance Scenarios**:

1. **Given** Java 17 موجودة، **When** يبدأ GeoServer، **Then** تستجيب صفحة الإدارة محليًا.
2. **Given** GeoServer مثبت مسبقًا، **When** يبدأ الفحص، **Then** يُعاد استخدامه دون إعادة تثبيت.

---

### User Story 2 - نشر النواة كخرائط (Priority: P2)

كمطور، أريد نشر طبقات النواة من PostGIS كي أتمكن من عرضها والتحقق من خصائصها عبر معايير OGC.

**Why this priority**: يقدم أول خدمة خرائط يمكن للواجهة استهلاكها.

**Independent Test**: عرض الطبقات الأربع في Layer Preview والتحقق من WMS وLegend وGetFeatureInfo.

**Acceptance Scenarios**:

1. **Given** اتصال PostGIS صالح، **When** تُنشر النواة، **Then** تظهر الطبقات بأسمائها القانونية وحدودها الصحيحة.
2. **Given** طلب WMS، **When** يحدد المستخدم نقطة على الخريطة، **Then** تعود خصائص العنصر المتوقع.

---

### User Story 3 - إتاحة قراءة المتجهات (Priority: P3)

كمطور، أريد إتاحة WFS/GeoJSON للقراءة مع منع الكتابة كي أتعلم الاستعلام دون تجاوز NestJS.

**Why this priority**: يفصل مسؤولية النشر عن مسؤولية التعديل.

**Independent Test**: تنفيذ GetFeature ناجح ومحاولة Transaction مرفوضة بحساب القراءة.

**Acceptance Scenarios**:

1. **Given** طبقة منشورة، **When** يطلب العميل WFS مع BBOX، **Then** يعود GeoJSON بالمعالم الواقعة ضمن النطاق.
2. **Given** مستخدم خدمة القراءة، **When** يحاول WFS-T، **Then** تُرفض العملية ولا تتغير البيانات.

### Edge Cases

- منفذ GeoServer مستخدم أو الخدمة متوقفة.
- Data Directory غير قابل للكتابة.
- اتصال PostGIS يفشل أو الجدول بلا مفتاح أساسي.
- Native CRS أو Bounding Box غير صحيحين.
- طبقة منشورة باسم لا يطابق الاسم القانوني.

## Requirements

### Functional Requirements

- **FR-001**: MUST فحص وجود GeoServer وإصداره قبل التثبيت.
- **FR-002**: MUST استخدام Temurin Java `17.0.20.1` الموجودة ما دامت متوافقة.
- **FR-003**: MUST تشغيل GeoServer محليًا على Windows دون Docker.
- **FR-004**: MUST استخدام Workspace واحد باسم `mgos` وPostGIS Store واحد.
- **FR-005**: MUST نشر أسماء الطبقات القانونية دون suffix هندسي.
- **FR-006**: MUST تعريف Native CRS `EPSG:32637` وحدود صحيحة لكل طبقة.
- **FR-007**: MUST توفير WMS وGetFeatureInfo وLegend للنواة ثم التوسعة.
- **FR-008**: MUST توفير WFS/GeoJSON للقراءة مع دعم BBOX.
- **FR-009**: MUST منع WFS-T في المسار الأساسي وحصر الكتابة في NestJS لاحقًا.
- **FR-010**: MUST استخدام Styles بسيطة ومقروءة دون تصميم زائد.
- **FR-011**: MUST توثيق URL الخدمات واختبارات GetCapabilities.
- **FR-012**: MUST عدم كشف حساب إدارة GeoServer أو بيانات اعتماده للواجهة.

### Key Entities

- **Workspace**: نطاق `mgos` لأسماء الخدمات.
- **PostGIS Store**: اتصال واحد بقاعدة البيانات المحلية.
- **Published Layer**: مورد يحمل الاسم القانوني وCRS وStyle.
- **Read Service**: WMS أو WFS مقيد بالقراءة.

## Success Criteria

### Measurable Outcomes

- **SC-001**: يبدأ GeoServer محليًا ويستجيب فحص الصحة في محاولة تشغيل موثقة.
- **SC-002**: تظهر طبقات النواة الأربع في Layer Preview بأسمائها القانونية.
- **SC-003**: تنجح اختبارات WMS وGetFeatureInfo وWFS لكل طبقة منشورة.
- **SC-004**: تعيد استعلامات BBOX فقط المعالم المتوقعة في مجموعة الاختبار.
- **SC-005**: تفشل محاولة كتابة WFS-T دون تغيير عدد السجلات.

## Assumptions

- PostGIS Integration مكتملة ومتحقق منها.
- Java موجودة، لكن GeoServer نفسه يحتاج فحصًا قبل التثبيت.
- الخدمات محلية لأغراض التعلم وليست معرضة للإنترنت.
