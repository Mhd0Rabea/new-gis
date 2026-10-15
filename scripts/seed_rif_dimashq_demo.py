"""Seed MGOS feature classes with clearly fictional Rif Dimashq demo data.

Run with the Python environment bundled with ArcGIS Pro. The script is
idempotent: it inserts only demo business IDs that are not already present.
It never removes or updates user-authored rows.
"""

from __future__ import annotations

import argparse
import datetime as dt
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable, Sequence

import arcpy


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GDB = ROOT / "gis" / "MGOS" / "MGOS.gdb"
WGS84 = arcpy.SpatialReference(4326)
UTM37N = arcpy.SpatialReference(32637)
DEMO_NOTE = "بيانات تدريبية اصطناعية لا تمثل موقعا أو نشاطا عسكريا حقيقيا."


@dataclass(frozen=True)
class SeedLayer:
    relative_path: str
    business_id: str
    fields: tuple[str, ...]
    rows: tuple[tuple[Any, ...], ...]


def point(longitude: float, latitude: float) -> arcpy.PointGeometry:
    return arcpy.PointGeometry(
        arcpy.Point(longitude, latitude), WGS84
    ).projectAs(UTM37N)


def polyline(vertices: Sequence[tuple[float, float]]) -> arcpy.Polyline:
    geometry = arcpy.Polyline(
        arcpy.Array([arcpy.Point(x, y) for x, y in vertices]), WGS84
    )
    return geometry.projectAs(UTM37N)


def polygon(vertices: Sequence[tuple[float, float]]) -> arcpy.Polygon:
    ring = list(vertices)
    if ring[0] != ring[-1]:
        ring.append(ring[0])
    geometry = arcpy.Polygon(
        arcpy.Array([arcpy.Point(x, y) for x, y in ring]), WGS84
    )
    return geometry.projectAs(UTM37N)


def layers() -> tuple[SeedLayer, ...]:
    today = dt.datetime(2026, 10, 3)
    earlier = dt.datetime(2026, 9, 15)

    return (
        SeedLayer(
            "Base_Data/Military_Bases",
            "Base_ID",
            (
                "Base_ID", "Base_Name", "Base_Type", "Security_Level", "Status",
                "Soldiers_Count", "Vehicles_Count", "Commander", "Call_Sign",
                "Area_Size", "Elevation", "Power_Source", "Communication_Status",
                "Establish_Date", "Last_Update", "Notes", "SHAPE@",
            ),
            (
                (9101, "موقع ألف التدريبي - ريف دمشق", 5, 2, 2, 0, 0, "فريق التدريب", "DEMO-A", 1.2, 970.0, 1, 1, earlier, today, DEMO_NOTE, point(36.090, 33.410)),
                (9102, "موقع باء التدريبي - ريف دمشق", 5, 2, 2, 0, 0, "فريق التدريب", "DEMO-B", 0.9, 1120.0, 1, 1, earlier, today, DEMO_NOTE, point(36.255, 33.705)),
                (9103, "موقع جيم التدريبي - ريف دمشق", 5, 1, 2, 0, 0, "فريق التدريب", "DEMO-C", 1.1, 690.0, 1, 1, earlier, today, DEMO_NOTE, point(36.575, 33.555)),
            ),
        ),
        SeedLayer(
            "Base_Data/Checkpoints",
            "Checkpoint_ID",
            (
                "Checkpoint_ID", "Name", "Type", "Personnel", "Risk_Level", "Status",
                "Responsible_Unit", "Daily_Vehicles", "Working_Hours",
                "Camera_Available", "Created_Date", "Notes", "SHAPE@",
            ),
            (
                (9201, "نقطة تحقق تجريبية 1", 3, 0, 1, 2, "وحدة تدريب", 0, "08:00-16:00", 0, today, DEMO_NOTE, point(36.160, 33.490)),
                (9202, "نقطة تحقق تجريبية 2", 3, 0, 2, 2, "وحدة تدريب", 0, "08:00-16:00", 0, today, DEMO_NOTE, point(36.360, 33.630)),
                (9203, "نقطة تحقق تجريبية 3", 3, 0, 1, 2, "وحدة تدريب", 0, "08:00-16:00", 0, today, DEMO_NOTE, point(36.500, 33.445)),
            ),
        ),
        SeedLayer(
            "Operations/Operation_Sectors",
            "Sector_ID",
            (
                "Sector_ID", "Name", "Sector_Type", "Threat_Level", "Terrain_Type",
                "Troops_Count", "Checkpoints_Count", "Control_Level", "Field_Commander",
                "Security_Percentage", "Last_Operation", "Notes", "SHAPE@",
            ),
            (
                (9301, "قطاع التدريب الغربي", 2, 1, 2, 0, 0, 1, "منسق التدريب", 90.0, earlier, DEMO_NOTE,
                 polygon(((36.050, 33.360), (36.145, 33.360), (36.145, 33.445), (36.050, 33.445)))),
                (9302, "قطاع التدريب الشمالي", 3, 2, 3, 0, 0, 1, "منسق التدريب", 85.0, earlier, DEMO_NOTE,
                 polygon(((36.180, 33.665), (36.285, 33.665), (36.285, 33.745), (36.180, 33.745)))),
                (9303, "قطاع التدريب الشرقي", 2, 1, 1, 0, 0, 1, "منسق التدريب", 92.0, earlier, DEMO_NOTE,
                 polygon(((36.515, 33.500), (36.630, 33.500), (36.630, 33.585), (36.515, 33.585)))),
            ),
        ),
        SeedLayer(
            "Operations/Patrol_Routes",
            "Route_ID",
            (
                "Route_ID", "Name", "Type", "Risk_Level", "Length_KM", "Travel_Time",
                "Personnel_Count", "Vehicles_Count", "Road_Status", "Last_Patrol",
                "Notes", "SHAPE@",
            ),
            (
                (9401, "مسار تدريب ألف", 1, 1, 11.5, 35.0, 0, 0, 1, today, DEMO_NOTE,
                 polyline(((36.090, 33.410), (36.125, 33.440), (36.160, 33.490)))),
                (9402, "مسار تدريب باء", 1, 2, 13.2, 42.0, 0, 0, 2, today, DEMO_NOTE,
                 polyline(((36.255, 33.705), (36.305, 33.675), (36.360, 33.630)))),
                (9403, "مسار تدريب جيم", 2, 1, 9.8, 30.0, 0, 0, 1, today, DEMO_NOTE,
                 polyline(((36.500, 33.445), (36.545, 33.500), (36.575, 33.555)))),
            ),
        ),
        SeedLayer(
            "Intelligence/Threat_Areas",
            "Threat_ID",
            (
                "Threat_ID", "Name", "Threat_Type", "Level", "Enemy_Count", "Weapon_Type",
                "Intel_Source", "Last_Detected", "Danger_Percentage", "Night_Activity",
                "Notes", "SHAPE@",
            ),
            (
                (9501, "منطقة محاكاة منخفضة", 1, 1, 0, "لا يوجد - سيناريو تدريبي", 1, earlier, 20.0, 0, DEMO_NOTE,
                 polygon(((36.285, 33.395), (36.335, 33.395), (36.335, 33.435), (36.285, 33.435)))),
                (9502, "منطقة محاكاة متوسطة", 2, 2, 0, "لا يوجد - سيناريو تدريبي", 1, earlier, 45.0, 0, DEMO_NOTE,
                 polygon(((36.395, 33.615), (36.450, 33.615), (36.450, 33.655), (36.395, 33.655)))),
                (9503, "منطقة محاكاة جبلية", 3, 2, 0, "لا يوجد - سيناريو تدريبي", 1, earlier, 40.0, 0, DEMO_NOTE,
                 polygon(((36.075, 33.645), (36.130, 33.645), (36.130, 33.685), (36.075, 33.685)))),
            ),
        ),
        SeedLayer(
            "Logistics/Supply_Routes",
            "Route_ID",
            (
                "Route_ID", "Name", "Status", "Risk", "Length_KM", "Arrival_Time",
                "Convoys_Count", "Accessibility", "Last_Supply", "Notes", "SHAPE@",
            ),
            (
                (9601, "مسار إمداد تجريبي غرب", 1, 1, 14.0, 40.0, 0, 1, today, DEMO_NOTE,
                 polyline(((36.065, 33.390), (36.125, 33.420), (36.190, 33.445)))),
                (9602, "مسار إمداد تجريبي شمال", 1, 1, 12.4, 36.0, 0, 1, today, DEMO_NOTE,
                 polyline(((36.215, 33.720), (36.280, 33.690), (36.340, 33.650)))),
                (9603, "مسار إمداد تجريبي شرق", 2, 2, 15.7, 48.0, 0, 2, today, DEMO_NOTE,
                 polyline(((36.460, 33.465), (36.525, 33.500), (36.595, 33.535)))),
            ),
        ),
        SeedLayer(
            "Logistics/Military_Warehouses",
            "Warehouse_ID",
            (
                "Warehouse_ID", "Name", "Type", "Capacity", "Protection_Level",
                "Fill_Percentage", "Temperature", "Electricity", "Last_Inventory",
                "Notes", "SHAPE@",
            ),
            (
                (9701, "مستودع تدريب ألف", 1, 100.0, 1, 10.0, 18.0, 1, today, DEMO_NOTE, point(36.115, 33.435)),
                (9702, "مستودع تدريب باء", 2, 120.0, 1, 15.0, 17.0, 1, today, DEMO_NOTE, point(36.310, 33.665)),
                (9703, "مستودع تدريب جيم", 1, 90.0, 1, 5.0, 19.0, 1, today, DEMO_NOTE, point(36.545, 33.520)),
            ),
        ),
        SeedLayer(
            "Infrastructure/Airports",
            "Airport_ID",
            (
                "Airport_ID", "Name", "Type", "Runways", "Runway_Length",
                "Aircraft_Capacity", "Security_Level", "Airport_Status",
                "Last_Maintenance", "Notes", "SHAPE@",
            ),
            (
                (9801, "مرفق طيران افتراضي ألف", 3, 1, 600.0, 0, 1, 2, earlier, DEMO_NOTE, point(36.020, 33.520)),
                (9802, "مرفق طيران افتراضي باء", 3, 1, 550.0, 0, 1, 2, earlier, DEMO_NOTE, point(36.405, 33.735)),
                (9803, "مرفق طيران افتراضي جيم", 3, 1, 650.0, 0, 1, 2, earlier, DEMO_NOTE, point(36.650, 33.420)),
            ),
        ),
        SeedLayer(
            "Infrastructure/Communication_Towers",
            "Tower_ID",
            (
                "Tower_ID", "Name", "Coverage", "Tower_Type", "Frequency",
                "Power_Status", "Signal_Strength", "Status", "Last_Inspection",
                "Notes", "SHAPE@",
            ),
            (
                (9901, "برج اتصالات تدريبي غرب", 8.0, 1, 0.0, 1, 75.0, 1, today, DEMO_NOTE, point(36.105, 33.455)),
                (9902, "برج اتصالات تدريبي شمال", 10.0, 1, 0.0, 1, 80.0, 1, today, DEMO_NOTE, point(36.285, 33.725)),
                (9903, "برج اتصالات تدريبي شرق", 9.0, 1, 0.0, 1, 78.0, 1, today, DEMO_NOTE, point(36.610, 33.565)),
            ),
        ),
    )


def existing_ids(dataset: str, field: str) -> set[int]:
    with arcpy.da.SearchCursor(dataset, [field]) as cursor:
        return {int(row[0]) for row in cursor if row[0] is not None}


def seed_layer(gdb: Path, layer: SeedLayer, dry_run: bool) -> tuple[int, int]:
    dataset = str(gdb / Path(layer.relative_path))
    if not arcpy.Exists(dataset):
        raise RuntimeError(f"Dataset not found: {dataset}")

    present = existing_ids(dataset, layer.business_id)
    pending = [row for row in layer.rows if int(row[0]) not in present]
    if dry_run:
        return len(pending), len(layer.rows) - len(pending)

    with arcpy.da.InsertCursor(dataset, layer.fields) as cursor:
        for row in pending:
            cursor.insertRow(row)
    return len(pending), len(layer.rows) - len(pending)


def verify(gdb: Path, seed_layers: Iterable[SeedLayer]) -> None:
    errors: list[str] = []
    for layer in seed_layers:
        dataset = str(gdb / Path(layer.relative_path))
        expected = {int(row[0]) for row in layer.rows}
        found = existing_ids(dataset, layer.business_id)
        missing = sorted(expected - found)
        if missing:
            errors.append(f"{layer.relative_path}: missing demo IDs {missing}")
    if errors:
        raise RuntimeError("Seed verification failed:\n" + "\n".join(errors))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Add fictional Rif Dimashq demo features to MGOS.gdb"
    )
    parser.add_argument("--gdb", type=Path, default=DEFAULT_GDB)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not arcpy.Exists(str(args.gdb)):
        raise RuntimeError(f"File Geodatabase not found: {args.gdb}")

    seed_layers = layers()
    total_inserted = 0
    total_skipped = 0

    def process_layers() -> None:
        nonlocal total_inserted, total_skipped
        for layer in seed_layers:
            inserted, skipped = seed_layer(args.gdb, layer, args.dry_run)
            total_inserted += inserted
            total_skipped += skipped
            action = "would insert" if args.dry_run else "inserted"
            print(f"{layer.relative_path}: {action}={inserted}, existing={skipped}")

    if args.dry_run:
        process_layers()
    else:
        # Operation_Sectors, Patrol_Routes, and Supply_Routes participate in
        # geodatabase topology and therefore require an explicit edit session.
        editor = arcpy.da.Editor(str(args.gdb))
        editor.startEditing(False, False)
        editor.startOperation()
        try:
            process_layers()
            editor.stopOperation()
            editor.stopEditing(True)
        except Exception:
            editor.abortOperation()
            editor.stopEditing(False)
            raise
        verify(args.gdb, seed_layers)
    print(f"total_inserted={total_inserted}, total_existing={total_skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
