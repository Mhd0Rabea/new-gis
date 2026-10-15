# إعداد GeoServer المنشور

## البنية

- Base URL: قيمة `GEOSERVER_URL`؛ الافتراضي المحلي للتطوير `http://localhost:8080/geoserver`
- Workspace: `mgos`
- PostGIS Store: `mgos`
- Native/Declared CRS: `EPSG:32637`
- WFS service level: `BASIC` (لا WFS-T)

## الطبقات والأنماط

| الطبقة | النوع | النمط |
|---|---|---|
| `Military_Bases` | Point | `mgos:mgos_points` |
| `Checkpoints` | Point | `mgos:mgos_points` |
| `Operation_Sectors` | Polygon | `mgos:mgos_polygons` |
| `Patrol_Routes` | Line | `mgos:mgos_lines` |
| `Threat_Areas` | Polygon | `mgos:mgos_polygons` |
| `Supply_Routes` | Line | `mgos:mgos_lines` |
| `Military_Warehouses` | Point | `mgos:mgos_points` |
| `Airports` | Point | `mgos:mgos_points` |
| `Communication_Towers` | Point | `mgos:mgos_points` |

ملفات SLD المصدرية موجودة في `geoserver/styles/`. لا يتضمن هذا الملف أسرار الاتصال.
