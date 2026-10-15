import { normalizeImportProperties } from '../../src/imports/import-mappings';

describe('Staged spatial import contract', () => {
  it('normalizes ArcGIS aliases and coded-domain labels without accepting system fields', () => {
    const result = normalizeImportProperties('Military_Bases', {
      Base_ID: 17,
      Base_Name: 'معسكر الاختبار',
      Base_Type: 'تدريب - Training Camp',
      Security_Level: 'عالي',
      Status: 'نشط',
      Created_At: '2026-10-11T00:00:00Z',
    });
    expect(result.normalized).toMatchObject({ source_id: '17', base_name: 'معسكر الاختبار', base_type: 5, security_level: 3, status: 1 });
    expect(result.unknown).toEqual(['Created_At']);
  });

  it('rejects layers outside the operational registry', () => {
    expect(() => normalizeImportProperties('Unknown_Layer', {})).toThrow('الطبقة غير معتمدة.');
  });

  it('normalizes 10,000 feature property sets within the 60 second target', () => {
    const started = performance.now();
    for (let index = 0; index < 10_000; index += 1) {
      normalizeImportProperties('Military_Bases', { Base_ID: index, Base_Name: `قاعدة ${index}`, Base_Type: 'Training Camp', Status: 'Active' });
    }
    expect(performance.now() - started).toBeLessThan(60_000);
  });});
