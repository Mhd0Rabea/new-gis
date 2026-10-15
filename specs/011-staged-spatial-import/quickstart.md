# Quickstart Validation

## Prerequisites

- PostgreSQL/PostGIS وAPI وواجهة MGOS تعمل محليًا.
- طبقات mgos منشورة من PostGIS نفسه في GeoServer.
- ArcGIS Pro connection إلى PostGIS بصلاحيات الدور mgos_editor.

## Scenario

1. طبق migration 005.
2. افتح إدارة البيانات وارفع gis/MGOS/imports/Military_Bases_Real.geojson إلى Military_Bases.
3. تحقق أن الملخص يعرض 12 معلمًا وتحويل Training Camp/Command Center/Air Base إلى 5/4/2.
4. تحقق أن عدد السجلات التشغيلية لم يتغير قبل الاعتماد.
5. راجع التكرارات واختر create/update/skip.
6. اعتمد الدفعة وتحقق أن النتيجة كاملة بلا import جزئي.
7. عدل سجلًا من ArcGIS Pro ثم حاول تحديث نسخة قديمة من MGOS؛ يجب ظهور تعارض نسخة.
8. حدث الطبقة في ArcGIS وMGOS وتحقق أن كليهما يعرض القيمة نفسها.

## Commands

- api: npm test ثم npm run build
- frontend: npm run build
- integration: npm run test:integration
