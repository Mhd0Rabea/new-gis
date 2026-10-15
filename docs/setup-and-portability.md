# إعداد MGOS ونقله بين الأجهزة

## الهدف

هذا الدليل هو نقطة البداية عند نسخ المشروع إلى مجلد أو جهاز أو خادم آخر. لا يضمن وجود البرامج وحده نجاح المشروع؛ الضمان العملي هو نجاح `scripts/preflight.ps1` ثم اختبارات المرحلة المطلوبة.

## خط الأساس المجرب

| المكوّن | النسخة المجربة | يصبح مطلوبًا في | ملاحظات |
|---|---:|---|---|
| Windows | بيئة تدعم ArcGIS Pro | Foundation | المشروع الحالي يستهدف Windows |
| ArcGIS Pro Standard | `3.7.1` | Foundation | يتضمن ArcPy و`arcgispro-py3` |
| PostgreSQL | `18.6` | PostGIS | محلي أو بعيد عبر ملف `.sde` |
| PostGIS | `3.6.2` | PostGIS | يجب تفعيله داخل قاعدة الوجهة |
| Temurin Java | `17.0.20.1` | GeoServer | يُكتشف من `JAVA_HOME` أو النظام |
| GeoServer | تُعتمد النسخة بعد فحص الموجود | GeoServer | لا Docker ولا WAR/Tomcat في المسار الحالي |
| Node.js | `24` | Api | مطلوب لـNestJS لاحقًا |
| npm | النسخة المرفقة مع Node.js | Api | لإدارة حزم Backend وFrontend |
| pgAdmin | أي نسخة متوافقة | اختياري | للإدارة اليدوية فقط |
| Git وSpec Kit | نسخ متوافقة | تطوير المشروع فقط | غير مطلوبين لتشغيل النظام النهائي |

النسخ أعلاه خط أساس مُجرّب، وليست مسارات ثابتة. أي نسخة مختلفة تحتاج تشغيل الفحص واختبارات المرحلة قبل اعتمادها.

## ما يُنقل وما لا يُنقل

يُنقل أو يُشارك:

- `gis/MGOS/MGOS.aprx` و`MGOS.gdb`؛
- `config/mgos-import.json`؛
- مجلدات `database/`, `scripts/`, `geoserver/`, `specs/`, و`docs/`؛
- مجلدا `api/` و`GIS-Base/` بعد اعتماد القالب، مع ملفات `.env.example` و`public/runtime-config.js` غير الحساسة.

لا يُشارك داخل Git:

- ملفات `*.sde`؛
- ملفات `.env` وكلمات المرور؛
- `GEOSERVER_DATA_DIR` الفعلي قبل مراجعته وتنظيف الأسرار؛
- `node_modules` ومخرجات البناء وملفات cache.

ملف `.sde` يُنشأ من جديد في كل بيئة لأنه يصف اتصالًا محليًا وقد يحتوي بيانات اعتماد مشفرة.

## فحص الجهاز دون تثبيت شيء

من جذر المشروع:

```powershell
.\scripts\preflight.ps1 -Target PostGIS
```

الأهداف المتاحة:

```text
Foundation  ArcGIS Pro + MGOS.aprx + MGOS.gdb
PostGIS     Foundation + PostgreSQL/PostGIS + اتصال SDE + DryRun
GeoServer   PostGIS + Java + GeoServer
Api         GeoServer + Node.js + npm
Full        جميع ما سبق
```

لإخراج JSON قابل للقراءة آليًا:

```powershell
.\scripts\preflight.ps1 -Target PostGIS -Json
```

الفحص قراءة فقط، ويشغّل `import-mgos.ps1 -DryRun` في عملية منفصلة للتحقق من الاتصال والمخطط والمصادر دون نقل بيانات. يمكن تخطي اتصال القاعدة مؤقتًا باستخدام `-SkipDatabaseValidation`، لكن النتيجة لا تُعد تحققًا كاملًا.

## تجهيز جهاز جديد بالترتيب

### 1. نسخ المشروع

انسخ المجلد كاملًا مع المحافظة على البنية الداخلية. لا تعِد تسمية Feature Datasets أو Feature Classes أو الجداول.

عند مشاركة مشروع ArcGIS خارج بنية المستودع، استخدم **Share → Project Package** لإنشاء `.ppkx`. أما عند نسخ المجلد نفسه فشغّل فحص `Foundation` وافتح `MGOS.aprx` للتأكد من عدم وجود Broken Data Sources.

### 2. فحص ما هو موجود

```powershell
.\scripts\preflight.ps1 -Target Foundation
```

لا تثبت أو تحدّث أي مكوّن قبل قراءة نتيجة الفحص.

### 3. تجهيز PostgreSQL/PostGIS

بعد تثبيت أو اختيار PostgreSQL/PostGIS، شغّل ملفات `database/init/` باستخدام `psql`. تقبل الملفات متغيرات ولا تفترض أسماء إلزامية:

```powershell
psql -v app_role=mgos -v db_name=mgos -f database/init/001-create-mgos.sql
psql -d mgos -v app_role=mgos -v db_name=mgos -v schema_name=mgos -f database/init/002-create-schema.sql
```

لا تضع كلمة المرور في الأمر أو المستودع. استخدم آلية PostgreSQL المحلية الآمنة أو مطالبة كلمة المرور.

### 4. إنشاء اتصال ArcGIS محلي

من ArcGIS Pro أنشئ Database Connection إلى قاعدة الوجهة واحفظ ملف `.sde` محليًا، أو مرر مساره صراحة. يجب أن يكون `current_schema()` مطابقًا لقيمة `schema` في `config/mgos-import.json`.

### 5. التحقق ثم الاستيراد

```powershell
.\scripts\preflight.ps1 -Target PostGIS
.\scripts\import-mgos.ps1 -Group all -DryRun
.\scripts\import-mgos.ps1 -Group all
```

يجب أن تكون نتيجة الفحص `PASS` وتقرير الاستيراد `passed` لعدد 19 Dataset.

### 6. تشغيل خدمات الويب

المسار المختصر من جذر المشروع:

```powershell
.\scripts\start-web.ps1
```

لا يحتوي السكربت مسار جهاز ثابتًا؛ يشتق جذر المشروع من موقعه ويقرأ `api/.env` و`GIS-Base/.env`. الخيار `-CheckOnly` يفحص NestJS وGeoServer وReact دون تغيير حالة أي خدمة.
- GeoServer: اضبط `JAVA_HOME`, `GEOSERVER_HOME`, `GEOSERVER_DATA_DIR`, و`GEOSERVER_URL` في البيئة المحلية بدل تثبيت قيمها في الكود.
- NestJS: انسخ `api/.env.example` إلى `api/.env` واضبط اتصال القاعدة و`API_HOST` و`API_PORT` محليًا. لا تنقل كلمة المرور داخل Git.
- React للتطوير: انسخ `GIS-Base/.env.example` إلى `GIS-Base/.env` واضبط هدفي Vite proxy فقط.
- React للنشر: عدّل `GIS-Base/public/runtime-config.js` أو استبدله وقت النشر. القيم الافتراضية `/api` و`/geoserver` نسبية ولا تربط البناء باسم جهاز.

```powershell
Set-Location api
Copy-Item .env.example .env
npm install
npm run start:dev

Set-Location ..\GIS-Base
Copy-Item .env.example .env
npm install
npm run dev
```

لا يحتاج النقل إلى Docker أو Authentication. أسماء الطبقات و`EPSG:4326` في عقد الويب و`EPSG:32637` في PostGIS تبقى ثابتة؛ العناوين والمنافذ وبيانات الاتصال هي التي تتغير حسب البيئة.

## ترتيب مصادر إعداد الاستيراد

1. معاملات سطر الأوامر؛
2. متغيرات البيئة؛
3. `config/mgos-import.json`؛
4. الاكتشاف التلقائي عندما يوجد مرشح وحيد.

متغيرات الاستيراد المدعومة:

```text
MGOS_PROJECT_ROOT
MGOS_IMPORT_CONFIG
MGOS_GDB
MGOS_SDE
MGOS_SCHEMA
MGOS_SRID
MGOS_IMPORT_REPORT
ARCGIS_PYTHON
```

## معايير قبول النسخة المنقولة

- فحص المرحلة المطلوبة يعيد `PASS` دون Required Failures.
- يفتح `MGOS.aprx` ولا توجد Broken Data Sources.
- ينجح `-DryRun` ويكتشف 19 Dataset.
- ينجح الاستيراد الكامل ويطابق counts وUUID وSRID وصلاحية الهندسات.
- لا تظهر كلمات مرور أو ملفات `.sde` في Git.
- تُختبر خدمات GeoServer وNestJS كلٌ في مرحلته قبل اعتبار النسخة كاملة.

## حدود الضمان

لا يمكن ضمان جهاز جديد اعتمادًا على قائمة تثبيت فقط؛ اختلاف الترخيص أو سياسات الشبكة أو PostgreSQL أو Java قد يغيّر السلوك. لهذا يعتمد المشروع على خط أساس مجرب وفحص قابل للتنفيذ واختبارات قبول، وليس على مسارات أو افتراضات جهاز بعينه.