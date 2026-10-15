import { listFeatures } from '../../map/services/featuresApi.js';
import api from '../../../lib/axios.js';
import { publishedLayers } from '../../map/config/layers.js';

export async function loadLayerSummaries(signal) {
  return Promise.all(publishedLayers.map(async (layer) => {
    try {
      const data = await listFeatures(layer.name, { limit: 100, signal });
      return { layer, features: data.features ?? [], total: data.metadata?.total ?? data.features?.length ?? 0, error: null };
    } catch (error) {
      return { layer, features: [], total: 0, error: error?.response?.data?.message ?? error?.message ?? 'تعذر تحميل الطبقة' };
    }
  }));
}

export async function loadLayerPage(layerName, options = {}) {
  return listFeatures(layerName, { limit: options.limit ?? 100, offset: options.offset ?? 0, filter: options.filter, signal: options.signal });
}

export async function loadStandaloneTable(tableName, signal) {
  const response = await api.get('/features/tables/' + encodeURIComponent(tableName), { signal });
  return response.data ?? [];
}
