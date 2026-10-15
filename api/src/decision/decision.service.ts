import { BadRequestException, Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../config/database.config';
import { ChangeCandidate, DecisionAlert, ForecastInsight, ReviewDecision, RiskAssessment, RiskFactor, RouteReadiness, TrackingPoint, TrackingSession } from './decision.types';

@Injectable()
export class DecisionService implements OnModuleInit {
  private readonly schema: string;
  private readonly toolsBin: string;
  private readonly workDir: string;

  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool, config: ConfigService) {
    this.schema = config.get<string>('DATABASE_SCHEMA', 'mgos');
    this.toolsBin = config.get<string>('PROCESSING_TOOLS_BIN', '').trim();
    this.workDir = path.resolve(config.get<string>('PROCESSING_WORK_DIR', '.processing-work'));
    if (!/^[a-z_][a-z0-9_]*$/.test(this.schema)) throw new Error('DATABASE_SCHEMA غير صالح');
  }

  async onModuleInit(): Promise<void> {
    const sql = await readFile(path.resolve(process.cwd(), '..', 'database', '009-decision-intelligence.sql'), 'utf8');
    await this.pool.query(sql.replace(/^\uFEFF/, ''));
  }

  async riskAssessments(limit = 100): Promise<RiskAssessment[]> {
    const sectors = await this.pool.query(`SELECT id, name, threat_level, security_percentage, checkpoints_count FROM ${this.table('operation_sectors')} ORDER BY name LIMIT $1`, [limit]);
    const routes = await this.pool.query(`SELECT id, name, risk_level, road_status, vehicles_count, personnel_count FROM ${this.table('patrol_routes')} ORDER BY name LIMIT $1`, [limit]);
    const now = new Date().toISOString();
    return [...sectors.rows.map((row) => this.sectorRisk(row, now)), ...routes.rows.map((row) => this.routeRisk(row, now))].sort((a, b) => b.score - a.score);
  }

  async routeReadiness(limit = 100): Promise<RouteReadiness[]> {
    const result = await this.pool.query(`SELECT id, name, risk_level, road_status, vehicles_count, personnel_count, travel_time FROM ${this.table('patrol_routes')} ORDER BY name LIMIT $1`, [limit]);
    const now = new Date().toISOString();
    return result.rows.map((row) => {
      const reportedRisk = this.level(row.risk_level);
      const risk = reportedRisk ?? 0;
      const personnel = this.number(row.personnel_count);
      const vehicles = this.number(row.vehicles_count);
      const roadPenalty = this.roadPenalty(row.road_status);
      const readiness = this.score(100 - risk * .5 - roadPenalty - (personnel === null ? 8 : personnel < 1 ? 18 : 0) - (vehicles === null ? 6 : vehicles < 1 ? 16 : 0));
      const constraints = [
        ...(roadPenalty ? ['حالة الطريق تقلل الجاهزية.'] : []),
        ...(reportedRisk === null ? ['مستوى المخاطر غير مدخل ولم يدخل في التقييم.'] : []),
        ...(personnel === null || vehicles === null ? ['بيانات الموارد غير مكتملة.'] : []),
      ];
      return { id: row.id, name: row.name || 'مسار بلا اسم', risk, readiness, travelTimeMinutes: this.number(row.travel_time), roadStatus: row.road_status || null, constraints, source: 'user-uploaded-layer' as const, calculatedAt: now, reviewRequired: true as const };
    }).sort((a, b) => b.readiness - a.readiness);
  }

  async trackingSessions(limit = 100): Promise<TrackingSession[]> {
    const result = await this.pool.query(`SELECT id FROM ${this.table('decision_tracking_sessions')} ORDER BY started_at DESC LIMIT $1`, [limit]);
    return Promise.all(result.rows.map((row) => this.trackingSession(row.id)));
  }

  async startTracking(sourceFileName: string, points: TrackingPoint[]): Promise<TrackingSession> {
    if (!sourceFileName || !Array.isArray(points) || points.length === 0) throw new BadRequestException('ملف التتبع لا يحتوي على نقاط صالحة.');
    const normalized = points.map((point, index) => this.validateTrackingPoint(point, index));
    const alerts = await this.deriveTrackingAlerts(normalized);
    const session: TrackingSession = { id: randomUUID(), sourceFileName, status: 'running', pointsCount: normalized.length, alerts, startedAt: new Date().toISOString() };
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`INSERT INTO ${this.table('decision_tracking_sessions')} (id, source_file_name, status, points_count, started_at) VALUES ($1,$2,$3,$4,$5)`, [session.id, session.sourceFileName, session.status, session.pointsCount, session.startedAt]);
      for (const alert of alerts) await client.query(`INSERT INTO ${this.table('decision_alerts')} (id, session_id, point_id, kind, reason, severity, event_at, review_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [alert.id, session.id, alert.pointId, alert.kind, alert.reason, alert.severity, alert.timestamp, alert.status]);
      await client.query('COMMIT');
      return session;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }

  async stopTracking(id: string): Promise<TrackingSession> {
    const result = await this.pool.query(`UPDATE ${this.table('decision_tracking_sessions')} SET status='stopped', stopped_at=now() WHERE id=$1 RETURNING id`, [id]);
    if (!result.rowCount) throw new NotFoundException('جلسة التتبع المطلوبة غير موجودة.');
    return this.trackingSession(id);
  }

  async reviewAlert(sessionId: string, alertId: string, decision: ReviewDecision, note?: string): Promise<TrackingSession> {
    const result = await this.pool.query(`UPDATE ${this.table('decision_alerts')} SET review_status=$3, review_note=$4, reviewed_at=now() WHERE session_id=$1 AND id=$2 RETURNING id`, [sessionId, alertId, decision, this.reviewNote(note)]);
    if (!result.rowCount) throw new NotFoundException('الإنذار المطلوب غير موجود.');
    return this.trackingSession(sessionId);
  }

  async forecasts(limit = 100): Promise<ForecastInsight[]> {
    const result = await this.pool.query(`SELECT * FROM ${this.table('decision_forecasts')} ORDER BY created_at DESC LIMIT $1`, [limit]);
    return result.rows.map((row) => this.forecastFromRow(row));
  }

  async analyzeForecast(sourceFileName: string, payload: unknown): Promise<ForecastInsight> {
    const document = payload as { metric?: unknown; scope?: unknown; period?: { start?: unknown; end?: unknown }; values?: unknown[] };
    if (!document || !Array.isArray(document.values) || document.values.length < 3) throw new BadRequestException('يجب أن يحتوي ملف المؤشرات على ثلاث قيم رقمية على الأقل.');
    const scope = typeof document.scope === 'string' ? document.scope.trim() : '';
    const periodStart = new Date(String(document.period?.start ?? ''));
    const periodEnd = new Date(String(document.period?.end ?? ''));
    if (!scope || Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime()) || periodEnd <= periodStart) throw new BadRequestException('يجب أن يتضمن الملف نطاقًا مكانيًا وفترة زمنية صالحة.');
    const values = document.values.map((value, index) => { const numeric = typeof value === 'object' && value !== null ? Number((value as { value?: unknown }).value) : Number(value); if (!Number.isFinite(numeric)) throw new BadRequestException(`قيمة المؤشر رقم ${index + 1} غير صالحة.`); return numeric; });
    const midpoint = Math.max(1, Math.floor(values.length / 2));
    const baseline = values.slice(0, midpoint).reduce((sum, value) => sum + value, 0) / midpoint;
    const slope = (values[values.length - 1] - values[0]) / (values.length - 1);
    const forecast = values[values.length - 1] + slope;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const deviation = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
    const confidence = this.confidence(Math.min(90, 45 + values.length * 5 - (Math.abs(mean) > 0 ? deviation / Math.abs(mean) * 25 : 20)));
    const constraints = ['توقع تعليمي قصير المدى يعتمد على اتجاه خطي.', ...(values.length < 6 ? ['عدد القراءات محدود ويخفض الثقة.'] : []), ...(confidence < .6 ? ['تذبذب القيم مرتفع.'] : [])];
    const insight: ForecastInsight = { id: randomUUID(), sourceFileName, metric: typeof document.metric === 'string' && document.metric.trim() ? document.metric.trim() : 'مؤشر غير مسمى', scope, periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString(), sampleCount: values.length, baseline: Number(baseline.toFixed(2)), forecast: Number(forecast.toFixed(2)), confidence, constraints, reviewStatus: 'pending', source: 'user-uploaded-layer' };
    await this.pool.query(`INSERT INTO ${this.table('decision_forecasts')} (id, source_file_name, metric, scope, period_start, period_end, sample_count, baseline, forecast, confidence, constraints, review_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [insight.id, insight.sourceFileName, insight.metric, insight.scope, insight.periodStart, insight.periodEnd, insight.sampleCount, insight.baseline, insight.forecast, insight.confidence, JSON.stringify(insight.constraints), insight.reviewStatus]);
    return insight;
  }

  async reviewForecast(id: string, decision: ReviewDecision, note?: string): Promise<ForecastInsight> {
    const result = await this.pool.query(`UPDATE ${this.table('decision_forecasts')} SET review_status=$2, review_note=$3, reviewed_at=now() WHERE id=$1 RETURNING *`, [id, decision, this.reviewNote(note)]);
    if (!result.rowCount) throw new NotFoundException('نتيجة التوقع المطلوبة غير موجودة.');
    return this.forecastFromRow(result.rows[0]);
  }

  async changes(limit = 100): Promise<ChangeCandidate[]> {
    const result = await this.pool.query(`SELECT *, CASE WHEN geometry IS NULL THEN NULL ELSE ST_AsGeoJSON(ST_Transform(geometry,4326))::json END AS geometry_json FROM ${this.table('decision_change_candidates')} ORDER BY created_at DESC LIMIT $1`, [limit]);
    return result.rows.map((row) => this.changeFromRow(row));
  }

  async analyzeChange(baseline: { originalname: string; buffer: Buffer }, current: { originalname: string; buffer: Buffer }): Promise<ChangeCandidate> {
    if (!this.toolsBin) throw new BadRequestException('أدوات تحليل الصور غير مضبوطة.');
    await mkdir(this.workDir, { recursive: true });
    const token = randomUUID(), baselinePath = path.join(this.workDir, `${token}-baseline.tif`), currentPath = path.join(this.workDir, `${token}-current.tif`), maskPath = path.join(this.workDir, `${token}-mask.tif`), polygonsPath = path.join(this.workDir, `${token}-changes.gpkg`), geoJsonPath = path.join(this.workDir, `${token}-changes.geojson`);
    try {
      await Promise.all([writeFile(baselinePath, baseline.buffer), writeFile(currentPath, current.buffer)]);
      const [before, after] = await Promise.all([this.rasterInfo(baselinePath), this.rasterInfo(currentPath)]);
      if (before.size?.[0] !== after.size?.[0] || before.size?.[1] !== after.size?.[1]) throw new BadRequestException('أبعاد الصورتين غير متطابقة. وحّد الدقة والامتداد قبل المقارنة.');
      if (before.coordinateSystem?.wkt !== after.coordinateSystem?.wkt || JSON.stringify(before.geoTransform) !== JSON.stringify(after.geoTransform)) throw new BadRequestException('نظام الإحداثيات أو الامتداد المكاني للصورتين غير متطابق.');
      const baselineMean = Number(before.bands?.[0]?.mean), currentMean = Number(after.bands?.[0]?.mean);
      if (!Number.isFinite(baselineMean) || !Number.isFinite(currentMean)) throw new BadRequestException('تعذر استخراج إحصاءات الحزمة الأولى من الصورتين.');
      const changePercent = baselineMean === 0 ? (currentMean === 0 ? 0 : 100) : (currentMean - baselineMean) / Math.abs(baselineMean) * 100;
      const confidence = this.confidence(85 - Math.min(30, Math.abs(changePercent) * .2));
      const geometry = await this.extractChangeGeometry(baselinePath, currentPath, maskPath, polygonsPath, geoJsonPath, Math.max(.01, Math.abs(baselineMean) * .1));
      const candidate: ChangeCandidate = { id: randomUUID(), baselineFileName: baseline.originalname, currentFileName: current.originalname, baselineMean: Number(baselineMean.toFixed(3)), currentMean: Number(currentMean.toFixed(3)), changePercent: Number(changePercent.toFixed(2)), confidence, summary: Math.abs(changePercent) < 1 ? 'لم يظهر تغير ملحوظ في متوسط الحزمة الأولى.' : `تغير مرشح في متوسط الحزمة الأولى بمقدار ${Math.abs(changePercent).toFixed(2)}%.`, geometry, reviewStatus: 'pending', source: 'user-uploaded-layer' };
      await this.pool.query(`INSERT INTO ${this.table('decision_change_candidates')} (id, baseline_file_name, current_file_name, baseline_mean, current_mean, change_percent, confidence, summary, geometry, review_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CASE WHEN $9::jsonb IS NULL THEN NULL ELSE ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($9::jsonb),4326),32637) END, $10)`, [candidate.id, candidate.baselineFileName, candidate.currentFileName, candidate.baselineMean, candidate.currentMean, candidate.changePercent, candidate.confidence, candidate.summary, candidate.geometry ? JSON.stringify(candidate.geometry) : null, candidate.reviewStatus]);
      return candidate;
    } finally { await Promise.all([baselinePath, currentPath, maskPath, polygonsPath, geoJsonPath].map((file) => unlink(file).catch(() => undefined))); }
  }

  async reviewChange(id: string, decision: ReviewDecision, note?: string): Promise<ChangeCandidate> {
    const result = await this.pool.query(`UPDATE ${this.table('decision_change_candidates')} SET review_status=$2, review_note=$3, reviewed_at=now() WHERE id=$1 RETURNING *, CASE WHEN geometry IS NULL THEN NULL ELSE ST_AsGeoJSON(ST_Transform(geometry,4326))::json END AS geometry_json`, [id, decision, this.reviewNote(note)]);
    if (!result.rowCount) throw new NotFoundException('نتيجة مقارنة الصور المطلوبة غير موجودة.');
    return this.changeFromRow(result.rows[0]);
  }

  private async trackingSession(id: string): Promise<TrackingSession> {
    const sessionResult = await this.pool.query(`SELECT * FROM ${this.table('decision_tracking_sessions')} WHERE id=$1`, [id]);
    if (!sessionResult.rowCount) throw new NotFoundException('جلسة التتبع المطلوبة غير موجودة.');
    const alertResult = await this.pool.query(`SELECT * FROM ${this.table('decision_alerts')} WHERE session_id=$1 ORDER BY event_at DESC`, [id]);
    const row = sessionResult.rows[0];
    return { id: row.id, sourceFileName: row.source_file_name, status: row.status, pointsCount: row.points_count, alerts: alertResult.rows.map((alert) => this.alertFromRow(alert)), startedAt: new Date(row.started_at).toISOString(), stoppedAt: row.stopped_at ? new Date(row.stopped_at).toISOString() : undefined };
  }

  private alertFromRow(row: Record<string, any>): DecisionAlert {
    return { id: row.id, pointId: row.point_id, kind: row.kind, reason: row.reason, severity: row.severity, timestamp: new Date(row.event_at).toISOString(), status: row.review_status, reviewNote: row.review_note ?? undefined, reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined, source: 'user-uploaded-layer' };
  }

  private forecastFromRow(row: Record<string, any>): ForecastInsight {
    return { id: row.id, sourceFileName: row.source_file_name, metric: row.metric, scope: row.scope, periodStart: new Date(row.period_start).toISOString(), periodEnd: new Date(row.period_end).toISOString(), sampleCount: row.sample_count, baseline: Number(row.baseline), forecast: Number(row.forecast), confidence: Number(row.confidence), constraints: Array.isArray(row.constraints) ? row.constraints : [], reviewStatus: row.review_status, reviewNote: row.review_note ?? undefined, reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined, source: 'user-uploaded-layer' };
  }

  private changeFromRow(row: Record<string, any>): ChangeCandidate {
    return { id: row.id, baselineFileName: row.baseline_file_name, currentFileName: row.current_file_name, baselineMean: Number(row.baseline_mean), currentMean: Number(row.current_mean), changePercent: Number(row.change_percent), confidence: Number(row.confidence), summary: row.summary, geometry: row.geometry_json ?? null, reviewStatus: row.review_status, reviewNote: row.review_note ?? undefined, reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined, source: 'user-uploaded-layer' };
  }

  private async extractChangeGeometry(baselinePath: string, currentPath: string, maskPath: string, polygonsPath: string, geoJsonPath: string, threshold: number): Promise<ChangeCandidate['geometry']> {
    const gdal = path.join(this.toolsBin, 'gdal.exe');
    const ogr = path.join(this.toolsBin, 'ogr2ogr.exe');
    await this.createChangeMask(baselinePath, currentPath, maskPath, threshold);
    await this.runCommand(gdal, ['raster', 'polygonize', '-b', '1', '--attribute-name', 'DN', '--output-format', 'GPKG', '--output-layer', 'changes', maskPath, polygonsPath], 'تعذر تحويل قناع التغير إلى مناطق مكانية.');
    await this.runCommand(ogr, ['-f', 'GeoJSON', '-t_srs', 'EPSG:4326', '-nlt', 'PROMOTE_TO_MULTI', '-where', 'DN = 1', geoJsonPath, polygonsPath, 'changes'], 'تعذر تحويل مناطق التغير إلى EPSG:4326.');
    const collection = JSON.parse(await readFile(geoJsonPath, 'utf8')) as { features?: Array<{ geometry?: { type?: string; coordinates?: any } }> };
    const coordinates: number[][][][] = [];
    for (const feature of collection.features ?? []) {
      if (feature.geometry?.type === 'Polygon' && Array.isArray(feature.geometry.coordinates)) coordinates.push(feature.geometry.coordinates);
      if (feature.geometry?.type === 'MultiPolygon' && Array.isArray(feature.geometry.coordinates)) coordinates.push(...feature.geometry.coordinates);
    }
    return coordinates.length ? { type: 'MultiPolygon', coordinates } : null;
  }

  private async createChangeMask(baselinePath: string, currentPath: string, maskPath: string, threshold: number): Promise<void> {
    const root = path.dirname(this.toolsBin);
    const appsDir = path.join(root, 'apps');
    const pythonDirectory = (await readdir(appsDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && /^Python\d+$/i.test(entry.name))
      .sort((a, b) => b.name.localeCompare(a.name))[0];
    if (!pythonDirectory) throw new BadRequestException('تعذر العثور على بيئة Python المرفقة مع أدوات GDAL.');
    const pythonHome = path.join(appsDir, pythonDirectory.name);
    const python = path.join(this.toolsBin, 'python.exe');
    const pythonPath = [pythonHome, path.join(pythonHome, 'Lib'), path.join(pythonHome, 'Lib', 'site-packages')].join(path.delimiter);
    await this.runCommand(python, [
      '-m', 'osgeo_utils.gdal_calc',
      '-A', baselinePath,
      '-B', currentPath,
      `--calc=absolute(A-B)>${threshold}`,
      `--outfile=${maskPath}`,
      '--type=Byte', '--NoDataValue=0', '--format=GTiff', '--overwrite',
    ], 'تعذر إنشاء قناع التغير من الصورتين.', { PYTHONHOME: pythonHome, PYTHONPATH: pythonPath });
  }

  private runCommand(executable: string, args: string[], message: string, extraEnvironment: Record<string, string> = {}): Promise<void> {
    const root = path.dirname(this.toolsBin);
    const env = { ...process.env, PROJ_DATA: path.join(root, 'share', 'proj'), GDAL_DATA: path.join(root, 'share', 'gdal'), ...extraEnvironment };
    return new Promise((resolve, reject) => execFile(executable, args, { env, maxBuffer: 32 * 1024 * 1024 }, (error) => error ? reject(new BadRequestException(message)) : resolve()));
  }
  private async deriveTrackingAlerts(points: TrackingPoint[]): Promise<DecisionAlert[]> {
    const spatial = await this.pool.query(`
      WITH input AS (
        SELECT (item.ordinality - 1)::integer AS idx,
               item.value->>'id' AS point_id,
               (item.value->>'longitude')::double precision AS longitude,
               (item.value->>'latitude')::double precision AS latitude
        FROM jsonb_array_elements($1::jsonb) WITH ORDINALITY AS item(value, ordinality)
      ), located AS (
        SELECT *, ST_Transform(ST_SetSRID(ST_Point(longitude, latitude), 4326), 32637) AS geom FROM input
      )
      SELECT p.idx,
             threat.name AS threat_name,
             threat.danger_percentage,
             route.name AS route_name,
             route.risk_level AS route_risk,
             route.personnel_count,
             route.vehicles_count
      FROM located p
      LEFT JOIN LATERAL (
        SELECT t.name, t.danger_percentage FROM ${this.table('threat_areas')} t
        WHERE ST_Intersects(t.geom, p.geom)
        ORDER BY t.danger_percentage DESC NULLS LAST LIMIT 1
      ) threat ON true
      LEFT JOIN LATERAL (
        SELECT r.name, r.risk_level, r.personnel_count, r.vehicles_count FROM ${this.table('patrol_routes')} r
        WHERE ST_DWithin(r.geom, p.geom, 250)
        ORDER BY r.geom <-> p.geom LIMIT 1
      ) route ON true
      ORDER BY p.idx`, [JSON.stringify(points)]);
    const context = new Map<number, Record<string, any>>(spatial.rows.map((row) => [Number(row.idx), row]));
    const alerts: DecisionAlert[] = [];
    const push = (point: TrackingPoint, index: number, kind: DecisionAlert['kind'], reason: string, severity: DecisionAlert['severity']) => alerts.push({ id: randomUUID(), pointId: point.id || String(index + 1), kind, reason, severity, timestamp: point.timestamp, status: 'pending', source: 'user-uploaded-layer' });
    points.forEach((point, index) => {
      const row = context.get(index);
      const danger = this.number(row?.danger_percentage);
      if ((danger !== null && danger >= 75) || (point.risk !== undefined && point.risk >= 75)) push(point, index, 'risk-zone-entry', row?.threat_name ? `دخول منطقة خطر: ${row.threat_name}.` : 'دخلت النقطة مستوى خطورة مرتفعًا.', (danger ?? point.risk ?? 0) >= 90 ? 'high' : 'medium');
      if (point.speed !== undefined && point.speed > 120) push(point, index, 'speed-limit', 'تجاوزت النقطة حد السرعة التشغيلي.', point.speed > 150 ? 'high' : 'medium');
      const routeRisk = this.level(row?.route_risk), personnel = this.number(row?.personnel_count), vehicles = this.number(row?.vehicles_count);
      if (row?.route_name && ((routeRisk !== null && routeRisk >= 75) || personnel === 0 || vehicles === 0)) push(point, index, 'low-readiness', `جاهزية منخفضة قرب المسار ${row.route_name}.`, routeRisk !== null && routeRisk >= 90 ? 'high' : 'medium');
      if (index > 0) {
        const delayMinutes = (new Date(point.timestamp).getTime() - new Date(points[index - 1].timestamp).getTime()) / 60000;
        if (delayMinutes > 15) push(point, index, 'delayed-update', `تأخر تحديث الموقع ${Math.round(delayMinutes)} دقيقة.`, delayMinutes > 60 ? 'high' : 'medium');
      }
    });
    return alerts;
  }
  private rasterInfo(file: string): Promise<any> {
    const executable = path.join(this.toolsBin, 'gdalinfo.exe');
    const root = path.dirname(this.toolsBin);
    const env = { ...process.env, PROJ_DATA: path.join(root, 'share', 'proj'), GDAL_DATA: path.join(root, 'share', 'gdal') };
    return new Promise((resolve, reject) => execFile(executable, ['-json', '-stats', file], { env, maxBuffer: 16 * 1024 * 1024 }, (error, stdout) => { if (error) { reject(new BadRequestException('تعذر تحليل إحدى الصورتين. تحقق من سلامة ملف GeoTIFF.')); return; } try { resolve(JSON.parse(stdout)); } catch { reject(new BadRequestException('تعذر قراءة بيانات الصورة المكانية.')); } }));
  }

  private validateTrackingPoint(point: TrackingPoint, index: number): TrackingPoint {
    const longitude = Number(point.longitude), latitude = Number(point.latitude);
    const timestamp = new Date(point.timestamp);
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180 || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 || Number.isNaN(timestamp.getTime())) throw new BadRequestException(`نقطة التتبع رقم ${index + 1} غير صالحة.`);
    const speed = point.speed === undefined ? undefined : Number(point.speed);
    const risk = point.risk === undefined ? undefined : this.score(Number(point.risk));
    if (speed !== undefined && !Number.isFinite(speed)) throw new BadRequestException(`سرعة نقطة التتبع رقم ${index + 1} غير صالحة.`);
    return { ...point, longitude, latitude, timestamp: timestamp.toISOString(), speed, risk };
  }

  private sectorRisk(row: Record<string, unknown>, now: string): RiskAssessment {
    const threat = this.level(row.threat_level), security = this.percent(row.security_percentage), checkpoints = this.number(row.checkpoints_count);
    return this.assessment(row, 'Operation_Sectors', [this.factor('threat', 'مستوى التهديد', threat, .55, threat !== null), this.factor('security', 'انخفاض التغطية الأمنية', security === null ? null : 100 - security, .35, security !== null), this.factor('checkpoints', 'تغطية الحواجز', checkpoints === null ? null : checkpoints < 1 ? 100 : 25, .10, checkpoints !== null)], now);
  }

  private routeRisk(row: Record<string, unknown>, now: string): RiskAssessment {
    const risk = this.level(row.risk_level), road = this.roadPenalty(row.road_status), vehicles = this.number(row.vehicles_count);
    return this.assessment(row, 'Patrol_Routes', [this.factor('risk', 'مستوى الخطورة المبلغ عنه', risk, .6, risk !== null), this.factor('road', 'حالة الطريق', road, .25, row.road_status != null && row.road_status !== ''), this.factor('vehicles', 'توافر المركبات', vehicles === null ? null : vehicles < 1 ? 100 : 15, .15, vehicles !== null)], now);
  }

  private assessment(row: Record<string, unknown>, layer: RiskAssessment['layer'], factors: RiskFactor[], calculatedAt: string): RiskAssessment {
    const active = factors.filter((factor) => factor.available), totalWeight = active.reduce((sum, factor) => sum + factor.weight, 0);
    const score = totalWeight ? this.score(active.reduce((sum, factor) => sum + factor.value * factor.weight, 0) / totalWeight) : 0;
    return { id: String(row.id), layer, name: String(row.name || 'عنصر بلا اسم'), score, confidence: Number(totalWeight.toFixed(2)), factors, source: 'user-uploaded-layer', calculatedAt, reviewRequired: true };
  }

  private factor(key: string, label: string, value: number | null, weight: number, available: boolean): RiskFactor { return { key, label, value: value ?? 0, weight, contribution: value === null ? 0 : this.score(value * weight), available }; }
  private number(value: unknown): number | null { if (value === null || value === undefined || value === '') return null; const numeric = Number(value); return Number.isFinite(numeric) ? numeric : null; }
  private percent(value: unknown): number | null { const numeric = this.number(value); return numeric === null ? null : this.score(numeric); }
  private score(value: number): number { return Math.round(Math.max(0, Math.min(100, value))); }
  private confidence(percent: number): number { return Number((this.score(percent) / 100).toFixed(2)); }
  private level(value: unknown): number | null { if (value === null || value === undefined || value === '') return null; const numeric = this.number(value); if (numeric !== null) return this.score(numeric); const text = String(value).trim().toLowerCase(); return ({ low: 25, medium: 55, high: 80, critical: 100, 'منخفض': 25, 'متوسط': 55, 'مرتفع': 80, 'حرج': 100 }[text] ?? null); }
  private roadPenalty(value: unknown): number { const text = String(value || '').trim().toLowerCase(); return ({ closed: 70, blocked: 70, poor: 45, damaged: 45, restricted: 25, 'مغلق': 70, 'متضرر': 45, 'مقيد': 25 }[text] ?? 0); }
  private reviewNote(note?: string): string | null { const normalized = note?.trim(); return normalized ? normalized : null; }
  private table(table: string): string { return `"${this.schema}"."${table}"`; }
}