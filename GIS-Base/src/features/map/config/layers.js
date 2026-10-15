const PROJECT_EXTENT = Object.freeze([35, 32, 43, 38]);

function defineLayer(definition) {
  return Object.freeze({
    workspace: 'mgos',
    extent4326: PROJECT_EXTENT,
    published: false,
    visibleByDefault: false,
    queryable: true,
    editable: true,
    fieldDomains: {},
    relatedTables: [],
    ...definition,
  });
}

export const layerConfigurations = Object.freeze([
  defineLayer({
    name: 'Military_Bases',
    label: 'القواعد العسكرية',
    wmsName: 'mgos:Military_Bases',
    geometryTypes: ['Point'],
    labelField: 'base_name',
    legend: { color: '#2563EB', fill: '#2563EB', symbol: 'point', geometryLabel: 'موقع' },
    published: true,
    visibleByDefault: true,
    editableFields: ['base_name', 'base_type', 'security_level', 'status', 'soldiers_count', 'vehicles_count', 'commander', 'call_sign', 'area_size', 'elevation', 'power_source', 'communication_status', 'notes'],
    fieldDomains: { base_type: 'Base_Type', status: 'Base_Status' },
    requiredFields: ['base_name'],
    filterableFields: ['base_id', 'base_name', 'status'],
    relatedTables: ['Military_Personnel', 'Military_Vehicles'],
  }),
  defineLayer({
    name: 'Checkpoints',
    label: 'الحواجز',
    wmsName: 'mgos:Checkpoints',
    geometryTypes: ['Point'],
    labelField: 'name',
    legend: { color: '#7C3AED', fill: '#7C3AED', symbol: 'point', geometryLabel: 'حاجز' },
    published: true,
    editableFields: ['name', 'type', 'personnel', 'risk_level', 'status', 'responsible_unit', 'daily_vehicles', 'working_hours', 'camera_available', 'notes'],
    fieldDomains: { type: 'Checkpoint_Type', camera_available: 'Yes_No' },
    requiredFields: ['name'],
    filterableFields: ['checkpoint_id', 'name', 'status'],
    relatedTables: ['Military_Personnel'],
  }),
  defineLayer({
    name: 'Operation_Sectors',
    label: 'القطاعات العسكرية',
    wmsName: 'mgos:Operation_Sectors',
    geometryTypes: ['Polygon', 'MultiPolygon'],
    labelField: 'name',
    legend: { color: '#B91C1C', fill: 'rgba(220, 38, 38, 0.32)', symbol: 'polygon', geometryLabel: 'منطقة' },
    published: true,
    editableFields: ['name', 'sector_type', 'threat_level', 'terrain_type', 'troops_count', 'checkpoints_count', 'control_level', 'field_commander', 'security_percentage', 'last_operation', 'notes'],
    fieldDomains: { sector_type: 'Sector_Type' },
    requiredFields: ['name'],
    filterableFields: ['sector_id', 'name', 'threat_level'],
    relatedTables: ['Military_Incidents'],
  }),
  defineLayer({
    name: 'Patrol_Routes',
    label: 'مسارات الدوريات',
    wmsName: 'mgos:Patrol_Routes',
    geometryTypes: ['LineString', 'MultiLineString'],
    labelField: 'name',
    legend: { color: '#EA580C', fill: '#EA580C', symbol: 'line', geometryLabel: 'مسار' },
    published: true,
    editableFields: ['name', 'type', 'risk_level', 'length_km', 'travel_time', 'personnel_count', 'vehicles_count', 'road_status', 'last_patrol', 'notes'],
    requiredFields: ['name'],
    filterableFields: ['route_id', 'name', 'risk_level'],
  }),
  defineLayer({
    name: 'Threat_Areas',
    label: 'مناطق التهديد',
    wmsName: 'mgos:Threat_Areas',
    published: true,
    labelField: 'name',
    legend: { color: '#DC2626', fill: 'rgba(220, 38, 38, 0.30)', symbol: 'polygon', geometryLabel: 'منطقة' },
    geometryTypes: ['Polygon', 'MultiPolygon'],
    editableFields: ['name', 'threat_type', 'level', 'enemy_count', 'weapon_type', 'intel_source', 'last_detected', 'danger_percentage', 'night_activity', 'notes'],
    requiredFields: ['name'],
    filterableFields: ['threat_id', 'name', 'level'],
    relatedTables: ['Intelligence_Reports'],
  }),
  defineLayer({
    name: 'Supply_Routes',
    label: 'طرق الإمداد',
    wmsName: 'mgos:Supply_Routes',
    published: true,
    labelField: 'name',
    legend: { color: '#0F766E', fill: '#0F766E', symbol: 'line', geometryLabel: 'مسار' },
    geometryTypes: ['LineString', 'MultiLineString'],
    editableFields: ['name', 'status', 'risk', 'length_km', 'arrival_time', 'convoys_count', 'accessibility', 'last_supply', 'notes'],
    requiredFields: ['name'],
    filterableFields: ['route_id', 'name', 'status'],
  }),
  defineLayer({
    name: 'Military_Warehouses',
    label: 'المستودعات العسكرية',
    wmsName: 'mgos:Military_Warehouses',
    published: true,
    labelField: 'name',
    legend: { color: '#A16207', fill: '#A16207', symbol: 'point', geometryLabel: 'موقع' },
    geometryTypes: ['Point'],
    editableFields: ['name', 'type', 'capacity', 'protection_level', 'fill_percentage', 'temperature', 'electricity', 'last_inventory', 'notes'],
    fieldDomains: { electricity: 'Yes_No' },
    requiredFields: ['name'],
    filterableFields: ['warehouse_id', 'name', 'type'],
    relatedTables: ['Weapons_Inventory'],
  }),
  defineLayer({
    name: 'Airports',
    label: 'المطارات',
    wmsName: 'mgos:Airports',
    published: true,
    labelField: 'name',
    legend: { color: '#0369A1', fill: '#0369A1', symbol: 'point', geometryLabel: 'موقع' },
    geometryTypes: ['Point'],
    editableFields: ['name', 'type', 'runways', 'runway_length', 'aircraft_capacity', 'security_level', 'airport_status', 'last_maintenance', 'notes'],
    requiredFields: ['name'],
    filterableFields: ['airport_id', 'name', 'airport_status'],
  }),
  defineLayer({
    name: 'Communication_Towers',
    label: 'أبراج الاتصال',
    wmsName: 'mgos:Communication_Towers',
    published: true,
    labelField: 'name',
    legend: { color: '#7E22CE', fill: '#7E22CE', symbol: 'point', geometryLabel: 'موقع' },
    geometryTypes: ['Point'],
    editableFields: ['name', 'coverage', 'tower_type', 'frequency', 'power_status', 'signal_strength', 'status', 'last_inspection', 'notes'],
    requiredFields: ['name'],
    filterableFields: ['tower_id', 'name', 'status'],
    relatedTables: ['Communication_Devices'],
  }),
]);

export const publishedLayers = Object.freeze(layerConfigurations.filter((layer) => layer.published));
export const defaultVisibleLayerNames = Object.freeze(publishedLayers.filter((layer) => layer.visibleByDefault).map((layer) => layer.name));

const layerByName = new Map(layerConfigurations.map((layer) => [layer.name, layer]));

export function getLayerConfiguration(name) {
  return layerByName.get(name);
}

export function requireLayerConfiguration(name) {
  const layer = getLayerConfiguration(name);
  if (!layer) throw new Error(`Unsupported layer: ${name}`);
  return layer;
}