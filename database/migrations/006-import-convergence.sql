ALTER TABLE mgos_staging.staged_features
  ADD COLUMN IF NOT EXISTS transformations jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS duplicate_candidates jsonb NOT NULL DEFAULT '[]'::jsonb;
