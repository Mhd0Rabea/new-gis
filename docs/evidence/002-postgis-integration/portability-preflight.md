# فحص قابلية النقل

**التاريخ:** 2026-10-03  
**الأمر:** `scripts/preflight.ps1 -Target PostGIS`

## النتيجة

`PASS` دون أي Required Failures أو Warnings.

- ملفات الإعداد والاستيراد المحمولة موجودة.
- وُجد File Geodatabase واحد ومشروع ArcGIS واحد واتصال `.sde` محلي واحد.
- ArcGIS Pro: `3.7.1.1904` وبيئة ArcGIS Python متاحة.
- PostgreSQL: `18.6` والخدمة تعمل.
- اتصال PostGIS والمخطط: ناجح؛ PostGIS `3.6.2` وSRID `32637`.
- تحققت 19 Dataset عبر DryRun دون نقل أو تعديل البيانات.
- Temurin Java: `17.0.20.1` ومتوفر قبل مرحلة GeoServer.
- Node.js: `24.19.0` وnpm: `11.17.0` ومتوفران قبل مرحلة API.
- GeoServer لم يكن مطلوبًا ضمن Target الحالي؛ سيصبح فشله مانعًا عند استخدام `-Target GeoServer`.
- نجح إخراج JSON باستخدام `-Target Foundation -Json`.
- لم يُثبت أو يُحدّث أو يُحذف أي برنامج.

لا يحتوي هذا الدليل على مسارات جهاز أو كلمات مرور أو محتوى ملف `.sde`.