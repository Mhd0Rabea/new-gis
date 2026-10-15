# Data Model

## mgos_staging.import_batches

- id uuid PK
- layer_name text NOT NULL
- source_name text NOT NULL
- file_name text NOT NULL
- file_sha256 text NOT NULL
- status: uploaded|review|ready|committed|rejected|failed
- totals jsonb NOT NULL
- created_by text NOT NULL
- created_at, reviewed_at, committed_at timestamptz
- error_message text

## mgos_staging.staged_features

- id uuid PK
- batch_id uuid FK CASCADE
- feature_index integer NOT NULL
- source_id text NULL
- original_properties jsonb NOT NULL
- normalized_properties jsonb NOT NULL
- geom geometry(Geometry,4326) NOT NULL
- validation_status: valid|warning|invalid
- duplicate_kind: none|exact|possible
- matched_feature_id uuid NULL
- matched_row_version bigint NULL
- transformations jsonb NOT NULL
- duplicate_candidates jsonb NOT NULL
- UNIQUE(batch_id, feature_index)

## mgos_staging.validation_issues

- id bigserial PK
- staged_feature_id uuid FK CASCADE
- severity: warning|error
- field_name text NULL
- code text NOT NULL
- message_ar text NOT NULL
- original_value jsonb NULL

## mgos_staging.import_decisions

- staged_feature_id uuid PK/FK
- action: create|update|skip
- decided_by text NOT NULL
- decided_at timestamptz NOT NULL

## Operational metadata

تضاف لكل طبقة: source_name text، source_id text، row_version bigint default 1، updated_by text. قيد فريد جزئي على (source_name, source_id). trigger يرفع row_version ويحدث updated_at لكل تعديل بما فيه ArcGIS Pro.

## State transitions

uploaded -> review -> ready -> committed  
review|ready -> rejected  
أي فشل اعتماد يعيد الحالة إلى ready مع error_message ولا يغير البيانات التشغيلية.
