# التحقق من WFS

**التاريخ:** 2026-10-03

- `GetCapabilities`: نجح، والاستجابة في `wfs-capabilities.xml`.
- `GetFeature` بصيغة GeoJSON لطبقة `Military_Bases`: أعاد 4 معالم.
- استعلام BBOX بالقيم `36,33.35,36.8,33.75,EPSG:4326`: أعاد 4 معالم.
- CRS المعلن في GeoJSON: `urn:ogc:def:crs:EPSG::4326`.
- تدقيق جميع الطبقات التسع: الاسم و`EPSG:32637` والنمط وعدد السجلات نجحت؛ التفاصيل في `layer-audit.json`.

النتيجة: **PASS**.
