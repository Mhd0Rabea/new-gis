# Quickstart Validation: ArcGIS Foundation

## Prerequisites

- ArcGIS Pro 3.7.1 يعمل بترخيص Standard.
- `1.docx` موجود دون تعديل.
- لا توجد حاجة إلى PostgreSQL أو GeoServer لهذه المرحلة.

## Scenario 1: التحقق من النواة

1. افتح `gis/MGOS.aprx`.
2. من Catalog تأكد من وجود `gis/MGOS.gdb` وFeature Datasets الستة.
3. أضف طبقات النواة الأربع إلى الخريطة.
4. أنشئ قطاعًا اصطناعيًا ثم قاعدة وحاجزًا داخله ومسار دورية.
5. أضف فردًا وآلية مرتبطين بالقاعدة وحادثًا مرتبطًا بالقطاع.

**Expected**: تُقبل السجلات القانونية وتظهر العلاقات من نافذة Attributes.

## Scenario 2: Domains

1. حرر `Military_Bases.Base_Type` واختر قيمة من القائمة.
2. حاول إدخال code غير موجود.

**Expected**: تظهر القيم القانونية بأوصافها ويرفض الإدخال غير المعروف.

## Scenario 3: Topology

1. أنشئ قطاعين متداخلين وقاعدة خارج القطاعات ومسارًا يتقاطع مع نفسه.
2. شغّل Validate Topology وافتح Error Inspector.
3. أصلح الأخطاء وأعد التحقق.

**Expected**: تظهر الأخطاء الأربعة المقصودة ثم تصبح النواة بلا أخطاء غير مبررة.

## Scenario 4: اكتمال المخطط

1. ولّد Schema Report من `MGOS.gdb`.
2. قارن التقرير مع [data-model.md](data-model.md).
3. تحقق من الأسماء والأنواع والعلاقات الست.

**Expected**: تطابق كامل دون suffix هندسي في الأسماء ودون بيانات حقيقية.

## Evidence

احفظ التقرير وملخص Topology ولقطات التحقق تحت `docs/evidence/001-arcgis-foundation/`.
