# Research: PostGIS Integration

## Decision 1: استخدام التثبيت المحلي

- **Decision**: إعادة استخدام خدمة PostgreSQL 18.6 وPostGIS 3.6.2 المحلية.
- **Rationale**: الخدمة تعمل والملفات مثبتة، وDocker لا يضيف قيمة تعليمية هنا.
- **Alternatives considered**: Docker رُفض؛ تثبيت PostgreSQL ثانٍ رُفض قبل إثبات عدم التوافق.

## Decision 2: بوابة توافق ArcGIS

- **Decision**: إنشاء قاعدة اختبار وطبقة Point صغيرة ثم اختبار ArcGIS Database Connection قبل اعتماد النقل.
- **Rationale**: إصدار ArcGIS Pro هو المرجع الفعلي للتوافق، والاختبار يمنع تغيير البيئة بناء على افتراض.
- **Alternatives considered**: النقل الكامل أولًا رُفض لارتفاع كلفة التراجع.

## Decision 3: مسار النقل

- **Decision**: ArcPy المرفق مع ArcGIS Pro هو مسار النقل الأساسي القابل لإعادة التشغيل؛ `ogr2ogr` fallback فقط.
- **Rationale**: الاختبار اليدوي أثبت التحويل، ثم أصبح تكراره على 19 Dataset مبررًا لأمر ArcPy واحد دون خدمة تشغيل إضافية.
- **Alternatives considered**: النقل اليدوي الكامل رُفض بعد إثبات المسار على طبقة واحدة؛ تشغيل الاستيراد داخل NestJS رُفض لأنه عمل إداري لا API.

## Decision 4: نموذج الهوية

- **Decision**: UUID في PostGIS يحفظ قيمة GlobalID، ومعرفات الأعمال تبقى أعمدة مستقلة فريدة.
- **Rationale**: UUID ثابت عبر النقل ولا يعتمد على ObjectID.
- **Alternatives considered**: Serial فقط رُفض لأنه يقطع العلاقة بالمصدر.

## Decision 5: أسماء PostgreSQL

- **Decision**: schema باسم `mgos`، وأسماء PostgreSQL الفيزيائية lowercase، مع إبقاء الأسماء Canonical في عقود النشر والـAPI.
- **Rationale**: ArcGIS لا يقرأ أسماء PostgreSQL التي تحتاج double quotes؛ mapping المركزي يحافظ على العقد دون كسر التوافق.
- **Alternatives considered**: quoted mixed-case اختُبر ورُفض عمليًا لأنه لا يظهر في ArcGIS.

## Decision 6: قابلية النقل والمشاركة

- **Decision**: وضع أسماء Datasets وSchema وSRID ومجموعات النقل في `config/mgos-import.json`، واستخدام مشغّل يكتشف جذر المشروع وArcGIS Python وملفي `*.gdb` و`*.sde`، مع إمكانية تجاوز كل قيمة بالمعاملات أو متغيرات البيئة.
- **Rationale**: يسمح بنقل المشروع بين الأجهزة والخوادم دون تعديل الكود أو تخزين مسارات شخصية وأسرار اتصال.
- **Alternatives considered**: تثبيت المسارات داخل السكربت رُفض؛ تخزين `.sde` في Git رُفض لأنه اتصال محلي وقد يحتوي بيانات اعتماد مشفرة؛ اكتشاف أول ملف بصمت رُفض، لذلك يفشل المشغّل بوضوح عند وجود أكثر من مرشح.