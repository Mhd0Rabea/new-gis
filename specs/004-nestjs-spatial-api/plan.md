# Implementation Plan: NestJS Spatial API

**Branch**: `004-nestjs-spatial-api` | **Date**: 2026-10-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-nestjs-spatial-api/spec.md`

## Summary

إنشاء NestJS API صغيرة تحت `api/` باستخدام `pg` وSQL مباشر. Module واحد باسم `features` وAllowlist ثابت يخدم القراءة وCRUD والعلاقات بصيغة GeoJSON، مع تحويل CRS داخل PostGIS وعقد OpenAPI واختبارات تكامل.

## Technical Context

**Language/Version**: Node.js 24 LTS-compatible runtime، TypeScript، NestJS

**Primary Dependencies**: NestJS core/platform-express/config، `pg`، class-validator، Swagger، Jest/Supertest

**Storage**: PostgreSQL/PostGIS المحلي؛ لا تخزين إضافي

**Testing**: Jest unit tests، Supertest contract/integration tests، قاعدة `mgos_test`

**Target Platform**: Windows local Node service

**Project Type**: REST web service

**Performance Goals**: صفحات صغيرة من بيانات التدريب تعود تفاعليًا محليًا؛ حد افتراضي 100 معلم وحد أقصى 500

**Constraints**: لا ORM، لا Authentication، لا Microservices، لا أسماء SQL من العميل

**Scale/Scope**: 9 طبقات مكانية، 6 علاقات مسموحة، مستخدم محلي واحد في النسخة الأولى

## Constitution Check

- PASS: Module واحد واتصال مباشر يحقق البساطة.
- PASS: العقود تحفظ الأسماء وGeoJSON/CRS.
- PASS: PostGIS منفصل عن File Geodatabase.
- PASS: لا React أو Authentication أو تحليل متقدم.
- PASS: الاختبارات تغطي العقود والتحقق قبل التكامل مع الواجهة.

إعادة الفحص بعد التصميم: PASS.

## Project Structure

### Documentation

```text
specs/004-nestjs-spatial-api/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/openapi.yaml
├── checklists/requirements.md
└── tasks.md
```

### Source Code

```text
api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   └── database.config.ts
│   └── features/
│       ├── features.module.ts
│       ├── features.controller.ts
│       ├── features.service.ts
│       ├── layers.config.ts
│       └── dto/
├── test/
│   ├── contract/
│   └── integration/
├── .env.example
├── package.json
└── tsconfig.json
```

**Structure Decision**: خدمة واحدة تحت `api/`؛ لا Repository layer مستقل لأن `features.service.ts` يكفي للنطاق الحالي.

## Complexity Tracking

لا توجد مخالفات.
