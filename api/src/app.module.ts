import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './config/database.config';
import { FeaturesModule } from './features/features.module';
import { ProcessingModule } from './processing/processing.module';
import { DecisionModule } from './decision/decision.module';
import { ImportsModule } from './imports/imports.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule, FeaturesModule, ProcessingModule, DecisionModule, ImportsModule],
})
export class AppModule {}

