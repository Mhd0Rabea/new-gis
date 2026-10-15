# Data Model

لا تضيف المرحلة جداول دائمة.

## Verification Run (artifact only)

- run_id، started_at، completed_at
- layer_name، feature_id، field_name
- original_value_redacted
- versions: before، after_arcgis، after_mgos، restored
- checks: privileges، api، wfs، conflict، restore
- status: passed، blocked، failed

لا يحفظ التقرير كلمة مرور أو DATABASE_URL أو محتوى حساسًا كاملًا.
