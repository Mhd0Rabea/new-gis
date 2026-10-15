CREATE TABLE IF NOT EXISTS mgos.military_bases (
    id uuid PRIMARY KEY,
    base_id integer NOT NULL UNIQUE,
    base_name varchar(150) NOT NULL,
    base_type smallint,
    security_level smallint,
    status smallint,
    soldiers_count integer,
    vehicles_count integer,
    commander varchar(100),
    call_sign varchar(50),
    area_size double precision,
    elevation double precision,
    power_source smallint,
    communication_status smallint,
    establish_date timestamp without time zone,
    last_update timestamp without time zone,
    notes varchar(500),
    geom geometry(Point, 32637) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT military_bases_base_type_check CHECK (base_type IS NULL OR base_type BETWEEN 1 AND 5),
    CONSTRAINT military_bases_status_check CHECK (status IS NULL OR status BETWEEN 1 AND 4),
    CONSTRAINT military_bases_soldiers_count_check CHECK (soldiers_count IS NULL OR soldiers_count >= 0),
    CONSTRAINT military_bases_vehicles_count_check CHECK (vehicles_count IS NULL OR vehicles_count >= 0),
    CONSTRAINT military_bases_area_size_check CHECK (area_size IS NULL OR area_size >= 0)
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS military_bases_geom_gix ON mgos.military_bases USING gist (geom);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.checkpoints (
    id uuid PRIMARY KEY,
    checkpoint_id integer NOT NULL UNIQUE,
    name varchar(150) NOT NULL,
    type smallint,
    personnel smallint,
    risk_level smallint,
    status smallint,
    responsible_unit varchar(100),
    daily_vehicles integer,
    working_hours varchar(50),
    camera_available smallint,
    created_date timestamp without time zone,
    notes varchar(500),
    geom geometry(Point, 32637) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT checkpoints_type_check CHECK (type IS NULL OR type BETWEEN 1 AND 4),
    CONSTRAINT checkpoints_personnel_check CHECK (personnel IS NULL OR personnel >= 0),
    CONSTRAINT checkpoints_daily_vehicles_check CHECK (daily_vehicles IS NULL OR daily_vehicles >= 0),
    CONSTRAINT checkpoints_camera_available_check CHECK (camera_available IS NULL OR camera_available IN (0, 1))
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS checkpoints_geom_gix ON mgos.checkpoints USING gist (geom);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.operation_sectors (
    id uuid PRIMARY KEY,
    sector_id integer NOT NULL UNIQUE,
    name varchar(150) NOT NULL,
    sector_type smallint,
    threat_level smallint,
    terrain_type smallint,
    troops_count integer,
    checkpoints_count integer,
    control_level smallint,
    field_commander varchar(100),
    security_percentage double precision,
    last_operation timestamp without time zone,
    notes varchar(500),
    geom geometry(MultiPolygon, 32637) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT operation_sectors_type_check CHECK (sector_type IS NULL OR sector_type BETWEEN 1 AND 5),
    CONSTRAINT operation_sectors_troops_check CHECK (troops_count IS NULL OR troops_count >= 0),
    CONSTRAINT operation_sectors_checkpoints_check CHECK (checkpoints_count IS NULL OR checkpoints_count >= 0),
    CONSTRAINT operation_sectors_security_check CHECK (security_percentage IS NULL OR security_percentage BETWEEN 0 AND 100)
);

-- mgos:statement

ALTER TABLE mgos.operation_sectors
    ALTER COLUMN geom TYPE geometry(MultiPolygon, 32637)
    USING ST_Multi(geom);

-- mgos:statement

CREATE INDEX IF NOT EXISTS operation_sectors_geom_gix ON mgos.operation_sectors USING gist (geom);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.patrol_routes (
    id uuid PRIMARY KEY,
    route_id integer NOT NULL UNIQUE,
    name varchar(150) NOT NULL,
    type smallint,
    risk_level smallint,
    length_km double precision,
    travel_time double precision,
    personnel_count smallint,
    vehicles_count smallint,
    road_status smallint,
    last_patrol timestamp without time zone,
    notes varchar(500),
    geom geometry(MultiLineString, 32637) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT patrol_routes_length_check CHECK (length_km IS NULL OR length_km >= 0),
    CONSTRAINT patrol_routes_travel_time_check CHECK (travel_time IS NULL OR travel_time >= 0),
    CONSTRAINT patrol_routes_personnel_check CHECK (personnel_count IS NULL OR personnel_count >= 0),
    CONSTRAINT patrol_routes_vehicles_check CHECK (vehicles_count IS NULL OR vehicles_count >= 0)
);

-- mgos:statement

ALTER TABLE mgos.patrol_routes
    ALTER COLUMN geom TYPE geometry(MultiLineString, 32637)
    USING ST_Multi(geom);

-- mgos:statement

CREATE INDEX IF NOT EXISTS patrol_routes_geom_gix ON mgos.patrol_routes USING gist (geom);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.military_personnel (
    id uuid PRIMARY KEY,
    personnel_id integer NOT NULL UNIQUE,
    full_name varchar(150) NOT NULL,
    code_name varchar(100),
    rank smallint,
    specialty smallint,
    unit_name varchar(100),
    military_no varchar(50),
    status smallint,
    base_idfk uuid,
    checkpoint_idfk uuid,
    warehouse_idfk uuid,
    join_date timestamp without time zone,
    phone varchar(30),
    address varchar(250),
    notes varchar(500),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT military_personnel_base_fk FOREIGN KEY (base_idfk) REFERENCES mgos.military_bases(id) ON DELETE RESTRICT,
    CONSTRAINT military_personnel_checkpoint_fk FOREIGN KEY (checkpoint_idfk) REFERENCES mgos.checkpoints(id) ON DELETE RESTRICT
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS military_personnel_base_idx ON mgos.military_personnel (base_idfk);

-- mgos:statement

CREATE INDEX IF NOT EXISTS military_personnel_checkpoint_idx ON mgos.military_personnel (checkpoint_idfk);

-- mgos:statement

CREATE INDEX IF NOT EXISTS military_personnel_warehouse_idx ON mgos.military_personnel (warehouse_idfk);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.military_vehicles (
    id uuid PRIMARY KEY,
    vehicle_id integer NOT NULL UNIQUE,
    base_idfk uuid,
    vehicle_name varchar(100) NOT NULL,
    vehicle_type smallint,
    military_number varchar(50),
    status smallint,
    fuel_consumption double precision,
    last_maintenance timestamp without time zone,
    readiness smallint,
    crew_count smallint,
    notes varchar(500),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT military_vehicles_base_fk FOREIGN KEY (base_idfk) REFERENCES mgos.military_bases(id) ON DELETE RESTRICT,
    CONSTRAINT military_vehicles_fuel_check CHECK (fuel_consumption IS NULL OR fuel_consumption >= 0),
    CONSTRAINT military_vehicles_crew_check CHECK (crew_count IS NULL OR crew_count >= 0)
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS military_vehicles_base_idx ON mgos.military_vehicles (base_idfk);

-- mgos:statement

CREATE TABLE IF NOT EXISTS mgos.military_incidents (
    id uuid PRIMARY KEY,
    incident_id integer NOT NULL UNIQUE,
    sector_idfk uuid,
    threat_idfk uuid,
    name varchar(100) NOT NULL,
    incident_type smallint,
    incident_date timestamp without time zone,
    casualties smallint,
    fatalities smallint,
    description varchar(1000),
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT military_incidents_sector_fk FOREIGN KEY (sector_idfk) REFERENCES mgos.operation_sectors(id) ON DELETE RESTRICT,
    CONSTRAINT military_incidents_casualties_check CHECK (casualties IS NULL OR casualties >= 0),
    CONSTRAINT military_incidents_fatalities_check CHECK (fatalities IS NULL OR fatalities >= 0)
);

-- mgos:statement

CREATE INDEX IF NOT EXISTS military_incidents_sector_idx ON mgos.military_incidents (sector_idfk);

-- mgos:statement

CREATE INDEX IF NOT EXISTS military_incidents_threat_idx ON mgos.military_incidents (threat_idfk);
