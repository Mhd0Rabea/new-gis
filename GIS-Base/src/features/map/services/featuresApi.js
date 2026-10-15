import api from '../../../lib/axios.js';
import { requireLayerConfiguration } from '../config/layers.js';

function encodeFilter(layer, filter = {}) {
  const entries = Object.entries(filter).filter(([, value]) => value !== '' && value != null);
  const unsupported = entries.find(([field]) => !layer.filterableFields.includes(field));
  if (unsupported) throw new Error(`Unsupported filter field: ${unsupported[0]}`);
  return entries.map(([field, value]) => `${field}:${String(value)}`).join(',');
}

export async function listFeatures(layerName, options = {}) {
  const layer = requireLayerConfiguration(layerName);
  const filter = encodeFilter(layer, options.filter);
  const response = await api.get(`/features/${encodeURIComponent(layer.name)}`, {
    params: {
      bbox: options.bbox?.join(','),
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
      filter: filter || undefined,
    },
    signal: options.signal,
  });
  return response.data;
}

export async function getFeature(layerName, id, options = {}) {
  const layer = requireLayerConfiguration(layerName);
  const response = await api.get(`/features/${encodeURIComponent(layer.name)}/${encodeURIComponent(id)}`, {
    signal: options.signal,
  });
  return response.data;
}

export async function getRelatedRecords(layerName, id, table, options = {}) {
  const layer = requireLayerConfiguration(layerName);
  if (!layer.relatedTables.includes(table)) throw new Error(`Unsupported related table: ${table}`);
  const response = await api.get(`/features/${encodeURIComponent(layer.name)}/${encodeURIComponent(id)}/related/${encodeURIComponent(table)}`, {
    signal: options.signal,
  });
  return response.data;
}

export async function createFeature(layerName, feature) {
  const layer = requireLayerConfiguration(layerName);
  const response = await api.post(`/features/${encodeURIComponent(layer.name)}`, feature, {
    headers: { 'Content-Type': 'application/geo+json' },
  });
  return response.data;
}

export async function updateFeature(layerName, id, featurePatch) {
  const layer = requireLayerConfiguration(layerName);
  const response = await api.patch(`/features/${encodeURIComponent(layer.name)}/${encodeURIComponent(id)}`, featurePatch, {
    headers: { 'Content-Type': 'application/geo+json' },
  });
  return response.data;
}

export async function deleteFeature(layerName, id) {
  const layer = requireLayerConfiguration(layerName);
  await api.delete(`/features/${encodeURIComponent(layer.name)}/${encodeURIComponent(id)}`);
}
export async function importLayerFile(layerName,file){const layer=requireLayerConfiguration(layerName);const body=new FormData();body.append('file',file);return (await api.post('/features/'+encodeURIComponent(layer.name)+'/import',body)).data;}
