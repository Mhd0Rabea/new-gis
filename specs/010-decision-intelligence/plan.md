# Implementation Plan: مركز القرار والذكاء المكاني

**Branch**: `010-decision-intelligence` | **Date**: 2026-10-08 | **Spec**: [spec.md](spec.md)

## Summary

تقديم مركز قرار تعليمي يوحّد تقييم المخاطر، جاهزية ومسارات الدوريات، محاكاة التتبع والتنبيهات، مؤشرات التنبؤ، ومقارنة الصور الجوية المرفوعة من المستخدم. جميع النتائج توصيات مفسرة ومقيدة بمراجعة بشرية؛ لا تعديل تلقائي للبيانات المكانية.

## Technical Context

**Language/Version**: JavaScript في واجهة الويب وخدمة API القائمة  
**Primary Dependencies**: React، NestJS، PostGIS، GeoServer، ومكونات المعالجة الحالية  
**Storage**: PostgreSQL/PostGIS للبيانات المشتقة وسجل المراجعة؛ عينات محلية للصور والتتبع  
**Testing**: بناء الواجهة، اختبارات API المستهدفة، والتحقق اليدوي وفق quickstart  
**Target Platform**: تطبيق ويب محلي على Windows  
**Project Type**: تطبيق ويب أحادي المستودع: `GIS-Base` للواجهة و`api` للخدمة  
**Performance Goals**: إظهار التحليل على بيانات التدريب خلال 5 ثوانٍ، وإبقاء المحاكاة قابلة للإيقاف دون إعادة تحميل الصفحة  
**Constraints**: بيانات مرفوعة من المستخدم فقط؛ EPSG:32637 للتخزين وEPSG:4326 للعقود؛ مراجعة بشرية إلزامية؛ لا أجهزة أو بث حي أو صور خارجية  
**Scale/Scope**: طبقات ومجالات تدريبية محلية، حتى 100 عنصر لكل قائمة نتيجة في الإصدار الأول

## Constitution Check

- التعلم والبيانات المرفوعة من المستخدم فقط: **مستوفى**؛ لا مصدر حي أو حقيقي.
- البساطة قبل التوسع: **مستوفى**؛ يعتمد امتدادًا لخدمة وواجهة قائمتين، ولا يضيف خدمة مستقلة.
- عقود GIS وCRS: **مستوفى**؛ يبقى التخزين والتحليل الداخلي في EPSG:32637 والتحويل للعقود في EPSG:4326.
- الذكاء المرفوع من المستخدم المقيد والمراجع بشريًا: **مستوفى**؛ تُعرض النواتج كتوصيات ذات ثقة وخط أساس وحالة مراجعة.
- مراحل قابلة للتحقق: **مستوفى بشرط**؛ لا يبدأ التنفيذ قبل موافقة المستخدم على وثائق هذه المرحلة.

## Project Structure

### Documentation

```text
specs/010-decision-intelligence/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── decision-center-api.md
└── tasks.md
```

### Source Code

```text
api/src/
├── decision/
│   ├── decision.controller.ts
│   ├── decision.service.ts
│   └── decision.types.ts
└── database/

GIS-Base/src/
├── pages/
│   └── DecisionCenterPage.jsx
├── features/decision/
│   ├── components/
│   ├── services/
│   └── config/
└── styles/
```

**Structure Decision**: يضاف نطاق decision داخل التطبيقين القائمين فقط؛ لا خدمة مستقلة ولا مكتبة AI خارجية في هذه المرحلة.

## Complexity Tracking

لا توجد مخالفات مبررة للدستور.
