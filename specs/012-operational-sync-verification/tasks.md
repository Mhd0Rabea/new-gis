# Tasks: Operational Sync Verification

## Phase 1: Setup

- [X] T001 إنشاء مجلد الأدلة في docs/evidence/012-operational-sync-verification/
- [X] T002 [P] إضافة preflight للمرحلة إلى scripts/preflight.ps1
- [X] T003 [P] إنشاء قالب أدوار بلا أسرار في database/security/operational-roles.sql

## Phase 2: Foundational

- [X] T004 إنشاء أداة تحقق read-only في scripts/verify-operational-sync.ps1
- [X] T005 إضافة تنقيح الأسرار وناتج JSON إلى scripts/verify-operational-sync.ps1

## Phase 3: User Story 1 - Least Privilege

- [X] T006 [US1] تنفيذ probes لصلاحيات المحرر والقارئ وعدم ملكية المخطط في scripts/verify-operational-sync.ps1
- [X] T007 [US1] توثيق اتصال ArcGIS Pro في docs/evidence/012-operational-sync-verification/arcgis-connection.md

## Phase 4: User Story 2 - Shared Edit Cycle

- [X] T008 [US2] تنفيذ اختيار سجل وحفظ الأصل والتحقق من API وWFS في scripts/verify-operational-sync.ps1
- [X] T009 [US2] تنفيذ تعديل MGOS الاختياري والاستعادة الإلزامية في scripts/verify-operational-sync.ps1
- [X] T010 [US2] توثيق لقطات ArcGIS المطلوبة في docs/evidence/012-operational-sync-verification/interactive-checklist.md

## Phase 5: User Story 3 - Conflict Prevention

- [X] T011 [US3] إضافة اختبار expectedVersion في api/test/integration/optimistic-concurrency.e2e-spec.ts
- [X] T012 [US3] تنفيذ probe تعارض النسخة القديمة في scripts/verify-operational-sync.ps1

## Phase 6: Verification

- [X] T013 تشغيل الفحوص read-only وتوثيقها في docs/evidence/012-operational-sync-verification/preflight.md
- [X] T014 تشغيل البناء والاختبارات وتوثيقها في docs/evidence/012-operational-sync-verification/verification.md
- [X] T015 تحديث docs/project-roadmap.md دون إغلاق الفحص التفاعلي قبل لقطات ArcGIS Pro

## Dependencies

T001-T005 تأسيسية. US1 تسبق US2، وUS2 تسبق US3. لا كتابة دون `-Apply` ومدخلات سجل المستخدم.

## MVP

T001-T007: إثبات الأدوار والاتصال read-only قبل أي تعديل تشغيلي.
