CREATE SCHEMA IF NOT EXISTS mgos_staging;

CREATE TABLE IF NOT EXISTS mgos_staging.import_batches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 layer_name text NOT NULL,
 source_name text NOT NULL,
 file_name text NOT NULL,
 file_sha256 text NOT NULL,
 status text NOT NULL DEFAULT 'review' CHECK (status IN ('uploaded','review','ready','committed','rejected','failed')),
 totals jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_by text NOT NULL DEFAULT 'local-user',
 created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 reviewed_at timestamptz,
 committed_at timestamptz,
 error_message text
);

CREATE TABLE IF NOT EXISTS mgos_staging.staged_features (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 batch_id uuid NOT NULL REFERENCES mgos_staging.import_batches(id) ON DELETE CASCADE,
 feature_index integer NOT NULL,
 source_id text,
 original_properties jsonb NOT NULL,
 normalized_properties jsonb NOT NULL,
 geom geometry(Geometry,4326) NOT NULL,
 validation_status text NOT NULL CHECK (validation_status IN ('valid','warning','invalid')),
 duplicate_kind text NOT NULL DEFAULT 'none' CHECK (duplicate_kind IN ('none','exact','possible')),
 matched_feature_id uuid,
 matched_row_version bigint,
 UNIQUE(batch_id,feature_index)
);

CREATE TABLE IF NOT EXISTS mgos_staging.validation_issues (
 id bigserial PRIMARY KEY,
 staged_feature_id uuid NOT NULL REFERENCES mgos_staging.staged_features(id) ON DELETE CASCADE,
 severity text NOT NULL CHECK (severity IN ('warning','error')),
 field_name text,
 code text NOT NULL,
 message_ar text NOT NULL,
 original_value jsonb
);

CREATE TABLE IF NOT EXISTS mgos_staging.import_decisions (
 staged_feature_id uuid PRIMARY KEY REFERENCES mgos_staging.staged_features(id) ON DELETE CASCADE,
 action text NOT NULL CHECK (action IN ('create','update','skip')),
 decided_by text NOT NULL,
 decided_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['military_bases','checkpoints','operation_sectors','patrol_routes','threat_areas','supply_routes','military_warehouses','airports','communication_towers']
 LOOP
  EXECUTE format('ALTER TABLE mgos.%I ADD COLUMN IF NOT EXISTS source_name text',t);
  EXECUTE format('ALTER TABLE mgos.%I ADD COLUMN IF NOT EXISTS source_id text',t);
  EXECUTE format('ALTER TABLE mgos.%I ADD COLUMN IF NOT EXISTS row_version bigint NOT NULL DEFAULT 1',t);
  EXECUTE format('ALTER TABLE mgos.%I ADD COLUMN IF NOT EXISTS updated_by text',t);
  EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON mgos.%I(source_name,source_id) WHERE source_name IS NOT NULL AND source_id IS NOT NULL',t||'_source_identity_uq',t);
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION mgos.touch_feature_timestamps()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 NEW.updated_at := CURRENT_TIMESTAMP;
 NEW.row_version := OLD.row_version + 1;
 IF current_setting('mgos.updated_by',true) IS NOT NULL THEN NEW.updated_by := current_setting('mgos.updated_by',true); END IF;
 IF TG_TABLE_NAME='military_bases' THEN NEW.last_update := CURRENT_TIMESTAMP; END IF;
 RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['military_bases','checkpoints','operation_sectors','patrol_routes','threat_areas','supply_routes','military_warehouses','airports','communication_towers']
 LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS set_feature_timestamps ON mgos.%I',t);
  EXECUTE format('CREATE TRIGGER set_feature_timestamps BEFORE UPDATE ON mgos.%I FOR EACH ROW EXECUTE FUNCTION mgos.touch_feature_timestamps()',t);
 END LOOP;
END $$;
