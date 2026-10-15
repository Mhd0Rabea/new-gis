# نتيجة نقل النواة

نُقلت النواة آليًا بواسطة `scripts/import_mgos.py --group core`:

- `Military_Bases`
- `Checkpoints`
- `Operation_Sectors`
- `Patrol_Routes`
- `Military_Personnel`
- `Military_Vehicles`
- `Military_Incidents`

تطابق عدد المصدر والهدف لكل Dataset، وكانت UUID فريدة، والهندسات صالحة، وSRID يساوي `32637`. أعيد التشغيل دون زيادة الأعداد.

ArcGIS Polygon وPolyline يدعمان multipart؛ لذلك التخزين الصحيح المكتشف عمليًا هو `MultiPolygon` و`MultiLineString` في PostGIS.