CREATE TABLE IF NOT EXISTS mgos.threat_areas (
    id uuid PRIMARY KEY,
    threat_id integer NOT NULL UNIQUE,
    name varchar(150) NOT NULL,
    threat_type smallint,
    level smallint,
    enemy_count integer,
    weapon_type varchar(100),
    intel_source smallint,
    last_detected timestamp without time zone,
    danger_percentage double precision,
    night_activity smallint,
    notes varchar(1000),
    geom geometry(MultiPolygon, 32637) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT threat_areas_enemy_count_check CHECK (enemy_count IS NULL OR enemy_count >= 0),
    CONSTRAINT threat_areas_danger_check CHECK (danger_percentage IS NULL OR danger_percentage BETWEEN 0 AND 100),
    CONSTRAINT threat_areas_night_check CHECK (night_activity IS NULL OR night_activity IN (0, 1))
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS threat_areas_geom_gix ON mgos.threat_areas USING gist (geom);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.supply_routes (
    id uuid PRIMARY KEY,
    route_id integer NOT NULL UNIQUE,
    name varchar(150) NOT NULL,
    status smallint,
    risk smallint,
    length_km double precision,
    arrival_time double precision,
    convoys_count integer,
    accessibility smallint,
    last_supply timestamp without time zone,
    notes varchar(500),
    geom geometry(MultiLineString, 32637) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT supply_routes_length_check CHECK (length_km IS NULL OR length_km >= 0),
    CONSTRAINT supply_routes_arrival_check CHECK (arrival_time IS NULL OR arrival_time >= 0),
    CONSTRAINT supply_routes_convoys_check CHECK (convoys_count IS NULL OR convoys_count >= 0)
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS supply_routes_geom_gix ON mgos.supply_routes USING gist (geom);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.military_warehouses (
    id uuid PRIMARY KEY,
    warehouse_id integer NOT NULL UNIQUE,
    name varchar(150) NOT NULL,
    type smallint,
    capacity double precision,
    protection_level smallint,
    fill_percentage double precision,
    temperature double precision,
    electricity smallint,
    last_inventory timestamp without time zone,
    notes varchar(500),
    geom geometry(Point, 32637) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT military_warehouses_capacity_check CHECK (capacity IS NULL OR capacity >= 0),
    CONSTRAINT military_warehouses_fill_check CHECK (fill_percentage IS NULL OR fill_percentage BETWEEN 0 AND 100),
    CONSTRAINT military_warehouses_electricity_check CHECK (electricity IS NULL OR electricity IN (0, 1))
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS military_warehouses_geom_gix ON mgos.military_warehouses USING gist (geom);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.airports (
    id uuid PRIMARY KEY,
    airport_id integer NOT NULL UNIQUE,
    name varchar(150) NOT NULL,
    type smallint,
    runways smallint,
    runway_length double precision,
    aircraft_capacity integer,
    security_level smallint,
    airport_status smallint,
    last_maintenance timestamp without time zone,
    notes varchar(500),
    geom geometry(Point, 32637) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT airports_runways_check CHECK (runways IS NULL OR runways >= 0),
    CONSTRAINT airports_runway_length_check CHECK (runway_length IS NULL OR runway_length >= 0),
    CONSTRAINT airports_capacity_check CHECK (aircraft_capacity IS NULL OR aircraft_capacity >= 0)
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS airports_geom_gix ON mgos.airports USING gist (geom);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.communication_towers (
    id uuid PRIMARY KEY,
    tower_id integer NOT NULL UNIQUE,
    name varchar(150) NOT NULL,
    coverage double precision,
    tower_type smallint,
    frequency double precision,
    power_status smallint,
    signal_strength double precision,
    status smallint,
    last_inspection timestamp without time zone,
    notes varchar(500),
    geom geometry(Point, 32637) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT communication_towers_coverage_check CHECK (coverage IS NULL OR coverage >= 0),
    CONSTRAINT communication_towers_frequency_check CHECK (frequency IS NULL OR frequency >= 0)
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS communication_towers_geom_gix ON mgos.communication_towers USING gist (geom);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.weapons_inventory (
    id uuid PRIMARY KEY,
    weapon_id integer NOT NULL UNIQUE,
    warehouse_idfk uuid,
    weapon_name varchar(100) NOT NULL,
    weapon_type smallint,
    quantity integer,
    status smallint,
    supply_date timestamp without time zone,
    expiry_date timestamp without time zone,
    notes varchar(500),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT weapons_inventory_warehouse_fk FOREIGN KEY (warehouse_idfk) REFERENCES mgos.military_warehouses(id) ON DELETE RESTRICT,
    CONSTRAINT weapons_inventory_quantity_check CHECK (quantity IS NULL OR quantity >= 0)
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS weapons_inventory_warehouse_idx ON mgos.weapons_inventory (warehouse_idfk);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.intelligence_reports (
    id uuid PRIMARY KEY,
    report_id integer NOT NULL UNIQUE,
    threat_idfk uuid,
    title varchar(200) NOT NULL,
    source_type smallint,
    reliability smallint,
    report_date timestamp without time zone,
    content varchar(4000),
    attachments varchar(500),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT intelligence_reports_threat_fk FOREIGN KEY (threat_idfk) REFERENCES mgos.threat_areas(id) ON DELETE RESTRICT
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS intelligence_reports_threat_idx ON mgos.intelligence_reports (threat_idfk);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.communication_devices (
    id uuid PRIMARY KEY,
    device_id integer NOT NULL UNIQUE,
    tower_idfk uuid,
    device_type smallint,
    frequency double precision,
    range_km double precision,
    encryption smallint,
    status smallint,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT communication_devices_tower_fk FOREIGN KEY (tower_idfk) REFERENCES mgos.communication_towers(id) ON DELETE RESTRICT,
    CONSTRAINT communication_devices_frequency_check CHECK (frequency IS NULL OR frequency >= 0),
    CONSTRAINT communication_devices_range_check CHECK (range_km IS NULL OR range_km >= 0)
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS communication_devices_tower_idx ON mgos.communication_devices (tower_idfk);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.maintenance_records (
    id uuid PRIMARY KEY,
    maintenance_id integer NOT NULL UNIQUE,
    asset_type smallint,
    asset_id uuid,
    maintenance_date timestamp without time zone,
    maintenance_type smallint,
    cost double precision,
    technician varchar(100),
    notes varchar(500),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT maintenance_records_cost_check CHECK (cost IS NULL OR cost >= 0)
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS maintenance_records_asset_idx ON mgos.maintenance_records (asset_id);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.system_users (
    id uuid PRIMARY KEY,
    user_id integer NOT NULL UNIQUE,
    username varchar(50) NOT NULL UNIQUE,
    password_hash varchar(255),
    role smallint,
    last_login timestamp without time zone,
    status smallint,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.audit_log (
    id uuid PRIMARY KEY,
    log_id integer NOT NULL UNIQUE,
    user_idfk uuid,
    action varchar(100),
    table_name varchar(100),
    action_date timestamp without time zone,
    device_ip varchar(50),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_log_user_fk FOREIGN KEY (user_idfk) REFERENCES mgos.system_users(id) ON DELETE RESTRICT
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS audit_log_user_idx ON mgos.audit_log (user_idfk);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.attachments_metadata (
    id uuid PRIMARY KEY,
    attachment_id integer NOT NULL UNIQUE,
    file_name varchar(255) NOT NULL,
    file_path varchar(500),
    file_type varchar(50),
    file_size double precision,
    upload_date timestamp without time zone,
    reference_id uuid,
    reference_table varchar(100),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT attachments_metadata_size_check CHECK (file_size IS NULL OR file_size >= 0)
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS attachments_metadata_reference_idx ON mgos.attachments_metadata (reference_id);

-- mgos:statement

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'military_personnel_warehouse_fk'
          AND conrelid = 'mgos.military_personnel'::regclass
    ) THEN
        ALTER TABLE mgos.military_personnel
            ADD CONSTRAINT military_personnel_warehouse_fk
            FOREIGN KEY (warehouse_idfk)
            REFERENCES mgos.military_warehouses(id)
            ON DELETE RESTRICT NOT VALID;
    END IF;
END
$$;

-- mgos:statement

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'military_incidents_threat_fk'
          AND conrelid = 'mgos.military_incidents'::regclass
    ) THEN
        ALTER TABLE mgos.military_incidents
            ADD CONSTRAINT military_incidents_threat_fk
            FOREIGN KEY (threat_idfk)
            REFERENCES mgos.threat_areas(id)
            ON DELETE RESTRICT NOT VALID;
    END IF;
END
$$;
