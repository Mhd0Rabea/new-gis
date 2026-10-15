# دليل المرحلة 010 — مركز القرار والذكاء المكاني

آخر تحديث: 2026-10-13

## ما تم تنفيذه

- تقييم مخاطر قطاعات العمليات ومسارات الدوريات مع استبعاد العامل المفقود وخفض الثقة وفق البيانات المتاحة.
- ترتيب جاهزية المسارات مع تفسير القيود وحالة الطريق والموارد.
- تحليل ملف تتبع JSON يرفعه المستخدم، مع إنذارات مناطق الخطر وتأخر التحديث وانخفاض الجاهزية وحد السرعة.
- توقع قصير المدى من ملف مرفوع يتضمن نطاقًا مكانيًا وفترة زمنية وخط أساس وثقة وقيودًا.
- مقارنة صورتين GeoTIFF متوافقتين واستخراج مناطق تغير فعلية، وإرجاع هندستها GeoJSON في EPSG:4326.
- حفظ جلسات التتبع والإنذارات والتوقعات ومناطق التغير وقرارات المراجعة وملاحظاتها في PostgreSQL/PostGIS.
- لا ينشئ النظام بيانات أو ملفات أو نقاطًا اصطناعية.

## التحقق المنفذ

- نجح `npm run build` داخل `api`.
- نجح `npm run build` داخل `GIS-Base`.
- نجح `npm run test:contract`: خمس مجموعات و19 اختبارًا.
- بدأ API بنجاح وأنشأ جداول القرار، وأعادت مسارات القراءة `/alerts` و`/forecast` و`/changes` الحالة 200.
- تحقق توفر أدوات `gdal raster calc` و`gdal raster polygonize` و`ogr2ogr` في QGIS 3.44.13.
- أضيفت اختبارات T034 الآلية ونجحت: 25 اختبار عقد و8 اختبارات تكامل، مع بناء ناجح للـAPI والواجهة.
- أُدخلت بيانات مدنية مفتوحة وحقيقية من ريف دمشق ونُفذت عليها سيناريوهات التتبع والمؤشرات والتغير وجاهزية الطرق. نجح WFS وWMS، وبقيت المراجعة البشرية للنتائج فقط. التفاصيل في `rif-dimashq-real-data.md` و`t034-verification.md`.

## عقود API

- `GET /api/decision/risk`
- `GET /api/decision/routes`
- `GET /api/decision/alerts`
- `GET /api/decision/forecast`
- `GET /api/decision/changes`
- `POST /api/decision/tracking/start`
- `POST /api/decision/tracking/:id/stop`
- `POST /api/decision/tracking/:sessionId/alerts/:alertId/review`
- `POST /api/decision/forecast/analyze`
- `POST /api/decision/forecast/:id/review`
- `POST /api/decision/change/analyze`
- `POST /api/decision/change/:id/review`