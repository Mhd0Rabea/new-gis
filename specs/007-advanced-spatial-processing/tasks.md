# مهام المرحلة 007

## Phase 1 — بوابة البيئة
- [x] T001 توثيق وجود وإصدارات GDAL وPDAL ودعم WebGL في docs/evidence/007-advanced-spatial-processing/preflight.md
- [x] T002 توثيق عينات Raster وLAS/LAZ الاصطناعية وحدود الحجم وCRS في specs/007-advanced-spatial-processing/research.md
- [x] T003 اتخاذ قرار مكتبة 3D بعد الفحص وتسجيله في specs/007-advanced-spatial-processing/research.md

## Phase 2 — الأساس
- [x] T004 [P] إنشاء مخطط processing_jobs وprocessing_artifacts في database/007-processing.sql
- [x] T005 [P] إنشاء عقود API في specs/007-advanced-spatial-processing/contracts/openapi.yaml
- [x] T006 إنشاء وحدة processing في api/src/processing/ وربط إعداد مجلد العمل البيئي
- [x] T007 إنشاء allowlist للعمليات والمعاملات والامتدادات في api/src/processing/processing.config.ts
- [x] T008 إنشاء خدمة طابور محلي محدود التوازي والاسترداد بعد إعادة التشغيل في api/src/processing/processing.service.ts
- [x] T009 إنشاء اختبارات أمان الملفات والمعاملات في api/test/processing/

## Phase 3 — US1 مركز المعالجة
- [x] T010 [P] [US1] إنشاء endpoints الرفع والمهام والإلغاء والمخرجات في api/src/processing/processing.controller.ts
- [x] T011 [P] [US1] إنشاء خدمات الواجهة في GIS-Base/src/features/processing/services/
- [x] T012 [US1] إنشاء صفحة مركز المعالجة في GIS-Base/src/pages/ProcessingPage.jsx
- [x] T013 [US1] إنشاء قائمة المهام والتقدم والسجل في GIS-Base/src/features/processing/components/

## Phase 4 — US2 Raster وDEM
- [x] T014 [US2] إنشاء محول GDAL الآمن في api/src/processing/adapters/gdal.adapter.ts
- [x] T015 [US2] تنفيذ الفحص والإحصاءات والكونتور والتظليل وإعادة الإسقاط
- [x] T016 [US2] إنشاء معاينة المخرجات وإضافتها المؤقتة للخريطة

## Phase 5 — US3 سحابات النقاط
- [x] T017 [US3] إنشاء محول PDAL الآمن في api/src/processing/adapters/pdal.adapter.ts
- [x] T018 [US3] تنفيذ الفحص والإحصاءات وقراءة الفئات وإنشاء DEM
- [x] T019 [US3] إنشاء لوحة نتائج سحابة النقاط في GIS-Base/src/features/processing/components/PointCloudResults.jsx

## Phase 6 — US4 العرض ثلاثي الأبعاد
- [x] T020 [US4] إنشاء مسار وصفحة العرض ثلاثي الأبعاد في GIS-Base/src/pages/ScenePage.jsx
- [x] T021 [US4] ربط DEM والطبقات المسموحة وأدوات الارتفاع والشفافية
- [x] T022 [US4] إضافة فحص WebGL والبديل ثنائي الأبعاد

## Phase 7 — التحقق
- [x] T023 تشغيل اختبارات API والتكامل ودورة الإلغاء والتنظيف
- [x] T024 اختبار الأداء والاستجابة والوصول للصفحات الجديدة
- [x] T025 توثيق الأدلة وتحديث docs/project-roadmap.md







## Phase 8: Convergence
- [x] T026 CRITICAL إزالة مسارات الأدوات المطلقة من المصدر وفصل ملفات الرفع عن مجلدات المستودع وفق Constitution XI وFR-003 (contradicts)
- [x] T027 نقل بيانات مهام المعالجة الوصفية إلى PostgreSQL مع استرداد آمن وفق plan: storage decision (contradicts)
- [x] T028 فحص سلامة الملف وCRS ونطاق التدريب قبل قبوله وفق FR-002 وSC-003 (missing)
- [x] T029 عرض كثافة النقاط ومدى الارتفاع والفئات الموجودة بأسماء عربية وفق US3 وFR-008 (partial)
- [x] T030 إنشاء معاينة قابلة للعرض لـ DEM الناتج من سحابة النقاط وفق FR-010 وSC-005 (partial)
- [x] T031 تطبيق سياسة تنظيف تلقائي قابلة للتهيئة للملفات المؤقتة وفق FR-015 (missing)
- [x] T032 إضافة إعادة تشغيل المهمة وسجل المعاملات القابل للتتبع وفق US1 وFR-006 (partial)
- [x] T033 تنفيذ اختبار مهمة طويلة وقياس زمن فتح المشهد ثلاثي الأبعاد وفق SC-002 وSC-006 (partial)

