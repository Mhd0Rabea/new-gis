# Implementation Plan: PostGIS Integration

**Branch**: `002-postgis-integration` | **Date**: 2026-10-03 | **Spec**: [spec.md](spec.md)

## Summary

استخدام PostgreSQL `18.6` وPostGIS `3.6.2` كمخزن نشر منفصل عن File Geodatabase. يشغّل `scripts/import-mgos.ps1` بيئة ArcGIS Python المكتشفة تلقائيًا، ويقرأ `scripts/import_mgos.py` جميع أسماء البيانات والإعدادات من `config/mgos-import.json` أو من معاملات التشغيل، ثم ينقل إلى staging ويحوّل UUID وينفذ UPSERT والتحقق دون خدمة تشغيل إضافية.

## Technical Context

**Language/Version**: Python `arcgispro-py3`/ArcPy، SQL/PostgreSQL 18.6، PostGIS 3.6.2، ArcGIS Pro 3.7.1

**Primary Dependencies**: PostgreSQL/PostGIS؛ ArcPy؛ ArcGIS Database Connection؛ `ogr2ogr` احتياطي فقط

**Storage**: قاعدة يحددها ملف `.sde`، وSchema افتراضي `mgos` قابل للتهيئة

**Testing**: مقارنة counts/UUID/SRID، `ST_IsValid`، Foreign Keys، وإعادة التشغيل

**Target Platform**: Windows مع خدمات PostgreSQL محلية أو بعيدة يمكن الوصول إليها

**Constraints**: لا Docker، لا Enterprise Geodatabase، ولا أسرار داخل المستودع

**Portability**: لا مسارات مطلقة داخل الكود أو الإعداد؛ CLI ثم environment ثم JSON ثم الاكتشاف التلقائي

**Scale/Scope**: 9 جداول مكانية و10 وصفية بعينات اصطناعية صغيرة

## Constitution Check

- PASS: أعيد استخدام PostgreSQL/PostGIS الموجودين بعد فحصهما.
- PASS: لا Docker ولا تثبيت غير مبرر.
- PASS: بقيت File Geodatabase مصدرًا منفصلًا.
- PASS: الأسماء Canonical وmapping الأسماء الفيزيائية وCRS والمعرفات موثقة.
- PASS: تحقق النقل على النواة قبل تشغيل النطاق الكامل.
- PASS: الإعداد قابل للنقل ولا يخزن مسارات شخصية أو أسرار اتصال.

## Project Structure

```text
config/
└── mgos-import.json

database/
├── init/
│   ├── 001-create-mgos.sql
│   └── 002-create-schema.sql
├── migrations/
│   ├── 001-core-schema.sql
│   ├── 002-full-schema.sql
│   └── 003-promote-staging.sql
└── verification/
    └── verify-migration.sql

scripts/
├── import-mgos.ps1
├── import_mgos.py
└── preflight.ps1

docs/
└── setup-and-portability.md

docs/evidence/002-postgis-integration/
├── preflight.md
├── arcgis-connection.md
├── core-transfer.md
├── ogr2ogr-fallback.md
├── import-report.json
└── migration-report.md
```

**Structure Decision**: SQL صريح للمخطط والقيود، وملف إعداد مركزي محايد للجهاز، ومشغّل PowerShell يكتشف ArcGIS Python؛ وبذلك يبقى النقل أمرًا واحدًا قابلًا للمشاركة بدل النقل اليدوي أو خدمة ETL عامة.

## Complexity Tracking

لا توجد مخالفة: المستورد أمر إداري يعمل عند الطلب، وليس خدمة دائمة أو جزءًا من NestJS.