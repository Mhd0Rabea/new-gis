import { Inject, Injectable, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../config/database.config';
@Injectable()
export class AiClassificationRepository{
 constructor(@Optional() @Inject(DATABASE_POOL) private readonly pool?:Pool){}
 async health(){if(!this.pool)return{storage:'memory'};await this.pool.query('SELECT 1 FROM mgos.ai_model_versions LIMIT 1');return{storage:'postgresql'};}
}
