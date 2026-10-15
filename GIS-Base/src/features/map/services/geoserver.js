import { runtimeConfig } from '../../../config/runtime.js';
import { requireLayerConfiguration } from '../config/layers.js';

export function getWorkspaceWmsUrl() {
  return runtimeConfig.geoserverBaseUrl + '/mgos/wms';
}

export function getCapabilitiesUrl() {
  const params = new URLSearchParams({ service: 'WMS', version: '1.3.0', request: 'GetCapabilities' });
  return getWorkspaceWmsUrl() + '?' + params;
}

export function getLegendGraphicUrl(layerName) {
  const layer = requireLayerConfiguration(layerName);
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.3.0',
    request: 'GetLegendGraphic',
    format: 'image/png',
    transparent: 'true',
    layer: layer.wmsName,
  });
  return getWorkspaceWmsUrl() + '?' + params;
}

function safeColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(value ?? '') ? value.toUpperCase() : fallback;
}

export function buildLayerStyleSld(layerName, requestedColor) {
  const layer = requireLayerConfiguration(layerName);
  const color = safeColor(requestedColor, layer.legend?.color ?? '#4FE0BD');
  const symbol = layer.legend?.symbol ?? 'point';
  let symbolizer;

  if (symbol === 'line') {
    symbolizer = '<sld:LineSymbolizer><sld:Stroke><sld:CssParameter name="stroke">' + color + '</sld:CssParameter><sld:CssParameter name="stroke-width">4</sld:CssParameter><sld:CssParameter name="stroke-linecap">round</sld:CssParameter></sld:Stroke></sld:LineSymbolizer>';
  } else if (symbol === 'polygon') {
    symbolizer = '<sld:PolygonSymbolizer><sld:Fill><sld:CssParameter name="fill">' + color + '</sld:CssParameter><sld:CssParameter name="fill-opacity">0.28</sld:CssParameter></sld:Fill><sld:Stroke><sld:CssParameter name="stroke">' + color + '</sld:CssParameter><sld:CssParameter name="stroke-width">2.5</sld:CssParameter></sld:Stroke></sld:PolygonSymbolizer>';
  } else {
    symbolizer = '<sld:PointSymbolizer><sld:Graphic><sld:Mark><sld:WellKnownName>circle</sld:WellKnownName><sld:Fill><sld:CssParameter name="fill">' + color + '</sld:CssParameter></sld:Fill><sld:Stroke><sld:CssParameter name="stroke">#FFFFFF</sld:CssParameter><sld:CssParameter name="stroke-width">1.5</sld:CssParameter></sld:Stroke></sld:Mark><sld:Size>12</sld:Size></sld:Graphic></sld:PointSymbolizer>';
  }

  return '<?xml version="1.0" encoding="UTF-8"?>'
    + '<sld:StyledLayerDescriptor version="1.0.0" xmlns:sld="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">'
    + '<sld:NamedLayer><sld:Name>' + layer.wmsName + '</sld:Name><sld:UserStyle><sld:FeatureTypeStyle><sld:Rule>'
    + symbolizer
    + '</sld:Rule></sld:FeatureTypeStyle></sld:UserStyle></sld:NamedLayer></sld:StyledLayerDescriptor>';
}

export function buildCqlFilter(layerName, filter = {}) {
  const layer = requireLayerConfiguration(layerName);
  const entries = Object.entries(filter).filter(([, value]) => value !== '' && value !== null && value !== undefined);
  const unsupported = entries.find(([field]) => !layer.filterableFields.includes(field));
  if (unsupported) throw new Error('Unsupported filter field: ' + unsupported[0]);
  return entries.map(([field, value]) => {
    const escaped = String(value).replaceAll("'", "''");
    return field + " = '" + escaped + "'";
  }).join(' AND ');
}

export function getFeatureInfoUrl({ layerName, bbox, width, height, x, y, crs = 'EPSG:3857' }) {
  const layer = requireLayerConfiguration(layerName);
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.3.0',
    request: 'GetFeatureInfo',
    layers: layer.wmsName,
    query_layers: layer.wmsName,
    info_format: 'application/json',
    feature_count: '10',
    crs,
    bbox: bbox.join(','),
    width: String(width),
    height: String(height),
    i: String(x),
    j: String(y),
  });
  return getWorkspaceWmsUrl() + '?' + params;
}
