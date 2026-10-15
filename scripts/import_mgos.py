"""Portable, idempotent MGOS File Geodatabase -> PostGIS importer."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import arcpy


SCRIPT_ROOT = Path(__file__).resolve().parents[1]
SQL_SEPARATOR = "-- mgos:statement"
IDENTIFIER_PATTERN = re.compile(r"^[a-z_][a-z0-9_]*$")


@dataclass(frozen=True)
class Dataset:
    canonical_name: str
    source: str
    kind: str
    group: str
    business_id: str
    required_text: str | None = None

    @property
    def target(self) -> str:
        return self.canonical_name.lower()

    @property
    def stage(self) -> str:
        return f"stg_{self.target}"


@dataclass(frozen=True)
class Settings:
    project_root: Path
    config_path: Path
    gdb: Path
    sde: Path
    schema: str
    srid: int
    report_path: Path
    datasets: tuple[Dataset, ...]
    migrations: tuple[Path, ...]
    deferred_constraints: tuple[tuple[str, str], ...]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import an MGOS geodatabase into PostGIS")
    parser.add_argument("--group", choices=("core", "all"), default="core")
    parser.add_argument("--project-root", type=Path)
    parser.add_argument("--config", type=Path)
    parser.add_argument("--gdb", type=Path)
    parser.add_argument("--sde", type=Path)
    parser.add_argument("--schema")
    parser.add_argument("--srid", type=int)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--dry-run", action="store_true", help="Validate without changing PostgreSQL")
    return parser.parse_args()


def resolve_path(value: str | Path, root: Path) -> Path:
    path = Path(value).expanduser()
    return path.resolve() if path.is_absolute() else (root / path).resolve()


def discover_unique(root: Path, pattern: str, expect_directory: bool) -> Path:
    ignored = {".git", ".agents", ".specify", "__pycache__"}
    candidates: list[Path] = []
    for candidate in root.rglob(pattern):
        if any(part in ignored for part in candidate.parts):
            continue
        if candidate.is_dir() == expect_directory:
            candidates.append(candidate.resolve())
    candidates = sorted(set(candidates))
    if len(candidates) == 1:
        return candidates[0]
    kind = "directory" if expect_directory else "file"
    rendered = "\n".join(f"  - {item}" for item in candidates) or "  (none)"
    raise RuntimeError(
        f"Expected exactly one {pattern} {kind} under {root}; found {len(candidates)}:\n"
        f"{rendered}\nProvide an explicit command option or environment variable."
    )


def choose_data_path(
    explicit: Path | None,
    env_name: str,
    configured: str | None,
    root: Path,
    pattern: str,
    expect_directory: bool,
) -> Path:
    value = explicit or os.getenv(env_name) or configured
    if value:
        return resolve_path(value, root)
    return discover_unique(root, pattern, expect_directory)


def load_settings(args: argparse.Namespace) -> Settings:
    root_value = args.project_root or os.getenv("MGOS_PROJECT_ROOT") or SCRIPT_ROOT
    project_root = Path(root_value).expanduser().resolve()
    config_value = args.config or os.getenv("MGOS_IMPORT_CONFIG") or "config/mgos-import.json"
    config_path = resolve_path(config_value, project_root)
    if not config_path.is_file():
        raise RuntimeError(f"Import configuration not found: {config_path}")
    raw = json.loads(config_path.read_text(encoding="utf-8"))

    schema = args.schema or os.getenv("MGOS_SCHEMA") or raw.get("schema", "mgos")
    if not IDENTIFIER_PATTERN.fullmatch(schema):
        raise RuntimeError("Schema must match ^[a-z_][a-z0-9_]*$")
    srid = args.srid or int(os.getenv("MGOS_SRID") or raw.get("srid", 32637))
    if srid <= 0:
        raise RuntimeError("SRID must be a positive integer")

    gdb = choose_data_path(
        args.gdb, "MGOS_GDB", raw.get("gdb"), project_root, "*.gdb", True
    )
    sde = choose_data_path(
        args.sde, "MGOS_SDE", raw.get("sde"), project_root, "*.sde", False
    )
    report_value = args.report or os.getenv("MGOS_IMPORT_REPORT") or raw["report"]
    report_path = resolve_path(report_value, project_root)

    datasets = tuple(
        Dataset(
            canonical_name=item["canonicalName"],
            source=item["source"],
            kind=item["kind"],
            group=item["group"],
            business_id=item["businessId"],
            required_text=item.get("requiredText"),
        )
        for item in raw["datasets"]
        if args.group == "all" or item["group"] == "core"
    )
    migration_values = raw["migrationGroups"][args.group]
    migrations = tuple(resolve_path(item, project_root) for item in migration_values)
    constraints = tuple(
        (item["table"], item["name"])
        for item in raw.get("deferredConstraints", [])
    )
    return Settings(
        project_root=project_root,
        config_path=config_path,
        gdb=gdb,
        sde=sde,
        schema=schema,
        srid=srid,
        report_path=report_path,
        datasets=datasets,
        migrations=migrations,
        deferred_constraints=constraints,
    )


def validate_paths(settings: Settings) -> None:
    errors: list[str] = []
    if not arcpy.Exists(str(settings.gdb)):
        errors.append(f"File Geodatabase not found: {settings.gdb}")
    if not arcpy.Exists(str(settings.sde)):
        errors.append(f"Database connection not found: {settings.sde}")
    for migration in settings.migrations:
        if not migration.is_file():
            errors.append(f"Migration not found: {migration}")
    for dataset in settings.datasets:
        source = settings.gdb / Path(dataset.source)
        if not arcpy.Exists(str(source)):
            errors.append(f"Source dataset not found: {dataset.canonical_name} ({source})")
    if errors:
        raise RuntimeError("\n".join(errors))


def validate_source_rows(gdb: Path, datasets: Iterable[Dataset]) -> None:
    errors: list[str] = []
    for dataset in datasets:
        fields = [dataset.business_id, "GlobalID"]
        if dataset.required_text:
            fields.append(dataset.required_text)
        seen_business: set[object] = set()
        seen_globalids: set[str] = set()
        source = str(gdb / Path(dataset.source))
        for row in arcpy.da.SearchCursor(source, fields):
            business_id, globalid = row[0], str(row[1]).strip().upper()
            if business_id is None:
                errors.append(f"{dataset.canonical_name}: null {dataset.business_id}")
            elif business_id in seen_business:
                errors.append(
                    f"{dataset.canonical_name}: duplicate {dataset.business_id}={business_id}"
                )
            seen_business.add(business_id)
            if not globalid:
                errors.append(f"{dataset.canonical_name}: missing GlobalID")
            elif globalid in seen_globalids:
                errors.append(f"{dataset.canonical_name}: duplicate GlobalID={globalid}")
            seen_globalids.add(globalid)
            if dataset.required_text and not str(row[2] or "").strip():
                errors.append(
                    f"{dataset.canonical_name}: blank {dataset.required_text} "
                    f"for {dataset.business_id}={business_id}"
                )
    if errors:
        raise RuntimeError("Source validation failed:\n" + "\n".join(errors))


def quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def qualified(schema: str, table: str) -> str:
    return f"{quote_identifier(schema)}.{quote_identifier(table)}"


def scalar(result: object) -> object:
    if isinstance(result, list):
        return result[0][0]
    return result


def validate_connection_schema(sql: arcpy.ArcSDESQLExecute, expected: str) -> None:
    actual = str(scalar(sql.execute("SELECT current_schema()")))
    if actual != expected:
        raise RuntimeError(
            f"The SDE connection default schema is '{actual}', but configuration expects "
            f"'{expected}'. Update the connection search_path or pass --schema {actual}."
        )


def render_sql(text: str, schema: str, srid: int) -> str:
    return text.replace("mgos.", f"{quote_identifier(schema)}.").replace("32637", str(srid))


def read_statements(path: Path, schema: str, srid: int) -> list[str]:
    rendered = render_sql(path.read_text(encoding="utf-8"), schema, srid)
    return [part.strip() for part in rendered.split(SQL_SEPARATOR) if part.strip()]


def execute_migrations(sql: arcpy.ArcSDESQLExecute, settings: Settings) -> None:
    sql.startTransaction()
    try:
        for path in settings.migrations:
            for statement in read_statements(path, settings.schema, settings.srid):
                result = sql.execute(statement)
                if result is False:
                    raise RuntimeError(f"Migration statement failed in {path.name}")
        sql.commitTransaction()
    except Exception:
        sql.rollbackTransaction()
        raise


def export_to_stage(settings: Settings, dataset: Dataset) -> int:
    source = str(settings.gdb / Path(dataset.source))
    output = str(settings.sde / dataset.stage)
    if dataset.kind == "feature":
        arcpy.conversion.ExportFeatures(source, output)
    else:
        arcpy.conversion.ExportTable(source, output)
    return int(arcpy.management.GetCount(source)[0])


def promote(sql: arcpy.ArcSDESQLExecute, settings: Settings, dataset: Dataset) -> int:
    function_name = qualified(settings.schema, "promote_staging")
    stage = qualified(settings.schema, dataset.stage).replace("'", "''")
    target = qualified(settings.schema, dataset.target).replace("'", "''")
    result = sql.execute(
        f"SELECT {function_name}('{stage}'::regclass, '{target}'::regclass)"
    )
    value = scalar(result)
    if not isinstance(value, (int, float)):
        raise RuntimeError(
            f"No promotion count returned for {dataset.canonical_name}; value={value!r}"
        )
    return int(value)


def verify(
    sql: arcpy.ArcSDESQLExecute,
    settings: Settings,
    dataset: Dataset,
    source_count: int,
) -> dict[str, object]:
    spatial_checks = (
        ", count(*) FILTER (WHERE NOT ST_IsValid(geom))"
        f", count(*) FILTER (WHERE ST_SRID(geom) <> {settings.srid})"
        if dataset.kind == "feature"
        else ", 0, 0"
    )
    result = sql.execute(
        "SELECT count(*), count(DISTINCT id)"
        f"{spatial_checks} FROM {qualified(settings.schema, dataset.target)}"
    )
    if not result or not isinstance(result, list):
        raise RuntimeError(f"Verification query failed for {dataset.canonical_name}")
    target_count, unique_ids, invalid_geometry, wrong_srid = map(int, result[0])
    verified = (
        source_count == target_count == unique_ids
        and invalid_geometry == 0
        and wrong_srid == 0
    )
    return {
        "canonical_name": dataset.canonical_name,
        "physical_name": dataset.target,
        "stage_name": dataset.stage,
        "source_count": source_count,
        "target_count": target_count,
        "unique_ids": unique_ids,
        "invalid_geometry": invalid_geometry,
        "wrong_srid": wrong_srid,
        "verified": verified,
    }


def validate_deferred_relationships(
    sql: arcpy.ArcSDESQLExecute, settings: Settings
) -> None:
    for table, constraint in settings.deferred_constraints:
        sql.execute(
            f"ALTER TABLE {qualified(settings.schema, table)} "
            f"VALIDATE CONSTRAINT {quote_identifier(constraint)}"
        )


def display_path(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def write_report(
    settings: Settings,
    group: str,
    rows: list[dict[str, object]],
    status: str,
) -> None:
    settings.report_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "group": group,
        "status": status,
        "schema": settings.schema,
        "srid": settings.srid,
        "config": display_path(settings.config_path, settings.project_root),
        "gdb": display_path(settings.gdb, settings.project_root),
        "sde": display_path(settings.sde, settings.project_root),
        "datasets": rows,
    }
    settings.report_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def main() -> int:
    args = parse_args()
    settings = load_settings(args)
    validate_paths(settings)
    validate_source_rows(settings.gdb, settings.datasets)

    sql = arcpy.ArcSDESQLExecute(str(settings.sde))
    validate_connection_schema(sql, settings.schema)
    postgres_version = str(scalar(sql.execute("SHOW server_version")))
    postgis_version = str(scalar(sql.execute("SELECT PostGIS_Lib_Version()")))

    if args.dry_run:
        print(
            f"Validated {len(settings.datasets)} datasets; "
            f"schema={settings.schema}, srid={settings.srid}."
        )
        print(f"  PostgreSQL: {postgres_version}")
        print(f"  PostGIS:    {postgis_version}")
        print(f"  project: {settings.project_root}")
        print(f"  config:  {settings.config_path}")
        print(f"  gdb:     {settings.gdb}")
        print(f"  sde:     {settings.sde}")
        for dataset in settings.datasets:
            print(
                f"  {dataset.canonical_name} -> "
                f"{settings.schema}.{dataset.target}"
            )
        return 0

    arcpy.env.overwriteOutput = True
    arcpy.env.preserveGlobalIds = False
    arcpy.env.outputCoordinateSystem = arcpy.SpatialReference(settings.srid)
    arcpy.env.extent = None
    execute_migrations(sql, settings)

    report_rows: list[dict[str, object]] = []
    try:
        for dataset in settings.datasets:
            print(
                f"Exporting {dataset.canonical_name} -> "
                f"{settings.schema}.{dataset.stage}"
            )
            source_count = export_to_stage(settings, dataset)
            promoted = promote(sql, settings, dataset)
            row = verify(sql, settings, dataset, source_count)
            row["upserted_rows"] = promoted
            report_rows.append(row)
            if not row["verified"]:
                raise RuntimeError(
                    f"Verification failed for {dataset.canonical_name}: {row}"
                )
            print(f"  verified: {source_count} row(s)")
        if args.group == "all":
            validate_deferred_relationships(sql, settings)
    except Exception:
        write_report(settings, args.group, report_rows, "failed")
        raise

    write_report(settings, args.group, report_rows, "passed")
    print(f"Import passed. Report: {settings.report_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)