# Research: ArcGIS Foundation

## Decision 1: نظام الإحداثيات

- **Decision**: استخدام `WGS 84 / UTM Zone 37N (EPSG:32637)` لكل البيانات المتجهة.
- **Rationale**: نطاق التدريب العام قرب إدلب يقع ضمن المنطقة 37N، والوحدات المترية مناسبة للأطوال والمساحات.
- **Alternatives considered**: `EPSG:4326` رُفض للتحرير والقياس؛ `EPSG:3857` رُفض لعدم دقة القياسات المحلية.

## Decision 2: المعرفات والعلاقات

- **Decision**: الاحتفاظ بمعرفات الأعمال مثل `Base_ID` وإضافة `GlobalID`؛ حقول `*IDFK` تكون GUID وترتبط بـGlobalID.
- **Rationale**: يثبت الهوية أثناء النقل إلى PostGIS ويمنع الاعتماد على ObjectID المتغير.
- **Alternatives considered**: علاقات Long فقط أبسط لحظيًا لكنها أضعف عند النقل والمزامنة.

## Decision 3: نطاق Topology

- **Decision**: Topology واحد للنواة بأربع قواعد فقط: القطاعات لا تتداخل، القواعد داخل القطاعات، الحواجز داخل القطاعات، ومسارات الدوريات لا تتقاطع مع نفسها.
- **Rationale**: يغطي التعلم المطلوب دون شبكة قواعد كبيرة.
- **Alternatives considered**: قواعد شاملة لكل الطبقات رُفضت لأنها تضيف تكرارًا قبل فهم الأساسيات.

## Decision 4: ترتيب التنفيذ

- **Decision**: نواة من أربع طبقات وثلاثة جداول، ثم توسعة كاملة.
- **Rationale**: تقدم شريحة قابلة للتحقق قبل تكرار النمط على 19 عنصرًا.
- **Alternatives considered**: إنشاء كل العناصر دفعة واحدة رُفض بسبب صعوبة اكتشاف أخطاء التصميم مبكرًا.

## Decision 5: Raster

- **Decision**: إنشاء `Spatial_Analysis` كـRaster Dataset اختياري فارغ أو بعينة واحدة دون تحليل.
- **Rationale**: يحافظ على المخطط ويفصل تعلم Raster عن Feature Classes.
- **Alternatives considered**: معاملته كـFeature Class مخالف لنموذج ArcGIS.
