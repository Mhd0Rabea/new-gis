# Tasks: PostGIS Integration

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`

**Rule**: PostgreSQL وPostGIS محليان؛ لا Docker، ولا تُحذف بيانات `MGOS.gdb` بعد النقل.

## Phase 1: Setup

- [x] T001 إنشاء مجلدات `database/init/`, `database/migrations/`, `database/verification/`, و`docs/evidence/002-postgis-integration/`
- [x] T002 التحقق من PostgreSQL 18.6 وخدمة `postgresql-x64-18` وتسجيل النتيجة في `docs/evidence/002-postgis-integration/preflight.md`
- [x] T003 التحقق من توفر PostGIS 3.6.2 محليًا قبل أي تثبيت وتسجيل النتيجة في `docs/evidence/002-postgis-integration/preflight.md`

## Phase 2: Foundation

- [x] T004 إنشاء `database/init/001-create-mgos.sql` لإنشاء قاعدة `mgos` وتمكين `postgis` بصورة قابلة لإعادة التشغيل
- [x] T005 إنشاء `database/init/002-create-schema.sql` لتعريف Schema `mgos` والأدوار المطلوبة دون أسرار
- [x] T006 إنشاء مخطط الجداول وUUID والمفاتيح الأجنبية وفهارس GiST/B-tree في `database/migrations/001-core-schema.sql`
- [x] T007 إنشاء `database/verification/verify-migration.sql` لفحص الإصدار وSRID والأعداد والمفاتيح والفهارس

## Phase 3: User Story 1 - التحقق من البيئة المحلية (P1)

**Goal**: قاعدة `mgos` محلية مهيأة واتصال ArcGIS Pro ناجح.

**Independent Test**: يعيد PostGIS إصداره وتظهر قاعدة `mgos` في ArcGIS Pro عبر Database Connection.

- [x] T008 [US1] تشغيل ملفات `database/init/` والتحقق من `PostGIS_Full_Version()` في قاعدة `mgos`
- [x] T009 [US1] إنشاء اتصال ArcGIS Pro محلي `*.sde` وإبقاؤه خارج Git، مع اكتشافه تلقائيًا أو تمرير مساره عند التشغيل
- [x] T010 [US1] توثيق نتيجة الاتصال دون أسرار في `docs/evidence/002-postgis-integration/arcgis-connection.md`

## Phase 4: User Story 2 - نقل النواة والتحقق منها (P2)

**Goal**: نقل طبقات النواة من File Geodatabase إلى PostGIS مع الحفاظ على الهوية والهندسة.

**Independent Test**: تطابق الأسماء والأعداد والمعرفات وSRID=32637 بين المصدر والوجهة لعينة النواة.

- [x] T011 [US2] تشغيل `database/migrations/001-core-schema.sql` لإنشاء مخطط النواة في قاعدة `mgos`
- [x] T012 [US2] نقل طبقات النواة من File Geodatabase المكتشفة أو المحددة عبر ArcGIS Pro إلى الوجهة التي يحددها اتصال `.sde`
- [x] T013 [US2] التحقق من تحويل GlobalID/GUID إلى UUID والعلاقات إلى Foreign Keys باستخدام `database/verification/verify-migration.sql`
- [x] T014 [US2] مقارنة أعداد المعالم وصلاحية الهندسة وSRID وتسجيل النتائج في `docs/evidence/002-postgis-integration/core-transfer.md`
- [x] T015 [US2] إعادة تنفيذ مسار النقل الديناميكي والتأكد من عدم اعتماده على مسار جهاز، وتوثيقه في `specs/002-postgis-integration/quickstart.md`

## Phase 5: User Story 3 - إكمال مخزن النشر (P3)

**Goal**: توفر جميع الطبقات والجداول المعتمدة في PostGIS تمهيدًا للنشر.

**Independent Test**: ينجح `verify_mgos.sql` على كامل المخطط ولا توجد أسماء إضافية أو ناقصة.

- [x] T016 [US3] نقل Feature Classes الخمس المتبقية بأسمائها Canonical مع mapping مركزي إلى أسماء PostgreSQL الفيزيائية lowercase
- [x] T017 [US3] نقل الجداول المستقلة العشرة بأسمائها Canonical مع mapping مركزي إلى أسماء PostgreSQL الفيزيائية lowercase
- [x] T018 [US3] التحقق من جميع Foreign Keys وGiST indexes وصلاحية الهندسات عبر `database/verification/verify-migration.sql`
- [x] T019 [US3] توثيق عدم تشغيل `ogr2ogr` لأن مسار ArcPy الأساسي نجح وتوثيق الأمر الاحتياطي في `docs/evidence/002-postgis-integration/ogr2ogr-fallback.md`
- [x] T020 [US3] تنفيذ المشغّل الديناميكي في وضعي DryRun والنقل الكامل وتسجيل النتيجة في `docs/evidence/002-postgis-integration/migration-report.md`

## Dependencies

`T001-T003` → `T004-T007` → `US1` → `US2` → `US3` → `Portability Hardening`. ArcGIS Pro هو مسار النقل الأساسي؛ `ogr2ogr` احتياطي فقط.

## Stop Gate

بعد T023 تتوقف المرحلة للمراجعة. لا يبدأ نشر GeoServer قبل قبول نتائج النقل والتحقق.

## Phase 6: Portability Hardening

**Goal**: تمكين تجهيز نسخة المشروع على جهاز آخر دون الاعتماد على مسارات أو افتراضات غير موثقة.

**Independent Test**: يعيد `scripts/preflight.ps1 -Target PostGIS` نتيجة `PASS`، ثم ينجح `import-mgos.ps1 -DryRun` دون تعديل البيانات.

- [x] T021 [US4] [FR-014] توثيق البرامج المطلوبة وترتيب تجهيز جهاز جديد وسياسة مشاركة الأسرار في `docs/setup-and-portability.md`
- [x] T022 [US4] [FR-014] إنشاء `scripts/preflight.ps1` لفحص ملفات المشروع وArcGIS Pro وPostgreSQL/PostGIS وJava وGeoServer وNode حسب المرحلة دون تثبيت شيء
- [x] T023 [US4] [FR-014] [SC-006] إضافة تحقق فعلي من إصداري PostgreSQL وPostGIS إلى DryRun وتشغيل فحص قابلية النقل على البيئة الحالية