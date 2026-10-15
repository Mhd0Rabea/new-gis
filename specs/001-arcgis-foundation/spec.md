# Feature Specification: ArcGIS Foundation

**Feature Branch**: `001-arcgis-foundation`

**Created**: 2026-10-03

**Status**: Implemented with documented evidence gaps (2026-10-06)

**Input**: تأسيس مشروع MGOS في ArcGIS Pro بقاعدة File Geodatabase وأسماء ثابتة وبيانات اصطناعية.

## User Scenarios & Testing

### User Story 1 - إنشاء النواة المكانية (Priority: P1)

كمتعلم GIS، أريد مشروعًا يحتوي النواة المكانية والوصفية كي أتعلم إنشاء النقاط والخطوط والمضلعات والجداول والعلاقات في مسار صغير مكتمل.

**Why this priority**: هذه النواة تغطي مفاهيم ArcGIS الأساسية وتنتج أول قيمة تعليمية مستقلة.

**Independent Test**: فتح المشروع والتحقق من وجود أربع طبقات أساسية وثلاثة جداول وإدخال سجل صالح في كل نوع.

**Acceptance Scenarios**:

1. **Given** مشروع فارغ، **When** تُنشأ النواة، **Then** توجد `Military_Bases` و`Checkpoints` و`Operation_Sectors` و`Patrol_Routes` بأنواع الهندسة الصحيحة.
2. **Given** النواة المنشأة، **When** يضيف المتعلم سجلًا، **Then** تُطبق أسماء الحقول وAliases وDomains المعتمدة.

---

### User Story 2 - التحقق من العلاقات والجودة (Priority: P2)

كمتعلم GIS، أريد ربط السجلات الوصفية بالطبقات والتحقق من العلاقات المكانية كي أفهم سلامة البيانات لا مجرد رسمها.

**Why this priority**: العلاقات وTopology يحولان البيانات المنفصلة إلى نموذج يمكن فحصه.

**Independent Test**: ربط أفراد وآليات بقاعدة وحادث بقطاع، ثم إدخال خطأ مكاني مقصود والتأكد من اكتشافه.

**Acceptance Scenarios**:

1. **Given** قاعدة لها `GlobalID`، **When** تضاف سجلات مرتبطة، **Then** تظهر عبر علاقة 1:M الصحيحة.
2. **Given** قاعدة خارج أي قطاع أو قطاعان متداخلان، **When** تُفحص Topology، **Then** يظهر الخطأ ولا يُقبل التحقق النهائي قبل معالجته.

---

### User Story 3 - إكمال مخطط MGOS (Priority: P3)

كمتعلم GIS، أريد إكمال الطبقات والجداول المتبقية بنفس القواعد كي أمتلك نموذجًا متسقًا جاهزًا للنقل إلى PostGIS.

**Why this priority**: التوسع مهم، لكنه يأتي بعد إثبات النواة لتجنب تكرار أخطاء التصميم.

**Independent Test**: مقارنة تقرير Schema بالقائمة القانونية والتأكد من وجود جميع العناصر والأسماء والعلاقات.

**Acceptance Scenarios**:

1. **Given** نواة ناجحة، **When** يكتمل المخطط، **Then** توجد Feature Datasets الستة والطبقات التسع والجداول العشرة بالأسماء المعتمدة.
2. **Given** بيانات اصطناعية مكتملة، **When** تُفتح الخريطة، **Then** تعرض Symbology وLabels وPopups قابلة للفهم دون تحليل متقدم.

### Edge Cases

- محاولة إنشاء عنصر باسم يتضمن `Point` أو `Line` أو `Polygon` بدل الاسم القانوني.
- اختيار CRS مختلف لإحدى الطبقات داخل Feature Dataset.
- حذف سجل أصل له سجلات مرتبطة.
- إدخال Domain code غير معرف أو GUID مفقود.
- وجود هندسة فارغة أو ذاتية التقاطع أو خارج نطاق التدريب.

## Requirements

### Functional Requirements

- **FR-001**: MUST إنشاء `MGOS.aprx` و`MGOS.gdb` دون تعديل `1.docx`.
- **FR-002**: MUST استخدام `EPSG:32637` لكل Feature Datasets والطبقات المتجهة.
- **FR-003**: MUST إنشاء Feature Datasets: `Base_Data`, `Operations`, `Intelligence`, `Logistics`, `Infrastructure`, `Analysis`.
- **FR-004**: MUST إنشاء Feature Classes بالأسماء والأنواع: `Military_Bases` Point، `Checkpoints` Point، `Operation_Sectors` Polygon، `Patrol_Routes` Polyline، `Threat_Areas` Polygon، `Supply_Routes` Polyline، `Military_Warehouses` Point، `Airports` Point، `Communication_Towers` Point.
- **FR-005**: MUST التعامل مع `Spatial_Analysis` كـRaster Dataset لا Feature Class.
- **FR-006**: MUST إنشاء الجداول: `Military_Personnel`, `Military_Vehicles`, `Weapons_Inventory`, `Intelligence_Reports`, `Military_Incidents`, `Communication_Devices`, `Maintenance_Records`, `System_Users`, `Audit_Log`, `Attachments_Metadata`.
- **FR-007**: MUST استخدام أسماء الحقول الإنجليزية المحددة في نموذج البيانات وAliases عربية.
- **FR-008**: MUST تطبيق Coded Value Domains المحددة ومنع القيم غير المعروفة.
- **FR-009**: MUST إضافة `GlobalID` للأصول واستخدام GUID كمفاتيح للعلاقات.
- **FR-010**: MUST إنشاء العلاقات الست القانونية بين الطبقات والجداول، مع إبقاء العلاقات الإضافية خارج النسخة الأولى.
- **FR-011**: MUST تطبيق قواعد جودة مكانية تكشف تداخل القطاعات والعناصر الأساسية الواقعة خارج القطاع والمسار المتقاطع مع نفسه.
- **FR-012**: MUST استخدام بيانات اصطناعية فقط ضمن نطاق عام قرب إدلب.
- **FR-013**: MUST إنتاج Symbology وLabels وPopups للنواة ثم تطبيق النمط نفسه على التوسعة.
- **FR-014**: MUST إنتاج تقرير Schema ودليل تحقق يثبت اكتمال الأسماء والأنواع والعلاقات.
- **FR-015**: MUST NOT تنفيذ AI أو Forecasting أو Drone Analytics أو Real-time Tracking في هذه المرحلة.

### Key Entities

- **Feature Dataset**: حاوية موضوعية تشترك عناصرها في CRS واحد.
- **Feature Class**: طبقة مكانية ذات اسم قانوني ونوع هندسة وحقول وDomains.
- **Standalone Table**: سجلات وصفية مرتبطة أو مستقلة بلا هندسة.
- **Relationship Class**: علاقة 1:M مبنية على `GlobalID` وGUID.
- **Topology Rule**: قاعدة تحقق مكانية محدودة قابلة لإظهار الخطأ وتصحيحه.
- **Raster Dataset**: عنصر `Spatial_Analysis` المؤجل إلى تجربة Raster بسيطة.

## Success Criteria

### Measurable Outcomes

- **SC-001**: يستطيع المتعلم إنشاء وتحرير سجل صحيح في كل نوع هندسي أساسي خلال جلسة واحدة.
- **SC-002**: يطابق تقرير Schema جميع الأسماء القانونية بنسبة 100%.
- **SC-003**: ترفض Domains جميع قيم الاختبار غير المعرفة وتقبل القيم القانونية.
- **SC-004**: تظهر العلاقات الثلاث الأساسية سجلاتها المرتبطة دون سجلات يتيمة في عينة الاختبار.
- **SC-005**: تكشف قواعد الجودة 100% من الأخطاء المكانية المقصودة في سيناريو التحقق.
- **SC-006**: لا يحتوي المشروع على مواقع حقيقية أو مهام تحليل متقدم.

## Assumptions

- ArcGIS Pro `3.7.1 Standard` متاح للمستخدم.
- النواة تُنفذ قبل التوسعة الكاملة.
- بيانات التدريب قليلة ومصممة للتعلم وليست لقياس الأداء.
- `Spatial_Analysis` يمكن أن يبقى فارغًا حتى تمرين Raster مستقل.
