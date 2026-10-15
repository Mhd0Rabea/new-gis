# نموذج بيانات المرحلة 008

## ModelVersion

- `id`: معرف ثابت مثل `point-centroid-v1`.
- `name`: اسم العرض.
- `version`: إصدار دلالي إلزامي.
- `algorithm`: `nearest-centroid` في الإصدار الأول.
- `classes`: قائمة الفئات المسموحة.
- `featureSchema`: أسماء السمات وترتيبها ووحداتها.
- `centroids`: مركز كل فئة بعد التوحيد.
- `normalization`: المتوسط والانحراف لكل سمة.
- `confidenceThreshold`: رقم بين 0 و1؛ الافتراضي 0.70.
- `trainingDatasetId`: مرجع مجموعة التدريب الاصطناعية.
- `createdAt`: وقت إنشاء النموذج.
- `metrics`: مقاييس مجموعة الاختبار.
- `status`: `candidate | approved | retired`.

## AIClassificationJob

يوسع Processing Job بعلاقة إلى `modelVersionId` و`confidenceThreshold` و`baselineVersion`، ويحافظ على حالات `pending | running | completed | failed | cancelled`.

## ClassificationResult

- `id`, `jobId`, `modelVersionId`.
- `sourceFile`, `artifactFile`, `crs`.
- `status`: `temporary | in_review | approved | rejected`.
- `classCounts`: عدد كل فئة.
- `lowConfidenceCount`: عدد الوحدات التي تحتاج مراجعة.
- `metrics`: مقاييس النموذج.
- `baselineMetrics`: مقاييس خط الأساس.
- `warning`: تحذير الاستخدام التعليمي.
- `createdAt`, `reviewedAt`.

### انتقالات الحالة

```text
temporary → in_review → approved
                     └→ rejected
approved → in_review  (مراجعة جديدة تنشئ إصدار قرار جديد)
```

لا يسمح بالانتقال من `temporary` مباشرة إلى `approved` دون ReviewDecision.

## ClassifiedFeature

خصائص GeoJSON لكل نقطة أو خلية عرض:

- `sourcePointId`: معرف داخلي غير حساس.
- `predictedClass`: `ground | building | vegetation | vehicle | unknown`.
- `confidence`: من 0 إلى 100.
- `reviewStatus`: `unreviewed | accepted | corrected | rejected`.
- `reviewedClass`: nullable ومن الفئات نفسها.
- `modelVersion`: إلزامي.

## ReviewDecision

- `id`, `resultId`, `featureId` (nullable للقرار على النتيجة كلها).
- `decision`: `accept | correct | reject`.
- `originalClass`, `reviewedClass`.
- `reason`: اختياري حتى 500 حرف.
- `reviewer`: هوية المستخدم المحلي الحالية.
- `createdAt`.

كل قرار immutable؛ إعادة المراجعة تنشئ سجلًا جديدًا.

## EvaluationRun

- `id`, `jobId`, `datasetId`, `modelVersionId`, `baselineVersion`.
- `confusionMatrix` للفئات الأربع دون `unknown` مع تسجيل حالات الامتناع منفصلة.
- `perClassMetrics`: precision وrecall وF1 وsupport.
- `macroF1`, `accuracy`, `abstentionRate`.
- `passed`: true فقط عندما `macroF1 >= 0.80` ولا توجد فئة بلا support.
- `createdAt`.

## العلاقات

- ModelVersion واحد يرتبط بعدة AIClassificationJob.
- AIClassificationJob ينتج ClassificationResult واحدًا وEvaluationRun اختياريًا.
- ClassificationResult يرتبط بعدة ReviewDecision ويحافظ على آخر قرار كعرض مشتق دون حذف التاريخ.
