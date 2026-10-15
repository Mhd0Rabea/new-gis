# تحقق اتصال ArcGIS Pro

**البيئة:** ArcGIS Pro `3.7.1 Standard` واتصال `gis/MGOS/mgos.sde` المستبعد من Git.

نجح الاتصال بقاعدة `mgos` باستخدام الدور المحدود `mgos`. نجح إنشاء وقراءة طبقة Point اختبارية بـ`SRID 32637`، ثم نجح نقل `Military_Bases`.

## اكتشافات الاختبار

- يجب تعطيل `Preserve Global IDs` عند التصدير إلى PostgreSQL عادي؛ تفعيله أعاد `000594 Function not implemented`.
- يبقى `GlobalID` محفوظ القيمة في جدول staging كـ`varchar(38)`، ثم يحوله المستورد إلى `uuid`.
- أسماء PostgreSQL التي تحتاج double quotes لا يقرأها ArcGIS؛ لذلك الأسماء الفيزيائية lowercase بينما تبقى الأسماء Canonical في عقود GeoServer وNestJS.