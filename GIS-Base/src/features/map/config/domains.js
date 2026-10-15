export const arcGisDomains = Object.freeze({
  Base_Type: Object.freeze([
    Object.freeze({ value: 1, label: 'قاعدة برية', sourceLabel: 'Land Base' }),
    Object.freeze({ value: 2, label: 'قاعدة جوية', sourceLabel: 'Air Base' }),
    Object.freeze({ value: 3, label: 'قاعدة بحرية', sourceLabel: 'Naval Base' }),
    Object.freeze({ value: 4, label: 'مركز قيادة', sourceLabel: 'Command Center' }),
    Object.freeze({ value: 5, label: 'معسكر تدريب', sourceLabel: 'Training Camp' }),
  ]),
  Yes_No: Object.freeze([
    Object.freeze({ value: 1, label: 'نعم', sourceLabel: 'Yes' }),
    Object.freeze({ value: 0, label: 'لا', sourceLabel: 'No' }),
  ]),
  Base_Status: Object.freeze([
    Object.freeze({ value: 1, label: 'نشطة', sourceLabel: 'Active' }),
    Object.freeze({ value: 2, label: 'احتياط', sourceLabel: 'Reserve' }),
    Object.freeze({ value: 3, label: 'متضررة', sourceLabel: 'Damaged' }),
    Object.freeze({ value: 4, label: 'مغلقة', sourceLabel: 'Closed' }),
  ]),
  Checkpoint_Type: Object.freeze([
    Object.freeze({ value: 1, label: 'ثابت', sourceLabel: 'Fixed' }),
    Object.freeze({ value: 2, label: 'متحرك', sourceLabel: 'Mobile' }),
    Object.freeze({ value: 3, label: 'مؤقت', sourceLabel: 'Temporary' }),
    Object.freeze({ value: 4, label: 'حدودي', sourceLabel: 'Border' }),
  ]),
  Sector_Type: Object.freeze([
    Object.freeze({ value: 1, label: 'حضري', sourceLabel: 'Urban' }),
    Object.freeze({ value: 2, label: 'ريفي', sourceLabel: 'Rural' }),
    Object.freeze({ value: 3, label: 'جبلي', sourceLabel: 'Mountain' }),
    Object.freeze({ value: 4, label: 'صحراوي', sourceLabel: 'Desert' }),
    Object.freeze({ value: 5, label: 'حدودي', sourceLabel: 'Border' }),
  ]),
});

export function getArcGisDomainOptions(domainName) {
  return domainName ? arcGisDomains[domainName] ?? null : null;
}