# Research: الاستيراد المرحلي والمصدر المشترك

## Decision 1: PostGIS هو نقطة التزامن

**Decision**: يتصل ArcGIS Pro مباشرة بـPostGIS، ويصل MGOS عبر API، وينشر GeoServer من الجداول نفسها.  
**Rationale**: يلغي تضارب نسخ GDB/GeoJSON ويجعل الحفظ مرئيًا لكل المستهلكين.  
**Alternatives considered**: مزامنة ثنائية مع FileGDB؛ رفضت لتعقيد فض التعارض وعدم ملاءمة الملفات كمصدر تشغيلي.

## Decision 2: staging دائم ومنظم

**Decision**: تخزين دفعات ومعالم ومشكلات وقرارات في mgos_staging بدل جداول مؤقتة.  
**Rationale**: يسمح بالمراجعة والتدقيق والاستئناف.  
**Alternatives considered**: ذاكرة الخادم أو temp tables؛ لا تدعم التتبع والاستئناف.

## Decision 3: اعتماد ذري

**Decision**: جميع create/update/skip تنفذ داخل transaction واحدة.  
**Rationale**: يمنع الاستيراد الجزئي.  
**Alternatives considered**: طلب POST لكل معلم؛ تسبب سابقًا في نتائج جزئية.

## Decision 4: التكرار

**Decision**: source_name + source_id تطابق مؤكد، وإلا الاسم مع ST_DWithin ضمن 25 مترًا تطابق محتمل.  
**Rationale**: معرف المصدر أقوى؛ القرب fallback يحتاج قرارًا بشريًا.

## Decision 5: منع تعارض ArcGIS/MGOS

**Decision**: row_version وupdated_at وupdated_by على الجداول التشغيلية، وتحقق version عند التحديث.  
**Rationale**: تعديلات ArcGIS تمر من trigger نفسه وتمنع lost update.  
**Alternatives considered**: قفل طويل؛ غير مناسب للتحرير التفاعلي.
