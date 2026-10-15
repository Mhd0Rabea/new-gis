import api from '../../../lib/axios.js';
export async function listProcessingJobs(){return (await api.get('/processing/jobs')).data;}
export async function uploadProcessingFile(file){const body=new FormData();body.append('file',file);return (await api.post('/processing/files',body)).data;}
export async function createProcessingJob(payload){return (await api.post('/processing/jobs',payload)).data;}
export async function cancelProcessingJob(id){return (await api.post('/processing/jobs/'+encodeURIComponent(id)+'/cancel')).data;}
export async function retryProcessingJob(id){return (await api.post('/processing/jobs/'+encodeURIComponent(id)+'/retry')).data;}
export async function deleteProcessingJob(id){return (await api.delete('/processing/jobs/'+encodeURIComponent(id))).data;}
export async function listAiModels(){return (await api.get('/processing/ai/models')).data;}
export async function uploadAiModel(file){const body=new FormData();body.append('file',file);return (await api.post('/processing/ai/models',body)).data;}
export async function createAiClassification(payload){return (await api.post('/processing/ai/classifications',payload)).data;}
export async function getAiClassification(id){return (await api.get('/processing/ai/classifications/'+encodeURIComponent(id))).data;}
export async function getAiClassificationByJob(jobId){return (await api.get('/processing/ai/classifications/by-job/'+encodeURIComponent(jobId))).data;}
export async function reviewAiClassification(id,payload){return (await api.post('/processing/ai/classifications/'+encodeURIComponent(id)+'/reviews',payload)).data;}
export async function downloadAiArtifact(id,reviewed=false){const suffix=reviewed?'/artifact/reviewed':'/artifact';const response=await api.get('/processing/ai/classifications/'+encodeURIComponent(id)+suffix,{responseType:'blob'});const url=URL.createObjectURL(response.data);const link=document.createElement('a');link.href=url;link.download=reviewed?'ai-classification-reviewed.geojson':'ai-classification-temporary.geojson';link.click();URL.revokeObjectURL(url);}
