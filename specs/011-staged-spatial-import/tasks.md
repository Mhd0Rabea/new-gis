# Tasks: الاستيراد المكاني المرحلي والمصدر المشترك

**Input**: specs/011-staged-spatial-import/
**Prerequisites**: plan.md، spec.md، research.md، data-model.md، contracts/

## Phase 1: Setup

- [X] T001 إضافة migration لجداول staging وحقول المصدر والإصدار في database/migrations/005-staged-spatial-import.sql
- [X] T002 [P] إنشاء هيكل imports module في api/src/imports/imports.module.ts
- [X] T003 [P] إنشاء عميل imports في GIS-Base/src/features/imports/importsApi.js

## Phase 2: Foundational

- [X] T004 تسجيل ImportsModule في api/src/app.module.ts
- [X] T005 إنشاء registry مركزي لمطابقة الحقول والدومينات في api/src/imports/import-mappings.ts
- [X] T006 إضافة اختبارات عقد الاستيراد الأساسية في api/test/contract/imports.e2e-spec.ts

## Phase 3: User Story 1 - الرفع والفحص (P1)

**Independent Test**: رفع ملف 12 قاعدة وظهور تقرير صالح دون تغير التشغيل.

- [X] T007 [US1] تنفيذ parsing والتحقق والتطبيع والتخزين المرحلي في api/src/imports/imports.service.ts
- [X] T008 [US1] تنفيذ POST/GET/report endpoints في api/src/imports/imports.controller.ts
- [X] T009 [US1] بناء معالج رفع مرحلي متعدد الخطوات في GIS-Base/src/features/imports/ImportWizard.jsx
- [X] T010 [US1] دمج المعالج في GIS-Base/src/pages/DataManagementPage.jsx
- [X] T011 [US1] تنسيق حالات الفحص في GIS-Base/src/styles/shared.css

## Phase 4: User Story 2 - التكرارات والقرارات (P2)

**Independent Test**: اكتشاف source_id أو الاسم+25m وعدم السماح بالتحديث بلا قرار.

- [X] T012 [US2] تنفيذ كشف التكرار المؤكد والمحتمل في api/src/imports/imports.service.ts
- [X] T013 [US2] تنفيذ PATCH decisions في api/src/imports/imports.controller.ts
- [X] T014 [US2] إضافة مراجعة التكرارات والقرارات في GIS-Base/src/features/imports/ImportWizard.jsx

## Phase 5: User Story 3 - الاعتماد والتزامن (P3)

**Independent Test**: اعتماد ذري، ثم تعديل ArcGIS يسبب version conflict لنسخة MGOS القديمة.

- [X] T015 [US3] تنفيذ commit transaction ورفض الدفعة في api/src/imports/imports.service.ts
- [X] T016 [US3] تنفيذ commit/reject endpoints في api/src/imports/imports.controller.ts
- [X] T017 [US3] تطبيق row_version في تحديثات MGOS داخل api/src/features/features.service.ts
- [X] T018 [US3] إضافة شاشة نتيجة الاعتماد وسجل الدفعة في GIS-Base/src/features/imports/ImportWizard.jsx

## Phase 6: Polish

- [X] T019 [P] توثيق اتصال ArcGIS Pro وأدوار PostgreSQL في docs/arcgis-postgis-shared-source.md
- [X] T020 تشغيل اختبارات API والبناء واختبار ملف gis/MGOS/imports/Military_Bases_Real.geojson حسب specs/011-staged-spatial-import/quickstart.md
- [X] T021 تحديث docs/project-roadmap.md بأدلة المرحلة 011

## Dependencies

T001-T005 تسبق القصص. US1 ثم US2 ثم US3. T019 يمكن بالتوازي بعد T001.

## Implementation Strategy

MVP هو US1: رفع وفحص دون كتابة تشغيلية. الإكمال المعتمد يشمل US2 وUS3 لمنع التكرار والتعارض.

## Phase 7: Convergence

- [X] T022 [US1] تحقق من إعلان CRS وأنواع القيم وحدودها وسجّل القيم الأصلية في مشكلات الفحص حسب FR-003 (partial)
- [X] T023 [US1] اعرض الحقول والقيم المطبّعة والتحويلات المقترحة بالعربية والقيم التقنية ككود في GIS-Base/src/features/imports/ImportWizard.jsx حسب FR-005 وFR-016 (partial)
- [X] T024 [US1] أضف قياس أداء آلي لفحص 10,000 معلم وتوثيق نتيجته حسب SC-002 (missing)
- [X] T025 [US2] أعد جميع التطابقات المحتملة للمراجعة بدل اختزالها إلى أول تطابق في api/src/imports/imports.service.ts حسب Edge Cases (partial)
- [X] T026 [US3] أضف حذف الدفعة وإعادة فحصها قبل الاعتماد في API والواجهة حسب FR-014 (partial)
- [X] T027 [US3] أتح تنزيل تقرير CSV من معالج الاستيراد في الواجهة حسب FR-015 (partial)
- [X] T028 [US3] أضف سجل دفعات قابلًا للفتح يعرض الملف والطبقة والتوقيت والأعداد والقرارات والنتيجة حسب US3/AC3 وFR-013 (partial)