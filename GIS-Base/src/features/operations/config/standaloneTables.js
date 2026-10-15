export const standaloneTables = Object.freeze([
  { name: 'Military_Personnel', label: 'الأفراد العسكريون', parentLayer: 'Military_Bases', parentField: 'base_idfk', parentLabel: 'القاعدة العسكرية' },
  { name: 'Military_Vehicles', label: 'الآليات العسكرية', parentLayer: 'Military_Bases', parentField: 'base_idfk', parentLabel: 'القاعدة العسكرية' },
  { name: 'Weapons_Inventory', label: 'مخزون الأسلحة', parentLayer: 'Military_Warehouses', parentField: 'warehouse_idfk', parentLabel: 'المستودع العسكري' },
  { name: 'Intelligence_Reports', label: 'التقارير الاستخباراتية', parentLayer: 'Threat_Areas', parentField: 'threat_idfk', parentLabel: 'منطقة التهديد' },
  { name: 'Military_Incidents', label: 'الحوادث العسكرية', parentLayer: 'Operation_Sectors', parentField: 'sector_idfk', parentLabel: 'القطاع العسكري' },
  { name: 'Communication_Devices', label: 'أجهزة الاتصال', parentLayer: 'Communication_Towers', parentField: 'tower_idfk', parentLabel: 'برج الاتصال' },
  { name: 'Maintenance_Records', label: 'سجلات الصيانة' },
  { name: 'System_Users', label: 'مستخدمو النظام' },
  { name: 'Audit_Log', label: 'سجل العمليات' },
  { name: 'Attachments_Metadata', label: 'بيانات المرفقات' },
]);
