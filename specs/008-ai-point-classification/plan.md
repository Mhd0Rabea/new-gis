# خطة تنفيذ المرحلة 008: تصنيف سحابات النقاط بالذكاء الاصطناعي

**Branch**: `008-ai-point-classification` | **Date**: 2026-10-07 | **Spec**: [spec.md](spec.md)

**Input**: مواصفة `specs/008-ai-point-classification/spec.md`

## Summary

توسيع مركز المعالجة الحالي بمهمة تصنيف ذكي لسحابات النقاط الاصطناعية. يستخدم الإصدار الأول نموذج nearest-centroid صغيرًا وقابلًا للتفسير، مدربًا مسبقًا على بيانات اصطناعية ومخزنًا كملف نموذج موثق. يقرأ PDAL السمات المسموحة، ثم تنتج الخدمة GeoJSON مؤقتًا يحوي الفئة والثقة وإصدار النموذج. يبقى خط أساس بقواعد صريحة للمقارنة، ولا تصبح النتيجة معتمدة قبل قرار بشري مسجل.

## Technical Context

**Language/Version**: Node.js 24، TypeScript 5.9، React 19

**Primary Dependencies**: NestJS الحالي، PostgreSQL/PostGIS الحالي، PDAL 2.10 الموجود ضمن QGIS، OpenLayers/Cesium الحاليان؛ لا مكتبات AI جديدة في الإصدار الأول

**Storage**: PostgreSQL لبيانات النموذج والمهمة والمراجعة والمقاييس؛ ملفات LAS/LAZ وGeoJSON في مجلد المعالجة البيئي خارج Git؛ نموذج اصطناعي صغير versioned داخل `api/models/`

**Testing**: Jest للعقود والخدمات والتكامل، اختبارات واجهة تفاعلية، ومجموعة اختبار اصطناعية ثابتة منفصلة عن بيانات إعداد النموذج

**Target Platform**: Windows محليًا ضمن البيئة الحالية

**Project Type**: تطبيق ويب بواجهة React وخدمة NestJS ووحدة معالجة محلية

**Performance Goals**: قبول المهمة خلال 10 ثوانٍ دون حجب الواجهة؛ عرض المقارنة خلال 5 ثوانٍ بعد اكتمالها؛ معالجة العينة المرجعية ذات 2,000–10,000 نقطة محليًا

**Constraints**: بيانات اصطناعية فقط، لا تثبيت قبل الموافقة، لا تعديل تلقائي للمصدر، مراجعة بشرية إلزامية، إعدادات البيئة خارج المصدر، GeoJSON خارجي في EPSG:4326

**Scale/Scope**: نموذج واحد موثق، أربع فئات و`unknown`، مستخدم محلي واحد، عينات تدريبية صغيرة، دون تدريب من الواجهة أو تنبؤ تشغيلي

## Constitution Check

### قبل التصميم

- PASS — البيانات اصطناعية وضمن نطاق التدريب العام.
- PASS — المرحلة هي `008-ai-integration` ومواصفتها موجودة.
- PASS — النتيجة مؤقتة مع ثقة وإصدار نموذج ومراجعة بشرية.
- PASS — يوجد خط أساس غير ذكي ومقاييس قابلة لإعادة الاختبار.
- PASS — لا مكوّن جديد ثقيل؛ يعاد استخدام PDAL ووحدة processing.
- PASS — لا تثبيت أو تعديل بيئة ضمن الخطة.
- PASS — العقود تحافظ على EPSG:4326 خارجيًا وEPSG:32637 داخليًا.
- PASS — الملفات والمسارات الخاصة بالبيئة تبقى قابلة للتهيئة.

### بعد التصميم

- PASS — نموذج البيانات يمنع انتقال النتيجة إلى `approved` دون Review Decision.
- PASS — العقد يعرض التحذير والثقة وإصدار النموذج ولا يوفر اعتمادًا آليًا.
- PASS — دليل التحقق يقيس النموذج وخط الأساس على مجموعة اختبار مستقلة.
- PASS — لا توجد مخالفة دستورية أو تعقيد يحتاج استثناء.

## Project Structure

### Documentation

```text
specs/008-ai-point-classification/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### Source Code

```text
api/
├── models/
│   └── point-classifier-v1.json
├── src/processing/
│   ├── ai/
│   │   ├── point-classifier.ts
│   │   ├── rule-baseline.ts
│   │   ├── evaluation.ts
│   │   └── ai-classification.types.ts
│   ├── processing.controller.ts
│   └── processing.service.ts
└── test/processing/

database/
└── 008-ai-classification.sql

GIS-Base/src/
├── features/processing/components/
│   ├── AiClassificationPanel.jsx
│   ├── ClassificationComparison.jsx
│   └── ClassificationReview.jsx
├── features/processing/services/processingApi.js
└── pages/ProcessingPage.jsx

gis/samples/ai/
├── synthetic-point-training.json
├── synthetic-point-test.json
└── README.md
```

**Structure Decision**: توسيع وحدة processing وصفحة مركز المعالجة القائمتين بدل إنشاء خدمة أو تطبيق جديد. يفصل مجلد `ai/` منطق النموذج والخط الأساسي والتقييم عن إدارة الطابور والملفات.

## Complexity Tracking

لا توجد مخالفات تحتاج تبريرًا.
