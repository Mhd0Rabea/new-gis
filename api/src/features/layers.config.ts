export type ApiGeometryType =
  | 'Point'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon';

export interface RelatedTableDefinition {
  table: string;
  foreignKey: string;
}

export interface LayerDefinition {
  name: string;
  table: string;
  geometryTypes: readonly ApiGeometryType[];
  multiGeometry: boolean;
  editableFields: readonly string[];
  requiredFields: readonly string[];
  filterableFields: readonly string[];
  relatedTables: Readonly<Record<string, RelatedTableDefinition>>;
}

function defineLayer(definition: LayerDefinition): LayerDefinition {
  return Object.freeze(definition);
}

export const LAYERS: Readonly<Record<string, LayerDefinition>> = Object.freeze({
  Military_Bases: defineLayer({
    name: 'Military_Bases', table: 'military_bases', geometryTypes: ['Point'], multiGeometry: false,
    editableFields: ['base_name', 'base_type', 'security_level', 'status', 'soldiers_count', 'vehicles_count', 'commander', 'call_sign', 'area_size', 'elevation', 'power_source', 'communication_status', 'notes'],
    requiredFields: ['base_name'], filterableFields: ['base_id', 'base_name', 'status'],
    relatedTables: {
      Military_Personnel: { table: 'military_personnel', foreignKey: 'base_idfk' },
      Military_Vehicles: { table: 'military_vehicles', foreignKey: 'base_idfk' },
    },
  }),
  Checkpoints: defineLayer({
    name: 'Checkpoints', table: 'checkpoints', geometryTypes: ['Point'], multiGeometry: false,
    editableFields: ['name', 'type', 'personnel', 'risk_level', 'status', 'responsible_unit', 'daily_vehicles', 'working_hours', 'camera_available', 'notes'],
    requiredFields: ['name'], filterableFields: ['checkpoint_id', 'name', 'status'],
    relatedTables: { Military_Personnel: { table: 'military_personnel', foreignKey: 'checkpoint_idfk' } },
  }),
  Operation_Sectors: defineLayer({
    name: 'Operation_Sectors', table: 'operation_sectors', geometryTypes: ['Polygon', 'MultiPolygon'], multiGeometry: true,
    editableFields: ['name', 'sector_type', 'threat_level', 'terrain_type', 'troops_count', 'checkpoints_count', 'control_level', 'field_commander', 'security_percentage', 'last_operation', 'notes'],
    requiredFields: ['name'], filterableFields: ['sector_id', 'name', 'threat_level'],
    relatedTables: { Military_Incidents: { table: 'military_incidents', foreignKey: 'sector_idfk' } },
  }),
  Patrol_Routes: defineLayer({
    name: 'Patrol_Routes', table: 'patrol_routes', geometryTypes: ['LineString', 'MultiLineString'], multiGeometry: true,
    editableFields: ['name', 'type', 'risk_level', 'length_km', 'travel_time', 'personnel_count', 'vehicles_count', 'road_status', 'last_patrol', 'notes'],
    requiredFields: ['name'], filterableFields: ['route_id', 'name', 'risk_level'], relatedTables: {},
  }),
  Threat_Areas: defineLayer({
    name: 'Threat_Areas', table: 'threat_areas', geometryTypes: ['Polygon', 'MultiPolygon'], multiGeometry: true,
    editableFields: ['name', 'threat_type', 'level', 'enemy_count', 'weapon_type', 'intel_source', 'last_detected', 'danger_percentage', 'night_activity', 'notes'],
    requiredFields: ['name'], filterableFields: ['threat_id', 'name', 'level'],
    relatedTables: { Intelligence_Reports: { table: 'intelligence_reports', foreignKey: 'threat_idfk' } },
  }),
  Supply_Routes: defineLayer({
    name: 'Supply_Routes', table: 'supply_routes', geometryTypes: ['LineString', 'MultiLineString'], multiGeometry: true,
    editableFields: ['name', 'status', 'risk', 'length_km', 'arrival_time', 'convoys_count', 'accessibility', 'last_supply', 'notes'],
    requiredFields: ['name'], filterableFields: ['route_id', 'name', 'status'], relatedTables: {},
  }),
  Military_Warehouses: defineLayer({
    name: 'Military_Warehouses', table: 'military_warehouses', geometryTypes: ['Point'], multiGeometry: false,
    editableFields: ['name', 'type', 'capacity', 'protection_level', 'fill_percentage', 'temperature', 'electricity', 'last_inventory', 'notes'],
    requiredFields: ['name'], filterableFields: ['warehouse_id', 'name', 'type'],
    relatedTables: { Weapons_Inventory: { table: 'weapons_inventory', foreignKey: 'warehouse_idfk' } },
  }),
  Airports: defineLayer({
    name: 'Airports', table: 'airports', geometryTypes: ['Point'], multiGeometry: false,
    editableFields: ['name', 'type', 'runways', 'runway_length', 'aircraft_capacity', 'security_level', 'airport_status', 'last_maintenance', 'notes'],
    requiredFields: ['name'], filterableFields: ['airport_id', 'name', 'airport_status'], relatedTables: {},
  }),
  Communication_Towers: defineLayer({
    name: 'Communication_Towers', table: 'communication_towers', geometryTypes: ['Point'], multiGeometry: false,
    editableFields: ['name', 'coverage', 'tower_type', 'frequency', 'power_status', 'signal_strength', 'status', 'last_inspection', 'notes'],
    requiredFields: ['name'], filterableFields: ['tower_id', 'name', 'status'],
    relatedTables: { Communication_Devices: { table: 'communication_devices', foreignKey: 'tower_idfk' } },
  }),
});

export function getLayerDefinition(name: string): LayerDefinition | undefined {
  return LAYERS[name];
}
