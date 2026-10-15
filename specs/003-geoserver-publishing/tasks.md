# Tasks: GeoServer Publishing

**Input**: `spec.md`, `plan.md`, `research.md`, `quickstart.md`

**Rule**: تشغيل محلي بلا Docker، وWFS للقراءة فقط، ولا WFS-T.

## Phase 1: Setup

- [x] T001 إنشاء مجلد `geoserver/styles/` ومجلد `docs/evidence/003-geoserver-publishing/screenshots/`
- [x] T002 فحص وجود GeoServer وخدمته ومنافذه قبل أي تثبيت وتسجيل النتيجة في `docs/evidence/003-geoserver-publishing/preflight.md`
- [x] T003 التحقق من Temurin Java 17.0.20.1 و`JAVA_HOME` وتسجيل النتيجة في `docs/evidence/003-geoserver-publishing/preflight.md`

## Phase 2: Foundation

- [x] T004 تثبيت GeoServer محليًا فقط نذا أثبت T002 عدم وجوده، وتوثيق المسار في `geoserver/README.md`
- [x] T005 تشغيل GeoServer باستخدام Temurin Java 17 وتوثيق عنوان الندارة المحلي في `geoserver/README.md`
- [x] T006 إنشاء Workspace باسم `mgos` وPostGIS Store واحد يشير إلى قاعدة `mgos`

## Phase 3: User Story 1 - تشغيل GeoServer محليًا (P1)

**Goal**: GeoServer محلي متصل بـ PostGIS دون Docker.

**Independent Test**: صفحة الحالة تعمل والـ Store يتصل بنجاح دون كشف كلمة المرور في الملفات.

- [x] T007 [US1] اختبار اتصال Store وتسجيل النتيجة المنقحة في `docs/evidence/003-geoserver-publishing/store-connection.md`
- [x] T008 [US1] تصدير إعدادات Workspace وStore غير السرية إلى `geoserver/configuration.md`

## Phase 4: User Story 2 - نشر النواة كخرائط (P2)

**Goal**: عرض طبقات النواة عبر WMS بأسماء وCRS ثابتة.

**Independent Test**: `GetCapabilities` و`GetMap` يعيدان نتائج صحيحة لطبقات النواة.

- [x] T009 [P] [US2] إنشاء Styles بسيطة للـ Point وPolyline وPolygon وحفظ SLD في `geoserver/styles/`
- [x] T010 [US2] نشر طبقات النواة من Store `mgos` بأسمائها الحرفية وDeclared SRS يطابق EPSG:32637
- [x] T011 [US2] تطبيق Styles المعتمدة والتحقق بصريًا عبر Layer Preview
- [x] T012 [US2] حفظ استجابة WMS `GetCapabilities` في `docs/evidence/003-geoserver-publishing/wms-capabilities.xml`
- [x] T013 [US2] تنفيذ طلب WMS `GetMap` وتسجيل النتيجة في `docs/evidence/003-geoserver-publishing/wms-verification.md`

## Phase 5: User Story 3 - نتاحة قراءة المتجهات (P3)

**Goal**: قراءة GeoJSON عبر WFS دون السماح بالتحرير.

**Independent Test**: ينجح `GetFeature` بصيغة GeoJSON ويفشل أي Transaction.

- [x] T014 [US3] نشر الطبقات المكانية الخمس المتبقية والتحقق من أسمائها وEPSG:32637
- [x] T015 [US3] تفعيل WFS Basic read-only وتعطيل Transactional WFS على مستوى الخدمة
- [x] T016 [US3] حفظ استجابة WFS `GetCapabilities` في `docs/evidence/003-geoserver-publishing/wfs-capabilities.xml`
- [x] T017 [US3] اختبار `GetFeature` بصيغة GeoJSON وتسجيل CRS والخصائص في `docs/evidence/003-geoserver-publishing/wfs-verification.md`
- [x] T018 [US3] اختبار رفض WFS-T وتسجيل الدليل في `docs/evidence/003-geoserver-publishing/wfs-t-disabled.md`
- [x] T019 [US3] تنفيذ `specs/003-geoserver-publishing/quickstart.md` وتسجيل النتيجة في `docs/evidence/003-geoserver-publishing/verification.md`

## Dependencies

تعتمد المرحلة على اكتمال `002-postgis-integration`: `T001-T006` → `US1` → `US2` → `US3`.

## Stop Gate

بعد T019 تتوقف المرحلة للمراجعة. لا يبدأ API قبل ثبات أسماء الطبقات وخدمات WMS/WFS.





