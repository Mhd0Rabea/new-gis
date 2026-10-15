import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { Pool, PoolClient } from 'pg';
import { DATABASE_POOL } from '../config/database.config';
import { FeatureInputDto, FeaturePatchDto, ListFeaturesQueryDto } from './dto/feature.dto';
import { getLayerDefinition, LayerDefinition } from './layers.config';

export interface FeatureCollection {
  type: 'FeatureCollection';
  features: unknown[];
  metadata: { limit: number; offset: number; returned: number; total: number };
}

@Injectable()
export class FeaturesService {
  private readonly schema: string;

  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    config: ConfigService,
  ) {
    this.schema = config.get<string>('DATABASE_SCHEMA', 'mgos');
    if (!/^[a-z_][a-z0-9_]*$/.test(this.schema)) {
      throw new Error('DATABASE_SCHEMA must be a lowercase PostgreSQL identifier');
    }
  }

  async list(layerName: string, query: ListFeaturesQueryDto): Promise<FeatureCollection> {
    const layer = this.layer(layerName);
    const values: unknown[] = [];
    const conditions: string[] = [];

    if (query.bbox) {
      const bbox = query.bbox.split(',').map(Number);
      if (bbox.length !== 4 || bbox.some((value) => !Number.isFinite(value)) || bbox[0] >= bbox[2] || bbox[1] >= bbox[3]) {
        throw new BadRequestException('bbox must be minX,minY,maxX,maxY in EPSG:4326');
      }
      values.push(...bbox);
      conditions.push(`t.geom && ST_Transform(ST_MakeEnvelope($1, $2, $3, $4, 4326), 32637)`);
    }

    for (const [field, value] of this.parseFilters(query.filter, layer)) {
      values.push(value);
      conditions.push(`t.${this.identifier(field)}::text = $${values.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const countSql = `SELECT count(*)::int AS total FROM ${this.table(layer)} AS t ${where}`;
    const countResult = await this.query(countSql, values);

    values.push(query.limit, query.offset);
    const listSql = `
      SELECT ${this.featureJson('t')} AS feature
      FROM ${this.table(layer)} AS t
      ${where}
      ORDER BY t.id
      LIMIT $${values.length - 1} OFFSET $${values.length}`;
    const rows = await this.query(listSql, values);
    const features = rows.rows.map((row: { feature: unknown }) => row.feature);
    return {
      type: 'FeatureCollection',
      features,
      metadata: { limit: query.limit, offset: query.offset, returned: features.length, total: countResult.rows[0].total as number },
    };
  }

  async getOne(layerName: string, id: string): Promise<unknown> {
    const layer = this.layer(layerName);
    const result = await this.query(
      `SELECT ${this.featureJson('t')} AS feature FROM ${this.table(layer)} AS t WHERE t.id = $1`,
      [id],
    );
    if (result.rowCount === 0) { throw new NotFoundException('Feature not found'); }
    return result.rows[0].feature;
  }

  async create(layerName: string, input: FeatureInputDto): Promise<unknown> {
    const layer = this.layer(layerName);
    this.validateGeometry(layer, input.geometry);
    const properties = this.allowedProperties(layer, input.properties, true);
    const fields = Object.keys(properties);
    const values = Object.values(properties);
    const id = randomUUID();
    await this.validatePostGisGeometry(layer, input.geometry);
    values.push(id, JSON.stringify(input.geometry));
    const geometryParameter = values.length;
    const idParameter = values.length - 1;
    const columns = [...fields.map((field) => this.identifier(field)), 'id', 'geom'];
    const placeholders = fields.map((_, index) => `$${index + 1}`);
    const geometrySql = this.geometrySql(layer, geometryParameter);
    const sql = `
      INSERT INTO ${this.table(layer)} AS t (${columns.join(', ')})
      VALUES (${[...placeholders, `$${idParameter}`, geometrySql].join(', ')})
      RETURNING ${this.featureJson('t')} AS feature`;
    const result = await this.query(sql, values);
    return result.rows[0].feature;
  }

  async update(layerName: string, id: string, input: FeaturePatchDto): Promise<unknown> {
    const layer = this.layer(layerName);
    const assignments: string[] = [];
    const values: unknown[] = [];
    if (input.properties) {
      const properties = this.allowedProperties(layer, input.properties, false);
      for (const [field, value] of Object.entries(properties)) {
        values.push(value);
        assignments.push(`${this.identifier(field)} = $${values.length}`);
      }
    }
    if (input.geometry) {
      this.validateGeometry(layer, input.geometry);
      await this.validatePostGisGeometry(layer, input.geometry);
      values.push(JSON.stringify(input.geometry));
      assignments.push(`geom = ${this.geometrySql(layer, values.length)}`);
    }
    if (assignments.length === 0) { throw new BadRequestException('geometry or properties is required'); }
    assignments.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const idParameter = values.length;
    let where = `t.id = $${idParameter}`;
    if (input.expectedVersion !== undefined) {
      values.push(input.expectedVersion);
      where += ` AND t.row_version = $${values.length}`;
    }
    const result = await this.query(
      `UPDATE ${this.table(layer)} AS t SET ${assignments.join(', ')} WHERE ${where} RETURNING ${this.featureJson('t')} AS feature`,
      values,
    );
    if (result.rowCount === 0) {
      if (input.expectedVersion !== undefined) { throw new ConflictException('تغير السجل بعد فتحه. أعد تحميل المعلم قبل حفظ تعديلاتك.'); }
      throw new NotFoundException('Feature not found');
    }
    return result.rows[0].feature;
  }

  async remove(layerName: string, id: string): Promise<void> {
    const layer = this.layer(layerName);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(`DELETE FROM ${this.table(layer)} WHERE id = $1 RETURNING id`, [id]);
      if (result.rowCount === 0) { throw new NotFoundException('Feature not found'); }
      await client.query('COMMIT');
    } catch (error) {
      await this.rollback(client);
      this.rethrowDatabaseError(error);
    } finally {
      client.release();
    }
  }

  async related(layerName: string, id: string, relatedName: string): Promise<Record<string, unknown>[]> {
    const layer = this.layer(layerName);
    const related = layer.relatedTables[relatedName];
    if (!related) { throw new BadRequestException('Related table is not allowed for this layer'); }
    const parent = await this.query(`SELECT 1 FROM ${this.table(layer)} WHERE id = $1`, [id]);
    if (parent.rowCount === 0) { throw new NotFoundException('Feature not found'); }
    const sql = `SELECT to_jsonb(r) - 'password_hash' AS record FROM ${this.qualified(related.table)} AS r WHERE r.${this.identifier(related.foreignKey)} = $1 ORDER BY r.id`;
    const result = await this.query(sql, [id]);
    return result.rows.map((row: { record: Record<string, unknown> }) => row.record);
  }

  async listStandaloneTable(tableName: string): Promise<Record<string, unknown>[]> {
    const tables: Record<string, string> = {
      Military_Personnel: 'military_personnel', Military_Vehicles: 'military_vehicles',
      Weapons_Inventory: 'weapons_inventory', Intelligence_Reports: 'intelligence_reports',
      Military_Incidents: 'military_incidents', Communication_Devices: 'communication_devices',
      Maintenance_Records: 'maintenance_records', System_Users: 'system_users',
      Audit_Log: 'audit_log', Attachments_Metadata: 'attachments_metadata',
    };
    const table = tables[tableName];
    if (!table) throw new BadRequestException('Standalone table is not allowed');
    const result = await this.query(`SELECT to_jsonb(t) - 'password_hash' AS record FROM ${this.qualified(table)} AS t ORDER BY t.id LIMIT 100`);
    return result.rows.map((row: { record: Record<string, unknown> }) => row.record);
  }
  private layer(name: string): LayerDefinition {
    const layer = getLayerDefinition(name);
    if (!layer) { throw new BadRequestException('Layer is not allowed'); }
    return layer;
  }

  private allowedProperties(layer: LayerDefinition, properties: Record<string, unknown>, requireAll: boolean): Record<string, unknown> {
    const unknown = Object.keys(properties).filter((field) => !layer.editableFields.includes(field));
    if (unknown.length > 0) { throw new BadRequestException(`حقول غير معتمدة في الطبقة: ${unknown.join(', ')}`); }
    if (requireAll) {
      const missing = layer.requiredFields.filter((field) => properties[field] === undefined || properties[field] === null || properties[field] === '');
      if (missing.length > 0) { throw new BadRequestException(`حقول مطلوبة ناقصة: ${missing.join(', ')}`); }
    }
    return properties;
  }

  private validateGeometry(layer: LayerDefinition, geometry: Record<string, unknown>): void {
    const type = geometry.type;
    if (typeof type !== 'string' || !layer.geometryTypes.includes(type as never)) {
      throw new BadRequestException(`نوع الهندسة يجب أن يكون أحد الأنواع التالية: ${layer.geometryTypes.join(', ')}`);
    }
    if (!Array.isArray(geometry.coordinates)) { throw new BadRequestException('يجب أن تكون إحداثيات الهندسة مصفوفة.'); }
    this.validateCoordinates(geometry.coordinates);
  }

  private validateCoordinates(value: unknown): void {
    if (!Array.isArray(value) || value.length === 0) { throw new BadRequestException('إحداثيات الهندسة فارغة.'); }
    if (typeof value[0] === 'number') {
      if (value.length < 2 || !value.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate))) {
        throw new BadRequestException('زوج الإحداثيات غير صالح.');
      }
      const [longitude, latitude] = value as number[];
      if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
        throw new BadRequestException('يجب أن تكون الإحداثيات بنظام EPSG:4326.');
      }
      return;
    }
    for (const child of value) { this.validateCoordinates(child); }
  }

  private async validatePostGisGeometry(layer: LayerDefinition, geometry: Record<string, unknown>): Promise<void> {
    const expression = this.geometrySql(layer, 1);
    const result = await this.query(`SELECT ST_IsValid(g) AS valid, ST_GeometryType(g) AS type FROM (SELECT ${expression} AS g) value`, [JSON.stringify(geometry)]);
    const expected = layer.multiGeometry
      ? layer.geometryTypes.some((type) => type.includes('Polygon')) ? 'ST_MultiPolygon' : 'ST_MultiLineString'
      : 'ST_Point';
    if (!result.rows[0]?.valid || result.rows[0]?.type !== expected) {
      throw new BadRequestException(`الهندسة غير صالحة أو لا تطابق النوع المطلوب: ${expected.replace('ST_', '')}`);
    }
  }

  private geometrySql(layer: LayerDefinition, parameter: number): string {
    const transformed = `ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($${parameter}::text), 4326), 32637)`;
    return layer.multiGeometry ? `ST_Multi(${transformed})` : transformed;
  }

  private parseFilters(filter: string | undefined, layer: LayerDefinition): [string, string][] {
    if (!filter) { return []; }
    return filter.split(',').map((item) => {
      const separator = item.indexOf(':');
      if (separator < 1) { throw new BadRequestException('filter must contain field:value pairs'); }
      const field = item.slice(0, separator).trim();
      const value = item.slice(separator + 1).trim();
      if (!layer.filterableFields.includes(field) || value === '') { throw new BadRequestException(`Filter is not allowed: ${field}`); }
      return [field, value];
    });
  }

  private featureJson(alias: string): string {
    return `jsonb_build_object('type', 'Feature', 'id', ${alias}.id, 'geometry', ST_AsGeoJSON(ST_Transform(${alias}.geom, 4326))::jsonb, 'properties', to_jsonb(${alias}) - 'id' - 'geom')`;
  }

  private table(layer: LayerDefinition): string { return this.qualified(layer.table); }
  private qualified(table: string): string { return `${this.identifier(this.schema)}.${this.identifier(table)}`; }
  private identifier(value: string): string { return `"${value.replaceAll('"', '""')}"`; }

  private async query(text: string, values: unknown[] = []) {
    try { return await this.pool.query(text, values); }
    catch (error) { this.rethrowDatabaseError(error); }
  }

  private async rollback(client: PoolClient): Promise<void> {
    try { await client.query('ROLLBACK'); } catch { /* Preserve the original error. */ }
  }

  private rethrowDatabaseError(error: unknown): never {
    if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof ConflictException) { throw error; }
    const code = (error as { code?: string }).code;
    if (code === '23505' || code === '23503') { throw new ConflictException('The operation conflicts with existing data'); }
    if (code === '23502' || code === '22P02' || code === '22023') { throw new BadRequestException('The request contains invalid data'); }
    throw new InternalServerErrorException('Database operation failed');
  }
}
