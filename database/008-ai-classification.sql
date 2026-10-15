CREATE TABLE IF NOT EXISTS mgos.ai_model_versions (
 id text PRIMARY KEY, name text NOT NULL, version text NOT NULL, algorithm text NOT NULL,
 classes jsonb NOT NULL, feature_schema jsonb NOT NULL, model_metadata jsonb NOT NULL,
 training_dataset_id text NOT NULL, confidence_threshold numeric(4,3) NOT NULL CHECK (confidence_threshold BETWEEN 0.5 AND 0.95),
 status text NOT NULL CHECK (status IN ('candidate','approved','retired')), created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS mgos.ai_classification_results (
 id uuid PRIMARY KEY, job_id uuid NOT NULL REFERENCES mgos.processing_jobs(id) ON DELETE CASCADE,
 model_version_id text NOT NULL REFERENCES mgos.ai_model_versions(id), source_file text NOT NULL,
 artifact_file text NOT NULL, status text NOT NULL CHECK (status IN ('temporary','in_review','approved','rejected')) DEFAULT 'temporary',
 confidence_threshold numeric(4,3) NOT NULL, class_counts jsonb NOT NULL, low_confidence_count integer NOT NULL DEFAULT 0,
 warning text NOT NULL, metrics jsonb, baseline_metrics jsonb, created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz
);
CREATE TABLE IF NOT EXISTS mgos.ai_review_decisions (
 id uuid PRIMARY KEY, result_id uuid NOT NULL REFERENCES mgos.ai_classification_results(id) ON DELETE CASCADE,
 feature_id text, decision text NOT NULL CHECK (decision IN ('accept','correct','reject')),
 original_class text, reviewed_class text, reason varchar(500), reviewer text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (decision <> 'correct' OR reviewed_class IN ('ground','building','vegetation','vehicle','unknown'))
);
CREATE TABLE IF NOT EXISTS mgos.ai_evaluation_runs (
 id uuid PRIMARY KEY, result_id uuid NOT NULL REFERENCES mgos.ai_classification_results(id) ON DELETE CASCADE,
 dataset_id text NOT NULL, model_version_id text NOT NULL REFERENCES mgos.ai_model_versions(id), baseline_version text NOT NULL,
 confusion_matrix jsonb NOT NULL, per_class_metrics jsonb NOT NULL, macro_f1 numeric(5,4) NOT NULL,
 accuracy numeric(5,4) NOT NULL, abstention_rate numeric(5,4) NOT NULL, passed boolean NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE FUNCTION mgos.enforce_ai_review_before_approval() RETURNS trigger AS $$
BEGIN
 IF NEW.status='approved' AND NOT EXISTS (SELECT 1 FROM mgos.ai_review_decisions WHERE result_id=NEW.id AND decision IN ('accept','correct')) THEN
  RAISE EXCEPTION 'Human review is required before approval';
 END IF;
 RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS ai_review_before_approval ON mgos.ai_classification_results;
CREATE TRIGGER ai_review_before_approval BEFORE UPDATE OF status ON mgos.ai_classification_results FOR EACH ROW EXECUTE FUNCTION mgos.enforce_ai_review_before_approval();
CREATE INDEX IF NOT EXISTS ai_results_job_idx ON mgos.ai_classification_results(job_id);
CREATE INDEX IF NOT EXISTS ai_reviews_result_idx ON mgos.ai_review_decisions(result_id,created_at);
