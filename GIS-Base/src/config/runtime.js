const suppliedConfig = globalThis.__GIS_RUNTIME_CONFIG__ ?? {};

function normalizeBaseUrl(...candidates) {
  const value = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim());
  return value.trim().replace(/[/]+$/, '');
}

export const runtimeConfig = Object.freeze({
  apiBaseUrl: normalizeBaseUrl(suppliedConfig.apiBaseUrl, import.meta.env.VITE_API_URL, '/api'),
  geoserverBaseUrl: normalizeBaseUrl(suppliedConfig.geoserverBaseUrl, import.meta.env.VITE_GEOSERVER_URL, '/geoserver'),
  geocoderBaseUrl: normalizeBaseUrl(
    suppliedConfig.geocoderBaseUrl,
    import.meta.env.VITE_GEOCODER_URL,
    'https://nominatim.openstreetmap.org',
  ),
});