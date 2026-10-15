# مصدر البيانات المشترك بين ArcGIS Pro وMGOS

## السياسة المعتمدة

قاعدة PostgreSQL/PostGIS هي **مصدر الحقيقة الوحيد** للطبقات التشغيلية. يتصل ArcGIS Pro وواجهة MGOS وGeoServer بنفس الجداول داخل مخطط `mgos`. لا تُنسخ الطبقات إلى File Geodatabase بغرض التحرير التشغيلي، ولا يوجد مزامنة ملفات ثنائية الاتجاه.

```text
ArcGIS Pro ─┐
MGOS API ───┼──> PostgreSQL/PostGIS (mgos) ───> GeoServer
Import UI ──┘             ↑
                    staging + review
```

## إعداد اتصال ArcGIS Pro

1. من Catalog اختر Databases ثم New Database Connection.
2. Database Platform: PostgreSQL.
3. أدخل اسم الخادم والمنفذ واسم قاعدة البيانات من إعدادات البيئة المحلية.
4. استخدم حسابًا مخصصًا للمحرر مثل `mgos_editor`، ولا تستخدم مالك المخطط أو مستخدم التطبيق.
5. احفظ كلمة المرور في ArcGIS Pro أو مدير الأسرار المحلي؛ لا تضعها في المستودع.
6. أضف الجداول من `mgos` إلى الخريطة واختبر القراءة والتحرير على سجل غير إنتاجي مصرح به.

نظام الإحداثيات الداخلي للطبقات هو `WGS 1984 UTM Zone 37N (EPSG:32637)`. واجهات GeoJSON فقط تستخدم `EPSG:4326`.

## نموذج الصلاحيات

ينشئ مسؤول القاعدة الدور وكلمة المرور خارج المستودع، ثم يطبق أقل صلاحيات لازمة:

```sql
GRANT CONNECT ON DATABASE mgos TO mgos_editor;
GRANT USAGE ON SCHEMA mgos TO mgos_editor;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA mgos TO mgos_editor;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA mgos TO mgos_editor;
ALTER DEFAULT PRIVILEGES IN SCHEMA mgos GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mgos_editor;
ALTER DEFAULT PRIVILEGES IN SCHEMA mgos GRANT USAGE, SELECT ON SEQUENCES TO mgos_editor;
```

حساب GeoServer للقراءة فقط. حساب API يملك الصلاحيات التشغيلية المطلوبة. جداول `mgos_staging` يديرها API ومسؤول البيانات فقط.

## دورة التعديل

- تعديل ArcGIS Pro يُحفظ مباشرة في PostGIS، فيظهر في MGOS وGeoServer بعد إعادة الجلب/التحديث.
- تعديل MGOS يرسل `expectedVersion`. إذا تغير `row_version` منذ قراءة السجل، يرفض API التحديث برسالة تعارض بدل الكتابة فوق تعديل ArcGIS.
- بعد التعارض يعيد المستخدم تحميل السجل، يراجع الفروقات، ثم يعيد التعديل على النسخة الأحدث.
- الحقول `created_at` و`updated_at` و`row_version` و`updated_by` حقول نظامية ولا تُدخل يدويًا.

## استيراد الملفات الخارجية

1. رفع إلى معالج الاستيراد.
2. تخزين في `mgos_staging` وفحص النوع والهندسة والحقول والدومينات.
3. مراجعة الأخطاء والتكرارات المحتملة.
4. قرار صريح لكل تعارض: إنشاء أو تحديث أو تخطي.
5. اعتماد ذري واحد أو رفض الدفعة كاملة.
6. الاحتفاظ بتقرير الدفعة للتدقيق.

## ما لا يُعد مصدرًا تشغيليًا

- ملفات `.gdb` و`.geojson` للتبادل أو الأرشفة، وليست نسخة متزامنة.
- GeoServer واجهة نشر وقراءة، وليس قاعدة مستقلة.
- لا يولد المشروع عينات أو سجلات مكانية بديلة عن ملفات المستخدم الحقيقية.
