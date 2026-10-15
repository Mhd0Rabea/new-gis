import { Global, Inject, Injectable, Module, OnModuleDestroy, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolConfig } from 'pg';

export const DATABASE_POOL = Symbol('DATABASE_POOL');

function booleanValue(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

export const databasePoolProvider: Provider = {
  provide: DATABASE_POOL,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Pool => {
    const connectionString = config.get<string>('DATABASE_URL');
    const poolConfig: PoolConfig = connectionString
      ? { connectionString }
      : {
          host: config.get<string>('PGHOST', '127.0.0.1'),
          port: config.get<number>('PGPORT', 5432),
          database: config.get<string>('PGDATABASE', 'mgos'),
          user: config.get<string>('PGUSER', 'mgos'),
          password: config.get<string>('PGPASSWORD'),
        };

    if (booleanValue(config.get<string>('DATABASE_SSL'))) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
    poolConfig.application_name = 'mgos-spatial-api';
    poolConfig.max = config.get<number>('DATABASE_POOL_MAX', 10);
    return new Pool(poolConfig);
  },
};

@Injectable()
class DatabasePoolLifecycle implements OnModuleDestroy {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}

@Global()
@Module({ providers: [databasePoolProvider, DatabasePoolLifecycle], exports: [DATABASE_POOL] })
export class DatabaseModule {}
