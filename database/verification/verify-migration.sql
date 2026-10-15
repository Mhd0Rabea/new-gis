-- Server and extension
SELECT version();
SELECT PostGIS_Full_Version();

-- Spatial metadata: nine published layers must use SRID 32637.
SELECT
    f_table_name,
    f_geometry_column,
    type,
    srid
FROM geometry_columns
WHERE f_table_schema = 'mgos'
  AND f_table_name IN (
      'military_bases', 'checkpoints', 'operation_sectors', 'patrol_routes',
      'threat_areas', 'supply_routes', 'military_warehouses', 'airports',
      'communication_towers'
  )
ORDER BY f_table_name;

-- Counts, UUID uniqueness, geometry validity, and SRID.
SELECT 'military_bases' AS table_name, count(*) AS rows, count(DISTINCT id) AS unique_ids,
       count(*) FILTER (WHERE NOT ST_IsValid(geom)) AS invalid_geom,
       count(*) FILTER (WHERE ST_SRID(geom) <> 32637) AS wrong_srid
FROM mgos.military_bases
UNION ALL SELECT 'checkpoints', count(*), count(DISTINCT id), count(*) FILTER (WHERE NOT ST_IsValid(geom)), count(*) FILTER (WHERE ST_SRID(geom) <> 32637) FROM mgos.checkpoints
UNION ALL SELECT 'operation_sectors', count(*), count(DISTINCT id), count(*) FILTER (WHERE NOT ST_IsValid(geom)), count(*) FILTER (WHERE ST_SRID(geom) <> 32637) FROM mgos.operation_sectors
UNION ALL SELECT 'patrol_routes', count(*), count(DISTINCT id), count(*) FILTER (WHERE NOT ST_IsValid(geom)), count(*) FILTER (WHERE ST_SRID(geom) <> 32637) FROM mgos.patrol_routes
UNION ALL SELECT 'threat_areas', count(*), count(DISTINCT id), count(*) FILTER (WHERE NOT ST_IsValid(geom)), count(*) FILTER (WHERE ST_SRID(geom) <> 32637) FROM mgos.threat_areas
UNION ALL SELECT 'supply_routes', count(*), count(DISTINCT id), count(*) FILTER (WHERE NOT ST_IsValid(geom)), count(*) FILTER (WHERE ST_SRID(geom) <> 32637) FROM mgos.supply_routes
UNION ALL SELECT 'military_warehouses', count(*), count(DISTINCT id), count(*) FILTER (WHERE NOT ST_IsValid(geom)), count(*) FILTER (WHERE ST_SRID(geom) <> 32637) FROM mgos.military_warehouses
UNION ALL SELECT 'airports', count(*), count(DISTINCT id), count(*) FILTER (WHERE NOT ST_IsValid(geom)), count(*) FILTER (WHERE ST_SRID(geom) <> 32637) FROM mgos.airports
UNION ALL SELECT 'communication_towers', count(*), count(DISTINCT id), count(*) FILTER (WHERE NOT ST_IsValid(geom)), count(*) FILTER (WHERE ST_SRID(geom) <> 32637) FROM mgos.communication_towers
ORDER BY table_name;

-- The six ArcGIS relationship classes must have no orphan rows.
SELECT 'military_personnel.base_idfk' AS relationship, count(*) AS orphan_count
FROM mgos.military_personnel child
LEFT JOIN mgos.military_bases parent ON parent.id = child.base_idfk
WHERE child.base_idfk IS NOT NULL AND parent.id IS NULL
UNION ALL
SELECT 'military_vehicles.base_idfk', count(*)
FROM mgos.military_vehicles child
LEFT JOIN mgos.military_bases parent ON parent.id = child.base_idfk
WHERE child.base_idfk IS NOT NULL AND parent.id IS NULL
UNION ALL
SELECT 'weapons_inventory.warehouse_idfk', count(*)
FROM mgos.weapons_inventory child
LEFT JOIN mgos.military_warehouses parent ON parent.id = child.warehouse_idfk
WHERE child.warehouse_idfk IS NOT NULL AND parent.id IS NULL
UNION ALL
SELECT 'intelligence_reports.threat_idfk', count(*)
FROM mgos.intelligence_reports child
LEFT JOIN mgos.threat_areas parent ON parent.id = child.threat_idfk
WHERE child.threat_idfk IS NOT NULL AND parent.id IS NULL
UNION ALL
SELECT 'communication_devices.tower_idfk', count(*)
FROM mgos.communication_devices child
LEFT JOIN mgos.communication_towers parent ON parent.id = child.tower_idfk
WHERE child.tower_idfk IS NOT NULL AND parent.id IS NULL
UNION ALL
SELECT 'military_incidents.sector_idfk', count(*)
FROM mgos.military_incidents child
LEFT JOIN mgos.operation_sectors parent ON parent.id = child.sector_idfk
WHERE child.sector_idfk IS NOT NULL AND parent.id IS NULL;

-- Foreign keys and spatial indexes must be present and validated.
SELECT conrelid::regclass AS table_name, conname, convalidated
FROM pg_constraint
WHERE connamespace = 'mgos'::regnamespace
  AND contype = 'f'
ORDER BY table_name::text, conname;

SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'mgos'
  AND indexdef ILIKE '%USING gist%'
ORDER BY tablename, indexname;
