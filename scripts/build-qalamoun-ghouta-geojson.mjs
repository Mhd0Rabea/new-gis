import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(
  process.argv[2] ?? resolve(scriptDirectory, '../gis/imports/qalamoun-ghouta-regions.geojson'),
);

const regions = [
  {
    id: 29056700,
    name: 'جبال القلمون / شمال سلسلة جبال لبنان الشرقية',
    sourceUrl: 'https://wikimapia.org/29056700/en/al-Qalamoun-Mountains-Northern-Anti-Lebanon',
  },
  {
    id: 27594876,
    name: 'الغوطة الغربية',
    sourceUrl: 'https://wikimapia.org/27594876/en/Western-Ghouta',
  },
  {
    id: 27594663,
    name: 'الغوطة الشرقية',
    sourceUrl: 'https://wikimapia.org/27594663/en/Eastern-Ghouta',
  },
];

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function loadPolygon(id) {
  const parameters = new URLSearchParams({
    key: 'example',
    function: 'place.getbyid',
    id: String(id),
    format: 'json',
    language: 'en',
    data_blocks: 'geometry',
  });
  const response = await fetch(`http://api.wikimapia.org/?${parameters}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Wikimapia request failed for ${id}: HTTP ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload.polygon) || payload.polygon.length < 3) {
    throw new Error(`Wikimapia did not return a usable polygon for ${id}.`);
  }
  const ring = payload.polygon.map(({ x, y }) => [Number(x), Number(y)]);
  const first = ring[0];
  const last = ring.at(-1);
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
  return ring;
}

const features = [];
for (const [index, region] of regions.entries()) {
  if (index > 0) await delay(11_000);
  const ring = await loadPolygon(region.id);
  features.push({
    type: 'Feature',
    id: `wikimapia-${region.id}`,
    properties: {
      source_id: String(region.id),
      name: region.name,
      notes: `حدود مرسومة من Wikimapia؛ للاستخدام المرجعي وليست حدوداً إدارية رسمية. المصدر: ${region.sourceUrl}`,
    },
    geometry: { type: 'Polygon', coordinates: [ring] },
  });
}

const collection = {
  type: 'FeatureCollection',
  name: 'Qalamoun and Ghouta reference regions',
  crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
  source: 'Wikimapia user-drawn place polygons',
  disclaimer_ar: 'هذه حدود مرجعية مرسومة من المستخدمين وليست حدوداً إدارية رسمية.',
  features,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(collection, null, 2)}\n`, 'utf8');
console.log(outputPath);
