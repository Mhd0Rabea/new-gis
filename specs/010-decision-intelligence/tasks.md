# Tasks: مركز القرار والذكاء المكاني

**Input**: Design documents from `/specs/010-decision-intelligence/`

## Phase 1: Setup

- [x] T001 إنشاء نطاق decision ومفاتيح التنقل في `api/src/decision/` و`GIS-Base/src/features/decision/`.
- [x] T002 [P] إضافة صفحة مركز القرار ومسارها في `GIS-Base/src/pages/DecisionCenterPage.jsx` و`GIS-Base/src/app/routes.jsx`.
- [x] T003 [P] إضافة نصوص عربية موحدة لحالات التعليم والمراجعة في `GIS-Base/src/features/decision/config/decisionLabels.js`.

## Phase 2: Foundational

- [x] T004 إنشاء نماذج تقييم الخطر والمسار والإنذار والتوقع والتغير في `api/src/decision/decision.types.ts`.
- [x] T005 تنفيذ مصدر عينات مرفوعة من المستخدم قابل لإعادة التشغيل في `api/src/decision/decision.service.ts`.
- [x] T006 تنفيذ التحكم العربي بالأخطاء والتحقق من قيم المراجعة في `api/src/decision/decision.controller.ts`.

## Phase 3: User Story 1 - تقييم المخاطر المكاني (P1)

**Goal**: عرض مخاطر مفسرة للعناصر المدعومة.

- [x] T007 [US1] تنفيذ محرك قواعد الخطر والعوامل والثقة في `api/src/decision/decision.service.ts`.
- [x] T008 [US1] تنفيذ عقد `GET /api/decision/risk` في `api/src/decision/decision.controller.ts`.
- [x] T009 [US1] إنشاء بطاقة ترتيب المخاطر وشرح العوامل في `GIS-Base/src/features/decision/components/RiskAssessmentPanel.jsx`.
- [x] T010 [US1] ربط واجهة القراءة في `GIS-Base/src/features/decision/services/decisionApi.js`.

## Phase 4: User Story 2 - جاهزية ومسارات الدوريات (P1)

**Goal**: مقارنة المسارات وتوصيات قابلة للمراجعة.

- [x] T011 [US2] تنفيذ حساب الجاهزية وترتيب البدائل في `api/src/decision/decision.service.ts`.
- [x] T012 [US2] تنفيذ عقد `GET /api/decision/routes` في `api/src/decision/decision.controller.ts`.
- [x] T013 [US2] إنشاء واجهة مقارنة المسارات في `GIS-Base/src/features/decision/components/RouteReadinessPanel.jsx`.
- [x] T014 [US2] دمج مخاطر المسار والسبب في `GIS-Base/src/pages/DecisionCenterPage.jsx`.

## Phase 5: User Story 3 - الإنذارات والتتبع التعليمي (P2)

- [x] T015 [US3] تنفيذ حالة محاكاة التتبع وتوليد الإنذارات في `api/src/decision/decision.service.ts`.
- [x] T016 [US3] تنفيذ عقود بدء/إيقاف التتبع والإنذارات والمراجعة في `api/src/decision/decision.controller.ts`.
- [x] T017 [US3] إنشاء شريط التحكم وبطاقات الإنذار في `GIS-Base/src/features/decision/components/TrackingAlertsPanel.jsx`.

## Phase 6: User Story 4 - استخبارات مكانية وتنبؤ (P2)

- [x] T018 [US4] تنفيذ خط الأساس والتوقع والثقة والقيود في `api/src/decision/decision.service.ts`.
- [x] T019 [US4] تنفيذ عقد القراءة والمراجعة للتوقع في `api/src/decision/decision.controller.ts`.
- [x] T020 [US4] إنشاء لوحة المؤشرات والتوقع في `GIS-Base/src/features/decision/components/ForecastPanel.jsx`.

## Phase 7: User Story 5 - تحليل صور جوية تعليمي (P3)

- [x] T021 [US5] تنفيذ عينات التغير ونتائج المقارنة المرفوعة من المستخدم في `api/src/decision/decision.service.ts`.
- [x] T022 [US5] تنفيذ عقود قراءة ومراجعة التغير في `api/src/decision/decision.controller.ts`.
- [x] T023 [US5] إنشاء لوحة مقارنة الصور والتغير في `GIS-Base/src/features/decision/components/ChangeAnalysisPanel.jsx`.

## Phase 8: Polish & Verification

- [x] T024 تنسيق كل عناصر مركز القرار بأسطح معتمة وحالات تركيز في `GIS-Base/src/styles/operations.css`.
- [x] T025 تحديث توثيق المرحلة والأدلة في `docs/project-roadmap.md` و`docs/evidence/010-decision-intelligence/`.
- [x] T026 تشغيل بناء الواجهة والتحقق من عقود API وفق `specs/010-decision-intelligence/quickstart.md`.

## Dependencies & Execution Order

`T001–T006 → US1 → US2 → US3/US4 → US5 → T024–T026`.

## Implementation Strategy

تبدأ القيمة العملية بمحرك المخاطر والمسارات، ثم تضاف المحاكاة والتنبؤ وتغير الصور كطبقات مستقلة. لا تبدأ أي مهمة تنفيذية قبل موافقة المستخدم على هذه الخطة.

## Phase 9: Convergence

- [x] T027 حفظ جلسات التتبع والإنذارات والتوقعات ومرشحات التغير وقرارات المراجعة في PostgreSQL/PostGIS بدل الذاكرة وفق plan: Storage وFR-009 (partial)
- [x] T028 استخراج هندسة GeoJSON فعلية لمناطق التغير المرشحة وتحويلها إلى EPSG:4326 بدل الاكتفاء بمتوسط الحزمة وفق US5/AC1 وdata-model: ChangeCandidate (partial)
- [x] T029 مطابقة عقود القراءة والإجراءات مع `contracts/decision-center-api.md` أو تحديث العقد المعتمد صراحةً لمسارات الجلسات الحالية وفق plan: API contract (contradicts)
- [x] T030 حفظ `reviewNote` مع كل قرار مراجعة وعرضه في الواجهة وفق data-model: DecisionAlert وChangeCandidate وFR-009 (partial)
- [x] T031 إضافة النطاق المكاني والفترة الزمنية إلى تحليل المؤشرات والتوقع وفق US4/AC1 وdata-model: ForecastInsight (partial)
- [x] T032 توحيد مقياس الثقة واستبعاد عوامل المخاطر المفقودة فعليًا من الحساب بدل معاملتها كقيمة صفر وفق data-model: RiskAssessment وEdge Cases (partial)
- [x] T033 اشتقاق إنذارات دخول مناطق الخطر وتأخر التحديث وانخفاض الجاهزية من نقاط التتبع والطبقات المرفوعة وفق US3/AC1 وdata-model: DecisionAlert (partial)
- [ ] T034 إضافة اختبارات عقود وتكامل لمركز القرار وتنفيذ سيناريوهات `quickstart.md` ببيانات يرفعها المستخدم وتوثيق النتائج وفق T026 وplan: Testing (partial)
  - أُنجزت الاختبارات الآلية في 2026-10-12: 25 عقدًا و8 تكاملات.
  - في 2026-10-13 نُفذت سيناريوهات البيانات الحقيقية بمدخلات مدنية مفتوحة من ريف دمشق، ونجح PostGIS وWFS وWMS والتحليل. بقيت المراجعة البشرية للإنذار والتوقع ومرشح التغير والتحقق من استمرار قراراتها فقط؛ التفاصيل في `docs/evidence/010-decision-intelligence/rif-dimashq-real-data.md` و`t034-verification.md`.