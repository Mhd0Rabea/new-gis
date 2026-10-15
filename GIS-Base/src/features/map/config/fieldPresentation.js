const FIELD_LABELS = Object.freeze({
  id: 'المعرّف',
  objectid: 'معرّف الكائن',
  globalid: 'المعرّف العالمي',
  base_id: 'رقم القاعدة',
  base_name: 'اسم القاعدة',
  base_type: 'نوع القاعدة',
  security_level: 'مستوى الحماية',
  status: 'الحالة',
  soldiers_count: 'عدد الجنود',
  vehicles_count: 'عدد الآليات',
  commander: 'القائد',
  call_sign: 'رمز النداء',
  area_size: 'المساحة',
  elevation: 'الارتفاع',
  power_source: 'مصدر الطاقة',
  communication_status: 'حالة الاتصالات',
  establish_date: 'تاريخ التأسيس',
  last_update: 'آخر تحديث',
  checkpoint_id: 'رقم الحاجز',
  name: 'الاسم',
  type: 'النوع',
  personnel: 'عدد الأفراد',
  risk_level: 'مستوى الخطورة',
  responsible_unit: 'الوحدة المسؤولة',
  daily_vehicles: 'عدد الآليات اليومي',
  working_hours: 'ساعات العمل',
  camera_available: 'توفر كاميرا',
  created_date: 'تاريخ الإضافة',
  sector_id: 'رقم القطاع',
  sector_type: 'نوع القطاع',
  threat_level: 'مستوى التهديد',
  terrain_type: 'نوع التضاريس',
  troops_count: 'عدد القوات',
  checkpoints_count: 'عدد الحواجز',
  control_level: 'مستوى السيطرة',
  field_commander: 'القائد الميداني',
  security_percentage: 'نسبة الأمان',
  last_operation: 'آخر عملية',
  route_id: 'رقم المسار',
  length_km: 'الطول بالكيلومتر',
  travel_time: 'مدة الانتقال',
  personnel_count: 'عدد الأفراد',
  road_status: 'حالة الطريق',
  last_patrol: 'آخر دورية',
  threat_id: 'رقم التهديد',
  threat_type: 'نوع التهديد',
  level: 'المستوى',
  enemy_count: 'عدد العناصر المعادية',
  weapon_type: 'نوع السلاح',
  intel_source: 'مصدر المعلومات',
  last_detected: 'آخر رصد',
  danger_percentage: 'نسبة الخطورة',
  night_activity: 'النشاط الليلي',
  risk: 'الخطورة',
  arrival_time: 'وقت الوصول',
  convoys_count: 'عدد القوافل',
  accessibility: 'إمكانية الوصول',
  last_supply: 'آخر إمداد',
  warehouse_id: 'رقم المستودع',
  capacity: 'السعة',
  protection_level: 'مستوى الحماية',
  fill_percentage: 'نسبة الامتلاء',
  temperature: 'درجة الحرارة',
  electricity: 'توفر الكهرباء',
  last_inventory: 'آخر جرد',
  airport_id: 'رقم المطار',
  runways: 'عدد المدارج',
  runway_length: 'طول المدرج',
  aircraft_capacity: 'سعة الطائرات',
  airport_status: 'حالة المطار',
  last_maintenance: 'آخر صيانة',
  tower_id: 'رقم البرج',
  coverage: 'نطاق التغطية',
  tower_type: 'نوع البرج',
  frequency: 'التردد',
  power_status: 'حالة الطاقة',
  signal_strength: 'قوة الإشارة',
  last_inspection: 'آخر فحص',
  created_at: 'تاريخ الإنشاء',
  updated_at: 'تاريخ التحديث',
  notes: 'ملاحظات',
  personnel_id: 'رقم الفرد',
  full_name: 'الاسم الكامل',
  code_name: 'الاسم الرمزي',
  rank: 'الرتبة',
  specialty: 'الاختصاص',
  unit_name: 'اسم الوحدة',
  military_no: 'الرقم العسكري',
  base_idfk: 'معرّف القاعدة المرتبطة',
  checkpoint_idfk: 'معرّف الحاجز المرتبط',
  warehouse_idfk: 'معرّف المستودع المرتبط',
  join_date: 'تاريخ الانضمام',
  phone: 'رقم الهاتف',
  address: 'العنوان',
  vehicle_id: 'رقم الآلية',
  vehicle_name: 'اسم الآلية',
  vehicle_type: 'نوع الآلية',
  military_number: 'الرقم العسكري للآلية',
  fuel_consumption: 'استهلاك الوقود',
  readiness: 'الجاهزية',
  crew_count: 'عدد الطاقم',
  incident_id: 'رقم الحادثة',
  sector_idfk: 'معرّف القطاع المرتبط',
  threat_idfk: 'معرّف التهديد المرتبط',
  incident_type: 'نوع الحادثة',
  incident_date: 'تاريخ الحادثة',
  casualties: 'عدد الإصابات',
  fatalities: 'عدد الوفيات',
  description: 'الوصف',
});

const RELATED_TABLE_LABELS = Object.freeze({
  Military_Personnel: 'الأفراد العسكريون',
  Military_Vehicles: 'الآليات العسكرية',
  Military_Incidents: 'الحوادث العسكرية',
  Intelligence_Reports: 'التقارير الاستخباراتية',
  Weapons_Inventory: 'مخزون الأسلحة',
  Communication_Devices: 'أجهزة الاتصال',
  Maintenance_Records: 'سجلات الصيانة',
});

const DATE_FIELDS = new Set([
  'establish_date', 'last_update', 'created_date', 'last_operation', 'last_patrol',
  'last_detected', 'arrival_time', 'last_supply', 'last_inventory', 'last_maintenance',
  'last_inspection', 'join_date', 'incident_date', 'created_at', 'updated_at',
]);

const GEOMETRY_LABELS = Object.freeze({
  Point: 'نقطة',
  MultiPoint: 'متعدد النقاط',
  LineString: 'خط',
  MultiLineString: 'متعدد الخطوط',
  Polygon: 'مضلع',
  MultiPolygon: 'متعدد المضلعات',
});

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 20,
});

const dateFormatter = new Intl.DateTimeFormat('ar-SY-u-nu-latn', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Damascus',
});

export function getArabicFieldLabel(name) {
  return FIELD_LABELS[name] ?? name.replaceAll('_', ' ');
}

export function getArabicRelatedTableLabel(name) {
  return RELATED_TABLE_LABELS[name] ?? name.replaceAll('_', ' ');
}

export function getArabicGeometryLabel(type) {
  return GEOMETRY_LABELS[type] ?? type;
}

export function formatPropertyValue(name, value) {
  if (value === null || value === undefined || value === '') return { text: '—', code: false };
  if (typeof value === 'boolean') return { text: value ? 'نعم' : 'لا', code: false };

  if (DATE_FIELDS.has(name)) {
    const timestamp = Date.parse(String(value));
    if (!Number.isNaN(timestamp)) {
      return { text: dateFormatter.format(timestamp), code: true, kind: 'date', title: String(value) };
    }
  }

  if (typeof value === 'number') {
    return { text: numberFormatter.format(value), code: true, title: String(value) };
  }

  if (typeof value === 'object') {
    const text = JSON.stringify(value);
    return { text, code: true, title: text };
  }

  return { text: String(value), code: false };
}