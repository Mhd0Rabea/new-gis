// Keep a stable application-side revision on remote tile URLs. This gives the
// browser a fresh cache key after a corrupted disk-cache entry while still
// allowing normal caching between map sessions.
export const basemapCacheRevision = '2026-10-12-1';

export function withBasemapCacheRevision(url) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}mgos_tile_rev=${basemapCacheRevision}`;
}

export const basemapConfigurations = Object.freeze([
  Object.freeze({ id: 'streets', label: 'شوارع', caption: 'OpenStreetMap', kind: 'osm' }),
  Object.freeze({
    id: 'satellite',
    label: 'ستلايت',
    caption: 'MapTiler Hybrid',
    kind: 'xyz',
    maptilerMapId: 'hybrid-v4',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    referenceUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: '<a href="https://www.esri.com/">Tiles © Esri</a>',
    maxZoom: 19,
  }),
  Object.freeze({
    id: 'terrain',
    label: 'تضاريس',
    caption: 'تضاريس وكنتور',
    kind: 'xyz',
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '<a href="https://www.openstreetmap.org/copyright">Map data © OpenStreetMap contributors</a>, SRTM | <a href="https://opentopomap.org/">Map style © OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
  }),
]);

export const defaultBasemapId = 'streets';
