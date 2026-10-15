# Tasks: NestJS Spatial API

**Input**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`

**Rule**: Module واحد `features`، مكتبة `pg` وSQL مباشر، بلا ORM وبلا خدمات نضافية.

## Phase 1: Setup

- [x] T001 إنشاء تطبيق NestJS في `api/` مع TypeScript دون إنشاء Frontend
- [x] T002 تثبيت الحد الأدنى من الاعتمادات: `pg`, `class-validator`, `class-transformer`, وSwagger في `api/package.json`
- [x] T003 [P] إنشاء `api/.env.example` لإعدادات PostGIS دون أسرار
- [x] T004 [P] إعداد أوامر lint وtest وstart في `api/package.json`

## Phase 2: Foundation

- [x] T005 إنشاء إعداد ومزوّد `pg.Pool` في `api/src/config/database.config.ts`
- [x] T006 إنشاء allowlist الطبقات والجداول المرتبطة في `api/src/features/layers.config.ts` بالأسماء الحرفية المعتمدة
- [x] T007 [P] إنشاء DTOs للـ GeoJSON والمعاملات في `api/src/features/dto/`
- [x] T008 إنشاء `api/src/features/features.module.ts` وربطه في `api/src/app.module.ts`
- [x] T009 إعداد ValidationPipe ومعالجة أخطاء موحدة في `api/src/main.ts`
- [x] T010 إعداد Swagger ليعكس `specs/004-nestjs-spatial-api/contracts/openapi.yaml` في `api/src/main.ts`

## Phase 3: User Story 1 - قراءة الطبقات والمعالم (P1)

**Goal**: قراءة FeatureCollection أو Feature كـ GeoJSON في EPSG:4326.

**Independent Test**: تنجح طلبات GET لطبقة مسموحة وتُرفض طبقة غير مسموحة دون حقن SQL.

- [x] T011 [P] [US1] كتابة اختبارات عقد GET في `api/test/contract/features-read.e2e-spec.ts` وفق `contracts/openapi.yaml`
- [x] T012 [US1] تنفيذ استعلام القائمة مع `ST_Transform(geom, 4326)` وحدود pagination في `api/src/features/features.service.ts`
- [x] T013 [US1] تنفيذ استعلام المعلم بالمعرف في `api/src/features/features.service.ts`
- [x] T014 [US1] تنفيذ `GET /api/features/:layer` و`GET /api/features/:layer/:id` في `api/src/features/features.controller.ts`
- [x] T015 [US1] التحقق من حالات 400 و404 و500 وتشغيل `api/test/contract/features-read.e2e-spec.ts`

## Phase 4: User Story 2 - إنشاء وتعديل وحذف معلم (P2)

**Goal**: CRUD آمن عبر NestJS مع تحويل الهندسة من 4326 إلى 32637.

**Independent Test**: دورة POST→GET→PATCH→DELETE تعمل لمعلم اصطناعي وتترك قاعدة البيانات نظيفة.

- [x] T016 [P] [US2] كتابة اختبارات عقد CRUD في `api/test/integration/features-write.e2e-spec.ts`
- [x] T017 [US2] تنفيذ INSERT بمعاملات مربوطة و`ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($n),4326),32637)` في `api/src/features/features.service.ts`
- [x] T018 [US2] تنفيذ PATCH محدود بالحقول المسموحة ومعاملات مربوطة في `api/src/features/features.service.ts`
- [x] T019 [US2] تنفيذ DELETE بمعاملة قاعدة بيانات في `api/src/features/features.service.ts`
- [x] T020 [US2] تنفيذ POST وPATCH وDELETE في `api/src/features/features.controller.ts`
- [x] T021 [US2] التحقق من نوع الهندسة والإحداثيات والخصائص ورسائل الخطأ وتشغيل `api/test/integration/features-write.e2e-spec.ts`

## Phase 5: User Story 3 - قراءة السجلات المرتبطة (P3)

**Goal**: نرجاع سجلات مرتبطة من الجداول المسموحة فقط.

**Independent Test**: ينجح جدول مرتبط مسموح وتُرفض أسماء الجداول غير المدرجة في allowlist.

- [x] T022 [P] [US3] كتابة اختبارات العقد للسجلات المرتبطة في `api/test/contract/features-related.e2e-spec.ts`
- [x] T023 [US3] تنفيذ lookup العلاقة واستعلام الجدول المسموح في `api/src/features/features.service.ts`
- [x] T024 [US3] تنفيذ `GET /api/features/:layer/:id/related/:table` في `api/src/features/features.controller.ts`
- [x] T025 [US3] تشغيل `api/test/contract/features-related.e2e-spec.ts` والتحقق من 400 و404 والنتيجة الفارغة

## Phase 6: Verification

- [x] T026 تشغيل lint والاختبارات كاملة وتسجيل الأوامر في `docs/evidence/004-nestjs-spatial-api/test-results.md`
- [x] T027 مطابقة Swagger الناتج مع `specs/004-nestjs-spatial-api/contracts/openapi.yaml`
- [x] T028 تنفيذ `specs/004-nestjs-spatial-api/quickstart.md` وتسجيل النتيجة في `docs/evidence/004-nestjs-spatial-api/verification.md`

## Dependencies

تعتمد المرحلة على مخطط PostGIS المكتمل: `T001-T010` → `US1` → `US2` → `US3` → `T026-T028`.

## Stop Gate

بعد T028 تتوقف المرحلة للمراجعة. لا يُنشأ React قبل تقديم القالب وفحصه وإقرار خطة `005`.





