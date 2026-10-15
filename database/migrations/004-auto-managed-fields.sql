-- System-managed identifiers and timestamps for map features.
DO $$
DECLARE
    item record;
    next_value bigint;
BEGIN
    FOR item IN
        SELECT * FROM (VALUES
            ('military_bases', 'base_id', 'military_bases_base_id_seq'),
            ('checkpoints', 'checkpoint_id', 'checkpoints_checkpoint_id_seq'),
            ('operation_sectors', 'sector_id', 'operation_sectors_sector_id_seq'),
            ('patrol_routes', 'route_id', 'patrol_routes_route_id_seq'),
            ('threat_areas', 'threat_id', 'threat_areas_threat_id_seq'),
            ('supply_routes', 'route_id', 'supply_routes_route_id_seq'),
            ('military_warehouses', 'warehouse_id', 'military_warehouses_warehouse_id_seq'),
            ('airports', 'airport_id', 'airports_airport_id_seq'),
            ('communication_towers', 'tower_id', 'communication_towers_tower_id_seq')
        ) AS values_list(table_name, column_name, sequence_name)
    LOOP
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS mgos.%I', item.sequence_name);
        EXECUTE format('SELECT COALESCE(MAX(%I), 0) + 1 FROM mgos.%I', item.column_name, item.table_name)
            INTO next_value;
        EXECUTE format('SELECT setval(%L, $1, false)', 'mgos.' || item.sequence_name)
            USING next_value;
        EXECUTE format(
            'ALTER TABLE mgos.%I ALTER COLUMN %I SET DEFAULT nextval(%L::regclass)',
            item.table_name,
            item.column_name,
            'mgos.' || item.sequence_name
        );
        EXECUTE format(
            'ALTER SEQUENCE mgos.%I OWNED BY mgos.%I.%I',
            item.sequence_name,
            item.table_name,
            item.column_name
        );
    END LOOP;
END;
$$;

DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'military_bases', 'checkpoints', 'operation_sectors', 'patrol_routes',
        'threat_areas', 'supply_routes', 'military_warehouses', 'airports',
        'communication_towers'
    ]
    LOOP
        EXECUTE format(
            'ALTER TABLE mgos.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()',
            table_name
        );
    END LOOP;
END;
$$;

ALTER TABLE mgos.military_bases
    ALTER COLUMN establish_date SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN last_update SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE mgos.checkpoints
    ALTER COLUMN created_date SET DEFAULT CURRENT_TIMESTAMP;

CREATE OR REPLACE FUNCTION mgos.touch_feature_timestamps()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    IF TG_TABLE_NAME = 'military_bases' THEN
        NEW.last_update := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    table_name text;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'military_bases', 'checkpoints', 'operation_sectors', 'patrol_routes',
        'threat_areas', 'supply_routes', 'military_warehouses', 'airports',
        'communication_towers'
    ]
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_feature_timestamps ON mgos.%I', table_name);
        EXECUTE format(
            'CREATE TRIGGER set_feature_timestamps BEFORE UPDATE ON mgos.%I FOR EACH ROW EXECUTE FUNCTION mgos.touch_feature_timestamps()',
            table_name
        );
    END LOOP;
END;
$$;
