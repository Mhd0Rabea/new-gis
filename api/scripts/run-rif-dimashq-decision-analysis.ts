import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DecisionService } from '../src/decision/decision.service';
import { TrackingPoint } from '../src/decision/decision.types';

const inputDir = process.argv[2];
if (!inputDir) throw new Error('Usage: node -r ts-node/register scripts/run-rif-dimashq-decision-analysis.ts <input-dir>');

const trackingName = 'rif-dimashq-osm-tracking.json';
const weatherName = 'rif-dimashq-weather-september-2026.json';
const baselineName = 'rif-dimashq-red-2025-09-11.tif';
const currentName = 'rif-dimashq-red-2026-09-13.tif';

async function main(): Promise<void> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });
  const service = new DecisionService(pool, new ConfigService(process.env));
  await service.onModuleInit();
  try {
    const trackingDocument = JSON.parse(await readFile(path.join(inputDir, trackingName), 'utf8')) as { points: TrackingPoint[] };
    let tracking = (await service.trackingSessions(100)).find((item) => item.sourceFileName === trackingName);
    if (!tracking) tracking = await service.startTracking(trackingName, trackingDocument.points);
    if (tracking.status === 'running') tracking = await service.stopTracking(tracking.id);

    const weatherDocument = JSON.parse(await readFile(path.join(inputDir, weatherName), 'utf8')) as unknown;
    let forecast = (await service.forecasts(100)).find((item) => item.sourceFileName === weatherName);
    if (!forecast) forecast = await service.analyzeForecast(weatherName, weatherDocument);

    let change = (await service.changes(100)).find((item) => item.baselineFileName === baselineName && item.currentFileName === currentName);
    if (!change) {
      change = await service.analyzeChange(
        { originalname: baselineName, buffer: await readFile(path.join(inputDir, baselineName)) },
        { originalname: currentName, buffer: await readFile(path.join(inputDir, currentName)) },
      );
    }

    const routes = await service.routeReadiness(100);
    const risks = await service.riskAssessments(100);
    console.log(JSON.stringify({
      tracking: { id: tracking.id, status: tracking.status, points: tracking.pointsCount, alerts: tracking.alerts.length, reviewStates: [...new Set(tracking.alerts.map((alert) => alert.status))] },
      forecast: { id: forecast.id, metric: forecast.metric, values: forecast.sampleCount, reviewStatus: forecast.reviewStatus },
      change: { id: change.id, changePercent: change.changePercent, hasGeometry: Boolean(change.geometry), reviewStatus: change.reviewStatus },
      routes: routes.map((route) => ({ id: route.id, name: route.name, readiness: route.readiness, constraints: route.constraints })),
      riskAssessments: risks.length,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
