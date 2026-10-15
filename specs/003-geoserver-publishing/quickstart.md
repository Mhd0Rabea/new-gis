# Quickstart Validation: GeoServer Publishing

## Prerequisites

- اكتمال PostGIS Integration.
- Temurin Java 17 متاحة عبر `JAVA_HOME` أو أمر `java`، ويُكتشف موقعها بدل تثبيته في الوثائق.
- بيانات الاعتماد متاحة محليًا وليست داخل المستودع.

## 1. Preflight

1. افحص Windows Services وبيئة `GEOSERVER_HOME` وأوامر النظام قبل التثبيت، دون افتراض مجلد ثابت.
2. إذا كان GeoServer موجودًا، سجل الإصدار وData Directory وأعد استخدامه.
3. إذا لم يوجد، استخدم Windows Installer Stable وحدد JDK 17 الموجودة.

**Expected**: يعمل العنوان المحدد في `GEOSERVER_URL`؛ ويمكن استخدام `http://localhost:8080/geoserver` كقيمة تطوير افتراضية فقط.

## 2. Workspace وStore

1. أنشئ Workspace باسم `mgos`.
2. أنشئ PostGIS Store واحدًا باتصال قراءة.
3. اختبر الاتصال قبل نشر أي طبقة.

**Expected**: Store Enabled والاتصال ناجح دون حساب إدارة قاعدة البيانات.

## 3. نشر النواة

انشر `Military_Bases`, `Checkpoints`, `Operation_Sectors`, `Patrol_Routes` واضبط Native CRS `EPSG:32637` والحدود.

**Expected**: تظهر الطبقات في Layer Preview بأسمائها القانونية.

## 4. اختبارات الخدمة

- WMS GetCapabilities يسرد الطبقات الأربع.
- GetMap يعيد صورة غير فارغة.
- GetFeatureInfo يعيد خصائص العنصر المحدد.
- WFS GetFeature مع BBOX يعيد GeoJSON متوقعًا.
- WFS Transaction بحساب القراءة يفشل ولا يغير counts.

## Evidence

سجل URLs والنتائج غير الحساسة في `docs/evidence/003-geoserver-publishing/service-endpoints.md`.
