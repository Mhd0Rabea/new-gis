CREATE TABLE IF NOT EXISTS mgos.processing_jobs (
 id uuid PRIMARY KEY, operation text NOT NULL, status text NOT NULL CHECK (status IN ('pending','running','completed','failed','cancelled')),
 input_name text NOT NULL, output_name text, progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
 error_message text, result jsonb, parameters jsonb, created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS processing_jobs_status_created_idx ON mgos.processing_jobs(status, created_at DESC);
