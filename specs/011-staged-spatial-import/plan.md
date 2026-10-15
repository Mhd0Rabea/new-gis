# Implementation Plan: الاستيراد المكاني المرحلي والمصدر المشترك

## Summary

استبدال الاستيراد المباشر بمسار staging في PostGIS، مع بقاء PostGIS مصدر الحقيقة المشترك بين ArcGIS Pro وMGOS وGeoServer. يفحص API الملفات ويطبع الحقول والدومينات ويكشف التكرارات، ثم يعتمد الدفعة ذريًا. تضاف مراقبة إصدار السجل لمنع تعارض التحرير.

## Technical Context

**Language/Version**: TypeScript 5.9، Node.js 24، React 19  
**Primary Dependencies**: NestJS 11، pg 8، OpenLayers 10، Axios  
**Storage**: PostgreSQL 18.6 + PostGIS 3.6.2، schema تشغيلي mgos وschema مرحلي mgos_staging  
**Testing**: Jest/Supertest، اختبارات تكامل PostGIS، Vite build  
**Target Platform**: Windows محلي، ArcGIS Pro 3.7.1، GeoServer  
**Project Type**: Web API + React SPA + قاعدة مكانية  
**Performance Goals**: فحص 10,000 معلم خلال 60 ثانية محليًا  
**Constraints**: GeoJSON خارجي EPSG:4326، تخزين EPSG:32637، لا بيانات مولدة، لا Docker  
**Scale/Scope**: تسع طبقات تشغيلية مع دفعات قابلة للتدقيق

## Constitution Check

- PASS: ملفات المستخدم فقط ولا توليد لبيانات بديلة.
- PASS: PostGIS مخزن النشر وMGOS.gdb نموذج/تبادل فقط.
- PASS: الأسماء canonical ثابتة وmapping مركزي.
- PASS: EPSG:4326 للعقد وEPSG:32637 للتخزين.
- PASS: تنفيذ رأسي صغير دون ORM أو خدمة جديدة.
- PASS: تشغيل محلي وإعادة استخدام المكونات الحالية.
- PASS: المواصفة راجعها المستخدم ووافق على بدء التنفيذ.

## Project Structure

```text
database/migrations/005-staged-spatial-import.sql
api/src/imports/
  imports.module.ts
  imports.controller.ts
  imports.service.ts
GIS-Base/src/features/imports/
  ImportWizard.jsx
  importsApi.js
specs/011-staged-spatial-import/
```

## Phase 0: Research

القرارات موثقة في research.md: قاعدة مشتركة بدل مزامنة ملفات، staging دائم قابل للتدقيق، اعتماد transaction واحدة، optimistic concurrency عبر row_version.

## Phase 1: Design

- نموذج البيانات في data-model.md.
- عقد REST في contracts/imports-api.md.
- سيناريو التحقق في quickstart.md.

## Post-Design Constitution Check

PASS: التصميم لا يغير الحدود الدستورية ولا يضيف مصدر حقيقة ثانويًا.
