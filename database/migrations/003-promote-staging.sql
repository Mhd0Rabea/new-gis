CREATE OR REPLACE FUNCTION mgos.promote_staging(
    p_stage regclass,
    p_target regclass
)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
    v_columns text;
    v_select text;
    v_updates text;
    v_sql text;
    v_affected bigint;
    v_missing_globalids bigint;
BEGIN
    EXECUTE format(
        'SELECT count(*) FROM %s WHERE globalid IS NULL OR btrim(globalid::text) = ''''',
        p_stage
    ) INTO v_missing_globalids;

    IF v_missing_globalids > 0 THEN
        RAISE EXCEPTION '% contains % row(s) without GlobalID', p_stage, v_missing_globalids;
    END IF;

    WITH target_columns AS (
        SELECT
            target.attnum,
            target.attname,
            target.atttypid,
            target.atttypmod,
            CASE
                WHEN target.attname = 'id' THEN 'globalid'
                WHEN target.attname = 'geom' THEN 'shape'
                ELSE target.attname
            END AS source_name
        FROM pg_attribute AS target
        WHERE target.attrelid = p_target
          AND target.attnum > 0
          AND NOT target.attisdropped
          AND target.attname NOT IN ('created_at', 'updated_at')
    ), importable AS (
        SELECT target_columns.*
        FROM target_columns
        WHERE EXISTS (
            SELECT 1
            FROM pg_attribute AS source
            WHERE source.attrelid = p_stage
              AND source.attnum > 0
              AND NOT source.attisdropped
              AND source.attname = target_columns.source_name
        )
    )
    SELECT
        string_agg(format('%I', attname), ', ' ORDER BY attnum),
        string_agg(
            CASE
                WHEN atttypid = 'uuid'::regtype THEN
                    format(
                        'NULLIF(trim(both ''{}'' from %I::text), '''')::uuid',
                        source_name
                    )
                ELSE
                    format(
                        '%I::%s',
                        source_name,
                        pg_catalog.format_type(atttypid, atttypmod)
                    )
            END,
            ', ' ORDER BY attnum
        ),
        string_agg(
            CASE
                WHEN attname <> 'id' THEN
                    format('%I = EXCLUDED.%I', attname, attname)
            END,
            ', ' ORDER BY attnum
        )
    INTO v_columns, v_select, v_updates
    FROM importable;

    IF v_columns IS NULL OR position('id' IN v_columns) = 0 THEN
        RAISE EXCEPTION 'No importable id mapping between % and %', p_stage, p_target;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_attribute
        WHERE attrelid = p_target
          AND attname = 'updated_at'
          AND attnum > 0
          AND NOT attisdropped
    ) THEN
        v_updates := concat_ws(', ', v_updates, 'updated_at = CURRENT_TIMESTAMP');
    END IF;

    v_sql := format(
        'INSERT INTO %s (%s) SELECT %s FROM %s '
        'ON CONFLICT (id) DO UPDATE SET %s',
        p_target,
        v_columns,
        v_select,
        p_stage,
        v_updates
    );

    EXECUTE v_sql;
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    RETURN v_affected;
END
$$;
