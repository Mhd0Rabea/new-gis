# Quickstart Validation: PostGIS Integration

> لتجهيز جهاز جديد من الصفر، ابدأ من `docs/setup-and-portability.md` ثم عد إلى هذا الاختبار.

## Prerequisites

- ArcGIS Pro `3.7.1 Standard` مع بيئة `arcgispro-py3`.
- ملف File Geodatabase واحد `*.gdb` داخل المشروع، أو تمرير مساره صراحة.
- ملف Database Connection واحد `*.sde` داخل المشروع، أو تمرير مساره صراحة. يبقى هذا الملف خارج Git لأنه محلي وقد يتضمن بيانات اتصال مشفرة.
- PostgreSQL `18.6` وPostGIS `3.6.2` يعملان محليًا أو على خادم يمكن للاتصال المحدد الوصول إليه.

## الإعداد الديناميكي

الإعداد الافتراضي المحايد للجهاز موجود في `config/mgos-import.json`. يحتوي أسماء الكيانات المعتمدة ومجموعات النقل، ولا يحتوي مسارات مطلقة أو كلمات مرور.

ترتيب أولوية الإعداد هو:

1. معاملات PowerShell؛
2. متغيرات البيئة؛
3. ملف JSON؛
4. الاكتشاف التلقائي داخل المشروع.

يدعم المشغّل المعاملات `-ProjectRoot`, `-Config`, `-Gdb`, `-Sde`, `-Schema`, `-Srid`, و`-Report`. وتقابلها متغيرات البيئة `MGOS_PROJECT_ROOT`, `MGOS_IMPORT_CONFIG`, `MGOS_GDB`, `MGOS_SDE`, `MGOS_SCHEMA`, `MGOS_SRID`, و`MGOS_IMPORT_REPORT`.

## 1. فحص الإعداد دون تغيير البيانات

نفّذ من PowerShell داخل أي نسخة من المشروع:

```powershell
.\scripts\import-mgos.ps1 -Group all -DryRun
```

**Expected**: يكتشف المشغّل جذر المشروع وArcGIS Python وملفي `*.gdb` و`*.sde`، ثم يتعرف على 19 Dataset دون تعديل PostGIS.

إذا وُجد أكثر من ملف مرشح، حدّد المطلوب بدل الاعتماد على التخمين:

```powershell
.\scripts\import-mgos.ps1 -Group all -DryRun -Gdb 'D:\data\MGOS.gdb' -Sde 'D:\connections\mgos.sde'
```

## 2. نقل النواة

```powershell
.\scripts\import-mgos.ps1 -Group core
```

**Expected**: سبعة Datasets ناجحة؛ الأعداد وUUID وSRID وصلاحية الهندسات متطابقة.

## 3. النقل الكامل

```powershell
.\scripts\import-mgos.ps1 -Group all
```

الأمر ينفذ تلقائيًا:

1. migrations القابلة لإعادة التشغيل مع تطبيق Schema وSRID المحددين؛
2. Export إلى جداول `stg_*` مع تعطيل Preserve Global IDs؛
3. تحويل GlobalID/GUID إلى `uuid`؛
4. UPSERT إلى الجداول النهائية؛
5. فحص count وUUID وSRID و`ST_IsValid` والعلاقات؛
6. كتابة تقرير JSON بمسارات نسبية قابلة للنقل.

## 4. اختبار إعادة التشغيل

أعد أمر `-Group all`. يجب أن يبقى عدد السجلات ثابتًا وأن تكون حالة التقرير `passed`.

## 5. النقل إلى جهاز أو موقع آخر

1. انسخ المشروع مع `config/mgos-import.json` وFile Geodatabase.
2. ثبّت أو استخدم ArcGIS Pro وPostgreSQL/PostGIS في الموقع الجديد.
3. أنشئ ملف `.sde` محليًا للقاعدة الجديدة ولا تضفه إلى Git.
4. ضع ملف `.sde` الوحيد في أي مجلد داخل المشروع ليُكتشف تلقائيًا، أو مرره باستخدام `-Sde`.
5. نفّذ `-DryRun` ثم النقل الكامل.

لا يعتمد هذا المسار على اسم مستخدم Windows أو حرف قرص أو مكان تثبيت ArcGIS ثابت. الشيء الثابت عمدًا هو أسماء الكيانات المعتمدة لأنها عقد البيانات بين ArcGIS وPostGIS وGeoServer والـAPI.

## 6. تحقق SQL اختياري

شغّل `database/verification/verify-migration.sql` من pgAdmin بعد ضبط Schema/SRID إذا اخترت قيمًا غير الافتراضية.

## ملاحظات الأسماء والهندسة

- الاسم Canonical يبقى مثل `Military_Bases` في العقود، والاسم الفيزيائي الافتراضي المتوافق مع ArcGIS هو `mgos.military_bases`.
- ArcGIS Polygon/Polyline يتحولان إلى `MultiPolygon/MultiLineString` في PostGIS لحفظ multipart.
- لا تستخدم `ogr2ogr` ما دام مسار ArcPy يعمل.