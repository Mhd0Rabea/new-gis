import { buildPdalFeatureExportCommand } from '../../src/processing/adapters/pdal.adapter';
describe('PDAL AI feature extraction',()=>{it('builds a fixed pipeline for the selected LAS in WGS 84',()=>{const command=buildPdalFeatureExportCommand('C:/tools','C:/input/selected.las','C:/work','job-1');expect(command.args[0]).toBe('pipeline');expect(command.args[1]).toMatch(/job-1-ai-pipeline\.json$/);expect(command.pipeline).toEqual(['C:/input/selected.las',expect.objectContaining({type:'filters.reprojection',out_srs:'EPSG:4326'}),expect.objectContaining({type:'writers.text',filename:expect.stringMatching(/job-1-ai-features\.csv$/)})]);});});


