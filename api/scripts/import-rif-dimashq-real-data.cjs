const { createHash } = require('node:crypto');
const { copyFile, mkdir, readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const sourceDir = process.argv[2];
const outputDir = process.argv[3] || path.join(process.env.PROCESSING_INPUT_DIR || '', 'rif-dimashq-real');
if (!sourceDir || !outputDir) {
  throw new Error('Usage: node scripts/import-rif-dimashq-real-data.cjs <source-dir> <output-dir>');
}

const sourceName = 'OpenStreetMap 2026-10-13';
const radians = (value) => value * Math.PI / 180;
const segmentLengthKm = (coordinates) => coordinates.slice(1).reduce((sum, point, index) => {
  const previous = coordinates[index];
  const dLat = radians(point[1] - previous[1]);
  const dLon = radians(point[0] - previous[0]);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(previous[1])) * Math.cos(radians(point[1])) * Math.sin(dLon / 2) ** 2;
  return sum + 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}, 0);

const parseTrackSegments = (xml) => [...xml.matchAll(/<trkseg>([\s\S]*?)<\/trkseg>/g)].map((segment) => {
  const points = [...segment[1].matchAll(/<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g)]
    .map((match) => ({ latitude: Number(match[1]), longitude: Number(match[2]), timestamp: match[3].match(/<time>([^<]+)<\/time>/)?.[1] }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && point.timestamp && !Number.isNaN(new Date(point.timestamp).getTime()));
  const gaps = points.slice(1).map((point, index) => (new Date(point.timestamp) - new Date(points[index].timestamp)) / 60000);
  const chronological = gaps.every((gap) => gap >= 0);
  return { points, maxGapMinutes: gaps.length ? Math.max(...gaps) : 0, chronological };
}).filter((segment) => segment.points.length >= 3 && segment.chronological);

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function upsertRoute(client, route) {
  const geometry = JSON.stringify({ type: 'LineString', coordinates: route.coordinates });
  const existing = await client.query('SELECT id FROM mgos.patrol_routes WHERE source_name=$1 AND source_id=$2', [sourceName, `way/${route.id}`]);
  const values = [route.name, route.lengthKm, `طريق عام فعلي من OpenStreetMap (highway=${route.highway})؛ ليس مسار دورية معتمدًا.`, geometry, sourceName, `way/${route.id}`, 'open-data-import'];
  if (existing.rowCount) {
    await client.query("UPDATE mgos.patrol_routes SET name=$1,length_km=$2,notes=$3,geom=ST_Multi(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($4),4326),32637)),source_name=$5,source_id=$6,updated_by=$7,updated_at=now() WHERE id=$8", [...values, existing.rows[0].id]);
    return { id: existing.rows[0].id, action: 'updated' };
  }
  const inserted = await client.query("INSERT INTO mgos.patrol_routes(name,length_km,notes,geom,source_name,source_id,updated_by) VALUES($1,$2,$3,ST_Multi(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($4),4326),32637)),$5,$6,$7) RETURNING id", values);
  return { id: inserted.rows[0].id, action: 'inserted' };
}

async function upsertQuarry(client, quarry) {
  const geometry = JSON.stringify({ type: 'Polygon', coordinates: [quarry.coordinates] });
  const quarrySource = 'OpenStreetMap way 1524022274';
  const existing = await client.query('SELECT id FROM mgos.threat_areas WHERE source_name=$1 AND source_id=$2', [quarrySource, 'way/1524022274']);
  const values = [quarry.name, 'منطقة محجر مدنية فعلية من OpenStreetMap؛ أُدرجت كخطر موقعي تعليمي وليست تهديدًا عسكريًا.', geometry, quarrySource, 'way/1524022274', 'open-data-import'];
  if (existing.rowCount) {
    await client.query("UPDATE mgos.threat_areas SET name=$1,notes=$2,geom=ST_Multi(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($3),4326),32637)),source_name=$4,source_id=$5,updated_by=$6,updated_at=now() WHERE id=$7", [...values, existing.rows[0].id]);
    return { id: existing.rows[0].id, action: 'updated' };
  }
  const inserted = await client.query("INSERT INTO mgos.threat_areas(name,notes,geom,source_name,source_id,updated_by) VALUES($1,$2,ST_Multi(ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($3),4326),32637)),$4,$5,$6) RETURNING id", values);
  return { id: inserted.rows[0].id, action: 'inserted' };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const roadsDocument = JSON.parse(await readFile(path.join(sourceDir, 'osm-roads.json'), 'utf8'));
  const byName = new Map();
  for (const element of roadsDocument.elements || []) {
    if (element.type !== 'way' || !Array.isArray(element.geometry) || element.geometry.length < 2) continue;
    const name = element.tags?.['name:ar'] || element.tags?.name;
    if (!name || name === 'unmarked') continue;
    const coordinates = element.geometry.map((point) => [Number(point.lon), Number(point.lat)]);
    const candidate = { id: element.id, name, highway: element.tags?.highway || 'road', coordinates, lengthKm: Number(segmentLengthKm(coordinates).toFixed(3)) };
    if (!byName.has(name) || byName.get(name).lengthKm < candidate.lengthKm) byName.set(name, candidate);
  }
  const routes = [...byName.values()].sort((a, b) => b.lengthKm - a.lengthKm).slice(0, 4);
  if (routes.length < 3) throw new Error('Fewer than three distinct real roads were found.');

  const quarryDocument = JSON.parse(await readFile(path.join(sourceDir, 'osm-quarry-1524022274.json'), 'utf8'));
  const quarryWay = quarryDocument.elements.find((element) => element.type === 'way' && element.id === 1524022274);
  const nodes = new Map(quarryDocument.elements.filter((element) => element.type === 'node').map((node) => [node.id, [Number(node.lon), Number(node.lat)]]));
  const quarryCoordinates = quarryWay.nodes.map((id) => nodes.get(id)).filter(Boolean);
  if (quarryCoordinates.length < 4) throw new Error('The quarry polygon is incomplete.');
  const first = quarryCoordinates[0], last = quarryCoordinates[quarryCoordinates.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) quarryCoordinates.push(first);
  const quarry = { name: quarryWay.tags?.name || 'Marble Quarries Alrhiebeh', coordinates: quarryCoordinates };

  const gpx = await readFile(path.join(sourceDir, 'osm-public-tracks-rif-dimashq.gpx'), 'utf8');
  const segments = parseTrackSegments(gpx);
  const selectedTrack = segments.filter((segment) => segment.maxGapMinutes > 15).sort((a, b) => b.maxGapMinutes - a.maxGapMinutes || b.points.length - a.points.length)[0] || segments.sort((a, b) => b.points.length - a.points.length)[0];
  if (!selectedTrack) throw new Error('No chronological public GPS segment with at least three points was found.');
  const tracking = {
    source: { provider: 'OpenStreetMap public GPS trackpoints', url: 'https://api.openstreetmap.org/api/0.6/trackpoints', retrievedAt: '2026-10-13', bbox: [36.40, 33.50, 36.65, 33.65] },
    points: selectedTrack.points.map((point, index) => ({ id: `osm-gps-${index + 1}`, ...point })),
  };
  const trackingFile = path.join(outputDir, 'rif-dimashq-osm-tracking.json');
  await writeFile(trackingFile, JSON.stringify(tracking, null, 2));

  const weatherSource = JSON.parse(await readFile(path.join(sourceDir, 'open-meteo-september-2026.json'), 'utf8'));
  const weather = {
    metric: 'متوسط درجة الحرارة اليومية',
    scope: `ريف دمشق — ${weatherSource.latitude}, ${weatherSource.longitude}`,
    period: { start: `${weatherSource.daily.time[0]}T00:00:00+03:00`, end: `${weatherSource.daily.time.at(-1)}T23:59:59+03:00` },
    values: weatherSource.daily.time.map((timestamp, index) => ({ timestamp, value: weatherSource.daily.temperature_2m_mean[index] })),
    source: { provider: 'Open-Meteo Historical Weather API', model: 'ERA5/ERA5-Land reanalysis', retrievedAt: '2026-10-13', latitude: weatherSource.latitude, longitude: weatherSource.longitude },
  };
  const weatherFile = path.join(outputDir, 'rif-dimashq-weather-september-2026.json');
  await writeFile(weatherFile, JSON.stringify(weather, null, 2));

  const rasterNames = ['rif-dimashq-red-2025-09-11.tif', 'rif-dimashq-red-2026-09-13.tif'];
  for (const name of rasterNames) await copyFile(path.join(sourceDir, name), path.join(outputDir, name));

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false });
  const client = await pool.connect();
  const importedRoutes = [];
  let importedQuarry;
  try {
    await client.query('BEGIN');
    for (const route of routes) importedRoutes.push({ sourceId: route.id, name: route.name, ...(await upsertRoute(client, route)) });
    importedQuarry = await upsertQuarry(client, quarry);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    region: 'Rif Dimashq Governorate, Syria',
    coordinateContract: { source: 'EPSG:4326', storage: 'EPSG:32637' },
    routes: importedRoutes,
    quarry: { sourceId: 1524022274, name: quarry.name, ...importedQuarry },
    tracking: { file: path.basename(trackingFile), points: tracking.points.length, maxGapMinutes: selectedTrack.maxGapMinutes },
    metric: { file: path.basename(weatherFile), values: weather.values.length },
    rasters: await Promise.all(rasterNames.map(async (name) => ({ file: name, sha256: await sha256(path.join(outputDir, name)) }))),
    sources: [
      { name: 'OpenStreetMap', license: 'ODbL', url: 'https://www.openstreetmap.org/copyright' },
      { name: 'Open-Meteo Historical Weather API', license: 'CC BY 4.0', url: 'https://open-meteo.com/en/docs/historical-weather-api' },
      { name: 'Sentinel-2 C1 L2A via Earth Search', license: 'Copernicus Sentinel open data', url: 'https://earth-search.aws.element84.com/v1' },
    ],
    review: 'The imported roads are public roads, not approved patrol routes. The quarry is a civilian site hazard, not a military threat. Operational fields remain null pending human review.',
  };
  await writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify(manifest, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
