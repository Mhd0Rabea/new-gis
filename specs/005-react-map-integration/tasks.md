# Tasks: React Map Integration

**Input**: وثائق التصميم في `specs/005-react-map-integration/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/frontend-integration.md`

**Tests**: لا تضاف حزمة اختبار جديدة في هذه المرحلة؛ يعتمد القبول على فحوص الجودة وسيناريوهات `quickstart.md` الرأسية.

**Organization**: المهام مرتبة حسب قصة المستخدم، ويجب التوقف والتحقق عند نهاية كل مرحلة.

## Phase 1: Setup

**Purpose**: تجهيز الاعتماد والإعداد المحلي القابل للنقل.

- [X] T001 تحقق من Node.js وnpm والإصدار الحالي لحزمة `ol` وسجل النتيجة في `specs/005-react-map-integration/research.md`
- [X] T002 ثبّت اعتماد `ol` المتوافق فقط وحدّث `GIS-Base/package.json` و`GIS-Base/package-lock.json`
- [X] T003 فعّل `MGOS_API_PROXY_TARGET` و`MGOS_GEOSERVER_PROXY_TARGET` عبر `loadEnv` وVite proxy في `GIS-Base/vite.config.js` مع إبقاء القيم النموذجية في `GIS-Base/.env.example`

---

## Phase 2: Foundational

**Purpose**: عقد إعداد وطبقات وخدمات مشترك قبل قصص المستخدم.

**⚠️ CRITICAL**: لا يبدأ عمل القصص قبل اكتمال هذه المرحلة.

- [X] T004 ثبّت أولوية runtime config ثم Vite fallback ثم المسارات النسبية في `GIS-Base/src/config/runtime.js` ووثّق النوع في `GIS-Base/src/vite-env.d.ts`
- [X] T005 أنشئ سجل الطبقات Canonical وهندساتها وعلاقاتها وحقولها القابلة للتحرير في `GIS-Base/src/features/map/config/layers.js`
- [X] T006 أنشئ دوال Axios صغيرة لعقود list/get/related/create/update/delete في `GIS-Base/src/features/map/services/featuresApi.js`
- [X] T007 أنشئ مولدات WMS وLegend وGetFeatureInfo المعتمدة على runtime config في `GIS-Base/src/features/map/services/geoserver.js`
- [X] T008 أنشئ reducer لحالات الطبقات والتحديد والفلتر والمسودة وفق `data-model.md` في `GIS-Base/src/features/map/useMapState.js`

**Checkpoint**: جميع عناوين الخدمات وأسماء الطبقات تأتي من الإعداد المركزي ولا توجد مصادقة.

---

## Phase 3: User Story 1 - عرض الخريطة والطبقات (Priority: P1) 🎯 MVP

**Goal**: فتح شاشة خريطة وتشغيل طبقات النواة وإخفاؤها وعرض Legend والنطاق.

**Independent Test**: تشغيل القالب والخدمات، تبديل طبقات النواة، تنفيذ Zoom to Extent، ثم إيقاف GeoServer والتحقق من خطأ محلي قابل لإعادة المحاولة.

- [X] T009 [P] [US1] أضف صفحة `MapPage` وحالات loading/error الأساسية في `GIS-Base/src/pages/MapPage.jsx`
- [X] T010 [P] [US1] أضف مسار الخريطة وبيانات التنقل دون حراسة صلاحيات في `GIS-Base/src/app/routes.jsx`
- [X] T011 [US1] أنشئ OpenLayers map وWMS sources للنواة مع cleanup عند unmount في `GIS-Base/src/features/map/components/MapCanvas.jsx`
- [X] T012 [P] [US1] أنشئ Layer Switcher وLegend وZoom to Extent من سجل الطبقات في `GIS-Base/src/features/map/components/LayerPanel.jsx`
- [X] T013 [US1] اربط `MapCanvas` و`LayerPanel` وحالات فشل WMS داخل `GIS-Base/src/pages/MapPage.jsx`
- [X] T014 [P] [US1] أضف تخطيط الخريطة المتجاوب وحالات focus المرئية في `GIS-Base/src/styles/map.css` واستورده من `GIS-Base/src/styles.css`
- [X] T015 [US1] نفّذ تحقق P1 المسجل في `specs/005-react-map-integration/quickstart.md` وسجل النتيجة في `docs/evidence/005-react-map-integration/p1-display.md`

**Checkpoint**: قصة P1 تعمل وحدها وتشكل MVP قابلًا للعرض.

---

## Phase 4: User Story 2 - الاستعلام والفلترة (Priority: P2)

**Goal**: تحديد معلم وقراءة خصائصه وعلاقاته وتطبيق فلتر بسيط قابل للمسح.

**Independent Test**: تحديد `Military_Bases` وعرض خصائصه وأفراده وآلياته، ثم تطبيق فلتر ومسحه.

- [X] T016 [P] [US2] أنشئ لوحة تفاصيل تعرض الخصائص والقيم الفارغة بأمان في `GIS-Base/src/features/map/components/FeatureDetails.jsx`
- [X] T017 [US2] اربط نقر الخريطة بـGetFeatureInfo ثم `GET /api/features/:layer/:id` في `GIS-Base/src/features/map/components/MapCanvas.jsx`
- [X] T018 [US2] حمّل العلاقات المسموحة فقط للمعلم المحدد عبر `featuresApi.js` واعرضها في `GIS-Base/src/features/map/components/FeatureDetails.jsx`
- [X] T019 [P] [US2] أضف فلتر طبقة بسيطًا قابلًا للمسح مع حقول allowlisted في `GIS-Base/src/features/map/components/LayerPanel.jsx`
- [X] T020 [US2] اربط الفلتر والتحديد وحالات empty/error دون reload كامل في `GIS-Base/src/pages/MapPage.jsx`
- [X] T021 [US2] نفّذ تحقق P2 المسجل في `specs/005-react-map-integration/quickstart.md` وسجل النتيجة في `docs/evidence/005-react-map-integration/p2-query.md`

**Checkpoint**: قصة P2 تعمل مع P1 ولا تعتمد على أدوات التحرير.

---

## Phase 5: User Story 3 - تحرير معلم (Priority: P3)

**Goal**: رسم معلم اصطناعي وتعديله وحذفه عبر NestJS فقط.

**Independent Test**: إنشاء معلم اصطناعي وتعديله وحذفه، ثم تجربة خطأ تحقق والتأكد من بقاء المسودة.

- [X] T022 [P] [US3] أنشئ لوحة تحرير تقودها `editableFields` وتحافظ على المسودة والأخطاء في `GIS-Base/src/features/map/components/EditPanel.jsx`
- [X] T023 [US3] أضف Draw وModify مع منع نوع هندسة غير مطابق للطبقة في `GIS-Base/src/features/map/components/MapCanvas.jsx`
- [X] T024 [US3] اربط create/update/delete بعقد NestJS في `GIS-Base/src/pages/MapPage.jsx` دون WFS-T
- [X] T025 [US3] حدّث بيانات API ومصدر WMS بعد نجاح الكتابة مع تأكيد الحذف في `GIS-Base/src/pages/MapPage.jsx`
- [X] T026 [US3] امنع تغيير الطبقة أو مغادرة وضع التحرير بصمت عند وجود مسودة dirty في `GIS-Base/src/features/map/useMapState.js` و`GIS-Base/src/features/map/components/EditPanel.jsx`
- [X] T027 [US3] نفّذ تحقق P3 المسجل في `specs/005-react-map-integration/quickstart.md` وسجل النتيجة في `docs/evidence/005-react-map-integration/p3-edit.md`

**Checkpoint**: اكتملت دورة CRUD تعليمية واحدة عبر NestJS.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: التحقق النهائي من النقل والوصول وعدم عودة المصادقة.

- [X] T028 [P] راجع لوحة المفاتيح والتسميات وحالات focus و`prefers-reduced-motion` في `GIS-Base/src/features/map/components/` و`GIS-Base/src/styles/map.css`
- [X] T029 [P] حدّث تعليمات النقل وملف البيئة في `GIS-Base/.env.example` و`specs/005-react-map-integration/quickstart.md` دون إضافة أسرار
- [X] T030 شغّل `npm run lint` و`npm run typecheck` و`npm run build` وفحص غياب Authentication وسجل النتائج في `docs/evidence/005-react-map-integration/final-verification.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 يبدأ مباشرة.
- Phase 2 يعتمد على Phase 1 ويحجب جميع القصص.
- P1 يعتمد على Phase 2 وهو MVP.
- P2 يعتمد على مكونات الخريطة المكتملة في P1.
- P3 يعتمد على التحديد والحالة المكتملين في P1 وP2.
- Phase 6 يعتمد على القصص المنفذة.

### User Story Dependencies

```text
Setup → Foundation → P1 Display → P2 Query → P3 Edit → Final Verification
```

### Parallel Opportunities

- T009 وT010 يمكن تنفيذهما بالتوازي.
- T012 وT014 يمكن تنفيذهما بالتوازي بعد وجود سجل الطبقات.
- T016 وT019 يمكن تنفيذهما بالتوازي.
- T028 وT029 يمكن تنفيذهما بالتوازي.

## Parallel Example: User Story 1

```text
Task T009: Create MapPage states in GIS-Base/src/pages/MapPage.jsx
Task T010: Register route in GIS-Base/src/app/routes.jsx
Task T012: Create LayerPanel in GIS-Base/src/features/map/components/LayerPanel.jsx
Task T014: Create map styles in GIS-Base/src/styles/map.css
```

## Implementation Strategy

### MVP First

1. أكمل T001–T008.
2. نفذ T009–T015 فقط.
3. توقف وتحقق من P1 قبل إضافة الاستعلام أو التحرير.

### Incremental Delivery

1. P1: WMS وعناصر الطبقات.
2. P2: التحديد والتفاصيل والفلتر.
3. P3: CRUD عبر NestJS.
4. تحقق نهائي دون Authentication.

## Notes

- لا يُنشأ `.env` تلقائيًا ولا يُحفظ في Git؛ المستخدم ينسخه من `.env.example`.
- لا توضع بيانات PostgreSQL أو كلمات المرور في Frontend.
- أسماء الطبقات وCRS عقود ثابتة؛ عناوين الخوادم قابلة للتغيير.
- لا تشغّل `$speckit-implement` قبل مراجعة هذه الوثائق وموافقة المستخدم.