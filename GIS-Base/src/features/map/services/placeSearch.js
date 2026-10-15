import { runtimeConfig } from '../../../config/runtime.js';

const resultCache = new Map();
let lastRequestAt = 0;

function waitForRateLimit(signal) {
  const remaining = Math.max(0, 1000 - (Date.now() - lastRequestAt));
  if (!remaining) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, remaining);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

export async function searchSyrianPlaces(query, { signal } = /** @type {{ signal?: AbortSignal }} */ ({})) {
  const normalized = query.trim().replace(/\s+/g, ' ');
  if (normalized.length < 2) return [];
  const cacheKey = normalized.toLocaleLowerCase('ar');
  if (resultCache.has(cacheKey)) return resultCache.get(cacheKey);

  await waitForRateLimit(signal);
  lastRequestAt = Date.now();
  const params = new URLSearchParams({
    q: normalized,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '6',
    countrycodes: 'sy',
    'accept-language': 'ar',
  });
  const response = await fetch(`${runtimeConfig.geocoderBaseUrl}/search?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Nominatim search failed with ${response.status}`);

  const payload = await response.json();
  const results = payload.map((item) => ({
    id: `${item.osm_type}-${item.osm_id}`,
    label: item.display_name,
    type: item.type,
    longitude: Number(item.lon),
    latitude: Number(item.lat),
    extent4326: Array.isArray(item.boundingbox)
      ? [Number(item.boundingbox[2]), Number(item.boundingbox[0]), Number(item.boundingbox[3]), Number(item.boundingbox[1])]
      : null,
  }));
  resultCache.set(cacheKey, results);
  return results;
}
