# Tasks: ArcGIS Foundation

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`

**Rule**: جميع البيانات اصطناعية، وجميع الأسماء تطابق `data-model.md` حرفيًا.

## Phase 1: Setup

- [x] T001 إنشاء مجلدات العمل `gis/` و`docs/evidence/001-arcgis-foundation/screenshots/`
- [x] T002 التحقق من ArcGIS Pro 3.7.1 Standard وتسجيل النتيجة في `docs/evidence/001-arcgis-foundation/preflight.md`
- [x] T003 إنشاء مشروع `gis/MGOS/MGOS.aprx` وقاعدة `gis/MGOS/MGOS.gdb` دون تعديل `1.docx`

## Phase 2: Foundation

- [x] T004 [P] إنشاء Domains المعتمدة في `gis/MGOS/MGOS.gdb` بحسب `data-model.md`
- [x] T005 إنشاء Feature Datasets: `Base_Data`, `Operations`, `Intelligence`, `Logistics`, `Infrastructure`, `Analysis` داخل `gis/MGOS/MGOS.gdb` باستخدام EPSG:32637
- [x] T006 تفعيل Global IDs للطبقات والجداول التي تدخل في العلاقات داخل `gis/MGOS/MGOS.gdb`

## Phase 3: User Story 1 - إنشاء النواة المكانية (P1)

**Goal**: نواة قابلة للرسم والاستعلام داخل ArcGIS Pro.

**Independent Test**: فتح `MGOS.aprx` ورسم معالم اصطناعية وحفظها في كل طبقة من النواة بلا أخطاء Schema أو CRS.

- [x] T007 [P] [US1] إنشاء `Base_Data/Military_Bases` و`Base_Data/Checkpoints` بالحقول المعتمدة في `gis/MGOS/MGOS.gdb`
- [x] T008 [P] [US1] إنشاء `Operations/Operation_Sectors` و`Operations/Patrol_Routes` بالحقول المعتمدة في `gis/MGOS/MGOS.gdb`
- [x] T009 [P] [US1] إنشاء `Intelligence/Threat_Areas` بالحقول المعتمدة في `gis/MGOS/MGOS.gdb`
- [x] T010 [P] [US1] إنشاء `Logistics/Supply_Routes` و`Logistics/Military_Warehouses` بالحقول المعتمدة في `gis/MGOS/MGOS.gdb`
- [x] T011 [P] [US1] إنشاء `Infrastructure/Airports` و`Infrastructure/Communication_Towers` بالحقول المعتمدة في `gis/MGOS/MGOS.gdb`
- [x] T012 [US1] إدخال مجموعة صغيرة من المعالم الاصطناعية المترابطة في طبقات النواة داخل `gis/MGOS/MGOS.gdb`
- [x] T013 [US1] إضافة طبقات النواة إلى خريطة `MGOS` في `gis/MGOS/MGOS.aprx` وحفظ رموز بسيطة قابلة للتمييز

## Phase 4: User Story 2 - التحقق من العلاقات والجودة (P2)

**Goal**: بيانات مترابطة وقواعد جودة مكانية محدودة ومفيدة.

**Independent Test**: إنشاء تقرير Schema وTopology خالٍ من الأخطاء غير المبررة.

- [x] T014 [P] [US2] إنشاء جداول `Military_Personnel`, `Military_Vehicles`, `Weapons_Inventory` بالحقول المعتمدة في `gis/MGOS/MGOS.gdb`
- [x] T015 [P] [US2] إنشاء جداول `Intelligence_Reports`, `Military_Incidents`, `Communication_Devices` بالحقول المعتمدة في `gis/MGOS/MGOS.gdb`
- [x] T016 [P] [US2] إنشاء جداول `Maintenance_Records`, `System_Users`, `Audit_Log`, `Attachments_Metadata` بالحقول المعتمدة في `gis/MGOS/MGOS.gdb`
- [x] T017 [US2] إنشاء Relationship Classes المحددة في `data-model.md` باستخدام GlobalID وGUID داخل `gis/MGOS/MGOS.gdb`
- [x] T018 [US2] إنشاء Topology محدود بالقواعد المعتمدة في `Operations` و`Logistics` داخل `gis/MGOS/MGOS.gdb`
- [x] T019 [US2] تشغيل Validate Topology ومعالجة الأخطاء أو توثيق الاستثناءات في `docs/evidence/001-arcgis-foundation/topology-summary.md`

## Phase 5: User Story 3 - إكمال مخطط MGOS (P3)

**Goal**: اكتمال المخطط المرجعي دون إضافة تحليل أو تنبؤ.

**Independent Test**: مطابقة تقرير ArcGIS Schema لجميع الأسماء والأنواع والحقول الواردة في `data-model.md`.

- [x] T020 [US3] إنشاء `Spatial_Analysis` كـ Raster Dataset في جذر `gis/MGOS/MGOS.gdb` باستخدام EPSG:32637 دون تشغيل نموذج تحليلي (لا يدعم File Geodatabase وضع Raster Dataset داخل Feature Dataset)
- [x] T021 [US3] إدخال سجلات اصطناعية قليلة في الجداول وربطها بالمعالم المناسبة داخل `gis/MGOS/MGOS.gdb`
- [x] T022 [US3] تصدير تقرير Schema النهائي إلى `docs/evidence/001-arcgis-foundation/schema-report.pdf`
- [x] T023 [US3] التقاط لقطات تحقق للمخطط والخريطة والعلاقات في `docs/evidence/001-arcgis-foundation/screenshots/`
- [x] T024 [US3] تنفيذ خطوات `specs/001-arcgis-foundation/quickstart.md` وتسجيل النتيجة في `docs/evidence/001-arcgis-foundation/verification.md`

## Dependencies

`T001-T003` → `T004-T006` → `US1` → `US2` → `US3`. المهام الموسومة `[P]` فقط قابلة للتوازي.

## Stop Gate

بعد T024 تتوقف المرحلة للمراجعة. لا تبدأ `002-postgis-integration` قبل قبول مخطط ArcGIS وأدلته.



