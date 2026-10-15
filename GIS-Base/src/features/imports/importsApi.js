import api from '../../lib/axios.js';
export async function createImportBatch(layer,file,sourceName){const body=new FormData();body.append('file',file);body.append('sourceName',sourceName||file.name);return (await api.post('/imports/'+encodeURIComponent(layer),body)).data}
export async function listImportBatches(limit=25){return (await api.get('/imports',{params:{limit}})).data}
export async function loadImportBatch(id){return (await api.get('/imports/'+id)).data}
export async function saveImportDecisions(id,decisions){return (await api.patch('/imports/'+id+'/decisions',{decisions})).data}
export async function revalidateImportBatch(id){return (await api.post('/imports/'+id+'/revalidate',{})).data}
export async function commitImportBatch(id){return (await api.post('/imports/'+id+'/commit',{})).data}
export async function rejectImportBatch(id,reason){return (await api.post('/imports/'+id+'/reject',{reason})).data}
export async function deleteImportBatch(id){return (await api.delete('/imports/'+id)).data}
export function importReportUrl(id){return '/api/imports/'+id+'/report.csv'}
