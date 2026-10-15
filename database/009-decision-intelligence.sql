CREATE TABLE IF NOT EXISTS mgos.decision_tracking_sessions (
  id uuid PRIMARY KEY,
  source_file_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('running', 'stopped')),
  points_count integer NOT NULL CHECK (points_count > 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  stopped_at timestamptz
);

CREATE TABLE IF NOT EXISTS mgos.decision_alerts (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES mgos.decision_tracking_sessions(id) ON DELETE CASCADE,
  point_id text NOT NULL,
  kind text NOT NULL,
  reason text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('medium', 'high')),
  event_at timestamptz NOT NULL,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'rejected')),
  review_note varchar(500),
  reviewed_at timestamptz
);

CREATE TABLE IF NOT EXISTS mgos.decision_forecasts (
  id uuid PRIMARY KEY,
  source_file_name text NOT NULL,
  metric text NOT NULL,
  scope text,
  period_start timestamptz,
  period_end timestamptz,
  sample_count integer NOT NULL CHECK (sample_count >= 3),
  baseline numeric NOT NULL,
  forecast numeric NOT NULL,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  constraints jsonb NOT NULL DEFAULT '[]'::jsonb,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'rejected')),
  review_note varchar(500),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mgos.decision_change_candidates (
  id uuid PRIMARY KEY,
  baseline_file_name text NOT NULL,
  current_file_name text NOT NULL,
  baseline_mean numeric NOT NULL,
  current_mean numeric NOT NULL,
  change_percent numeric NOT NULL,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  summary text NOT NULL,
  geometry geometry(MultiPolygon, 32637),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'accepted', 'rejected')),
  review_note varchar(500),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS decision_alerts_session_idx ON mgos.decision_alerts(session_id, event_at DESC);
CREATE INDEX IF NOT EXISTS decision_forecasts_created_idx ON mgos.decision_forecasts(created_at DESC);
CREATE INDEX IF NOT EXISTS decision_changes_created_idx ON mgos.decision_change_candidates(created_at DESC);
CREATE INDEX IF NOT EXISTS decision_changes_geometry_idx ON mgos.decision_change_candidates USING gist(geometry);

ALTER TABLE mgos.decision_forecasts ADD COLUMN IF NOT EXISTS scope text;
ALTER TABLE mgos.decision_forecasts ADD COLUMN IF NOT EXISTS period_start timestamptz;
ALTER TABLE mgos.decision_forecasts ADD COLUMN IF NOT EXISTS period_end timestamptz;