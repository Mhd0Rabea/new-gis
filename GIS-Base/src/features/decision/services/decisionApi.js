import api from '../../../lib/axios.js';

export async function getRiskAssessments() { return (await api.get('/decision/risk')).data; }
export async function getRouteReadiness() { return (await api.get('/decision/routes')).data; }
export async function getTrackingSessions(limit = 100) { return (await api.get('/decision/alerts', { params: { limit } })).data; }
export async function getForecasts(limit = 100) { return (await api.get('/decision/forecast', { params: { limit } })).data; }
export async function getChanges(limit = 100) { return (await api.get('/decision/changes', { params: { limit } })).data; }
export async function startTracking(file) { const body = new FormData(); body.append('file', file); return (await api.post('/decision/tracking/start', body)).data; }
export async function stopTracking(id) { return (await api.post(`/decision/tracking/${encodeURIComponent(id)}/stop`)).data; }
export async function reviewTrackingAlert(sessionId, alertId, decision, note) { return (await api.post(`/decision/tracking/${encodeURIComponent(sessionId)}/alerts/${encodeURIComponent(alertId)}/review`, { decision, note })).data; }
export async function analyzeForecast(file) { const body = new FormData(); body.append('file', file); return (await api.post('/decision/forecast/analyze', body)).data; }
export async function reviewForecast(id, decision, note) { return (await api.post(`/decision/forecast/${encodeURIComponent(id)}/review`, { decision, note })).data; }
export async function analyzeChange(baseline, current) { const body = new FormData(); body.append('files', baseline); body.append('files', current); return (await api.post('/decision/change/analyze', body)).data; }
export async function reviewChange(id, decision, note) { return (await api.post(`/decision/change/${encodeURIComponent(id)}/review`, { decision, note })).data; }
