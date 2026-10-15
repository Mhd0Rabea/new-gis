# Tasks: تصنيف سحابات النقاط بالذكاء الاصطناعي

**Input**: وثائق التصميم في `specs/008-ai-point-classification/`

**Prerequisites**: plan.md، spec.md، research.md، data-model.md، contracts/openapi.yaml

## Phase 1: Setup

- [x] T001 إنشاء مجلدات AI والنموذج والعينات وفق الخطة في `api/src/processing/ai/` و`api/models/` و`gis/samples/ai/`
- [x] T002 [P] توثيق فحص البيئة وعدم توفر مكتبات ML الإضافية وإصدارات PDAL/Node في `docs/evidence/008-ai-point-classification/preflight.md`
- [x] T003 [P] إنشاء عينة تدريب وعينة اختبار اصطناعيتين منفصلتين ومتوازنتين للفئات الأربع في `gis/samples/ai/synthetic-point-training.json` و`gis/samples/ai/synthetic-point-test.json`
- [x] T004 توثيق مخطط السمات والفئات ومصدر العينات الاصطناعية في `gis/samples/ai/README.md`

## Phase 2: Foundational

- [x] T005 إنشاء جداول model_versions وai_classification_results وai_review_decisions وai_evaluation_runs مع منع الاعتماد دون مراجعة في `database/008-ai-classification.sql`
- [x] T006 [P] تعريف أنواع الفئات والثقة والتتبع والحالات في `api/src/processing/ai/ai-classification.types.ts`
- [x] T007 [P] إنشاء نموذج nearest-centroid موثق بالإصدار والفئات والسمات والتطبيع وحد الثقة ومصدر التدريب في `api/models/point-classifier-v1.json`
- [x] T008 إضافة عملية `ai-point-classification` وقائمة سماح معاملاتها وLAS/LAZ في `api/src/processing/processing.config.ts`
- [x] T009 إضافة مستودع PostgreSQL لنتائج AI والمراجعات والتقييمات في `api/src/processing/ai/ai-classification.repository.ts`
- [x] T010 إضافة اختبارات تحقق للعينة والنموذج والعقود الدستورية في `api/test/processing/ai-model-validation.spec.ts`

## Phase 3: User Story 1 - إنشاء اقتراح تصنيف (P1) — MVP

**Goal**: تشغيل نموذج موثق وإنتاج GeoJSON مؤقت بفئة وثقة دون تعديل المصدر.

**Independent Test**: تشغيل العينة الاصطناعية ثم التحقق من وجود الفئات والثقة وإصدار النموذج والتحذير مع بقاء LAS الأصلي دون تغيير.

- [x] T011 [P] [US1] كتابة اختبارات classifier لحالات الفئات الأربع وunknown وحد الثقة في `api/test/processing/ai-point-classifier.spec.ts`
- [x] T012 [P] [US1] كتابة اختبار عقد إنشاء المهمة وتفاصيلها وتنزيل artifact في `api/test/contract/ai-classification.e2e-spec.ts`
- [x] T013 [US1] تنفيذ توحيد السمات والمسافة والثقة وunknown في `api/src/processing/ai/point-classifier.ts`
- [x] T014 [US1] إنشاء محول PDAL آمن لاستخراج السمات المسموحة تدريجيًا في `api/src/processing/adapters/pdal.adapter.ts`
- [x] T015 [US1] دمج مهمة AI مع الطابور والتتبع والاسترداد وإنتاج GeoJSON EPSG:4326 في `api/src/processing/processing.service.ts`
- [x] T016 [US1] تنفيذ endpoints النماذج وإنشاء التصنيف والتفاصيل وartifact وفق العقد في `api/src/processing/processing.controller.ts`
- [x] T017 [P] [US1] إضافة خدمات الواجهة للتشغيل والتفاصيل والتنزيل في `GIS-Base/src/features/processing/services/processingApi.js`
- [x] T018 [US1] إنشاء لوحة تشغيل AI والتحذير وإصدار النموذج وحد الثقة والحالات العربية في `GIS-Base/src/features/processing/components/AiClassificationPanel.jsx`
- [x] T019 [US1] دمج اللوحة والنتيجة المؤقتة في `GIS-Base/src/pages/ProcessingPage.jsx`
- [x] T020 [US1] إضافة عرض GeoJSON المصنف كطبقة مؤقتة بفئات وألوان وثقة في `GIS-Base/src/pages/MapPage.jsx`

## Phase 4: User Story 2 - مراجعة النتيجة وتصحيحها (P2)

**Goal**: قبول أو رفض أو تصحيح النتيجة بسجل immutable ومنع الاعتماد التلقائي.

**Independent Test**: تصحيح فئة ورفض اقتراح منخفض الثقة ثم إعادة فتح النتيجة والتحقق من التاريخ والقيم قبل وبعد.

- [x] T021 [P] [US2] كتابة اختبارات منع الاعتماد دون قرار وحفظ تاريخ المراجعات في `api/test/processing/ai-review.spec.ts`
- [x] T022 [P] [US2] كتابة اختبار عقد إنشاء المراجعة وقراءة سجلها في `api/test/contract/ai-review.e2e-spec.ts`
- [x] T023 [US2] تنفيذ خدمة قرارات accept/correct/reject وقواعد الانتقال في `api/src/processing/ai/ai-review.service.ts`
- [x] T024 [US2] تنفيذ endpoints المراجعة وسجل القرارات والتنزيل المراجع في `api/src/processing/processing.controller.ts`
- [x] T025 [P] [US2] إضافة استدعاءات المراجعة والسجل في `GIS-Base/src/features/processing/services/processingApi.js`
- [x] T026 [US2] إنشاء واجهة مراجعة عربية تعرض الأصل والثقة والتصحيح والرفض في `GIS-Base/src/features/processing/components/ClassificationReview.jsx`
- [x] T027 [US2] دمج حالة المراجعة ومنع الاعتماد الصامت في `GIS-Base/src/pages/ProcessingPage.jsx`

## Phase 5: User Story 3 - مقارنة النموذج بخط الأساس (P3)

**Goal**: إظهار مقارنة قابلة للتكرار بين النموذج والقواعد والحقيقة المرجعية.

**Independent Test**: تشغيل مجموعة الاختبار وإظهار مصفوفتين ومقاييس كل فئة وmacro-F1 وتحديد اجتياز 0.80.

- [x] T028 [P] [US3] كتابة اختبارات مقاييس confusion matrix وprecision وrecall وF1 وabstention في `api/test/processing/ai-evaluation.spec.ts`
- [x] T029 [P] [US3] تنفيذ خط الأساس بالقواعد المعلنة دون استخدام النموذج في `api/src/processing/ai/rule-baseline.ts`
- [x] T030 [US3] تنفيذ التقييم ومصفوفة الالتباس ومقاييس كل فئة وmacro-F1 في `api/src/processing/ai/evaluation.ts`
- [x] T031 [US3] حفظ EvaluationRun وربطه بالمهمة وإتاحة endpoint المقارنة في `api/src/processing/processing.controller.ts`
- [x] T032 [P] [US3] إضافة استدعاء بيانات المقارنة في `GIS-Base/src/features/processing/services/processingApi.js`
- [x] T033 [US3] إنشاء واجهة المقارنة العربية والتحذير للفئات الضعيفة في `GIS-Base/src/features/processing/components/ClassificationComparison.jsx`
- [x] T034 [US3] دمج طبقات النموذج وخط الأساس والحقيقة المرجعية القابلة للإظهار والإخفاء في `GIS-Base/src/pages/MapPage.jsx`

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T035 [P] إضافة اختبارات رفض الملفات الحقيقية/الخارجة عن النطاق ومنع تسرب المسارات في `api/test/processing/ai-security.spec.ts`
- [x] T036 [P] إضافة أنماط RTL والاستجابة وحالات focus للواجهات الجديدة في `GIS-Base/src/styles/processing.css`
- [x] T037 تنفيذ اختبار لوحة المفاتيح والتشغيل والمراجعة والتنزيل وتوثيقه في `docs/evidence/008-ai-point-classification/accessibility.md`
- [x] T038 تشغيل quickstart وقياس SC-001 إلى SC-009 وتسجيل النتائج في `docs/evidence/008-ai-point-classification/verification.md`
- [x] T039 تحديث حالة المرحلة 008 وحدود النموذج في `docs/project-roadmap.md`

## Dependencies & Execution Order

- Phase 1 ثم Phase 2 إلزاميتان قبل قصص المستخدم.
- US1 هو MVP ويجب إكماله قبل دمج US2 وUS3 مع النتيجة، مع إمكان بدء اختبارات وخدمات US2/US3 المستقلة بعد Phase 2.
- US2 وUS3 قابلتان للتطوير بالتوازي بعد استقرار عقد ClassificationResult.
- Phase 6 تعتمد على القصص المطلوبة للاعتماد.

## Parallel Opportunities

- T002 وT003 بالتوازي.
- T006 وT007 بالتوازي بعد T005.
- اختبارات العقد والوحدة داخل كل قصة قابلة للتوازي.
- خدمات الواجهة ذات [P] قابلة للتنفيذ بالتوازي مع خدمة API المقابلة بعد تثبيت العقد.
- T029 يمكن تنفيذه بالتوازي مع اختبارات T028.

## Implementation Strategy

1. MVP: T001–T020 لإنشاء تصنيف مؤقت قابل للعرض والاختبار.
2. Human Review: T021–T027 لإغلاق بوابة الحوكمة.
3. Explainability: T028–T034 للمقارنة والمقاييس.
4. Validation: T035–T039 لإغلاق معايير النجاح والتوثيق.


## Phase 7: Convergence

- [X] T040 [US1] CRITICAL شغّل استخراج سمات PDAL على ملف LAS/LAZ المحدد فعليًا، ومنع ملف JSON الاختباري من أن يحل محل المدخل المختار per FR-001 and US1/AC1 (contradicts)
- [X] T041 [US2] CRITICAL امنع حالة approved ما دامت أي وحدة تحتاج مراجعة، وافصل قرار النتيجة الكاملة عن قرار النقطة per FR-006, FR-009, SC-003 and Constitution X (contradicts)
- [X] T042 [US2] أنشئ artifact مراجعًا مستقلًا، وحدّثه عند التصحيح، واستعد حالات النقاط بعد إعادة التشغيل، وأضف تنزيلًا واضحًا للنسختين per FR-007, FR-008 and FR-017 (partial)
- [X] T043 [US1] أعد التحقق من سلامة الملف وCRS والنطاق الاصطناعي عند بدء كل تصنيف من العينات أو المرفوعات per FR-015 and US1/AC2 (partial)
- [X] T044 حافظ على إصدار النموذج وحد الثقة وكل معاملات المهمة عند إعادة المحاولة per FR-004 and FR-014 (partial)
- [X] T045 [US2] أتح الوصول إلى جميع النقاط ومراجعتها بلوحة المفاتيح دون قصر القائمة على أول 100 نقطة per FR-007, SC-005 and SC-009 (partial)
- [X] T046 [US1] اربط تنفيذ AI بالعملية الفرعية المسجلة لكي يوقف الإلغاء الاستخراج ولا يتحول لاحقًا إلى completed per Edge Case: إلغاء المهمة (partial)

