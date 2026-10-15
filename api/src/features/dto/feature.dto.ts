import { Transform, Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsString, Matches, Max, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListFeaturesQueryDto {
  @ApiPropertyOptional({ example: '36.0,33.3,37.1,33.9' })
  @IsOptional()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
  bbox?: string;

  @ApiPropertyOptional({ default: 100, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit = 100;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;

  @ApiPropertyOptional({ description: 'Allowed filters as field:value pairs separated by commas.' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  filter?: string;
}

export class FeatureInputDto {
  @ApiProperty({ example: 'Feature' })
  @Matches(/^Feature$/)
  type!: 'Feature';

  @ApiProperty({ type: Object })
  @IsObject()
  geometry!: Record<string, unknown>;

  @ApiProperty({ type: Object })
  @IsObject()
  properties!: Record<string, unknown>;
}

export class FeaturePatchDto {
  @ApiPropertyOptional({ example: 'Feature' })
  @IsOptional()
  @Matches(/^Feature$/)
  type?: 'Feature';

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  geometry?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion?: number;

  @ValidateIf((value: FeaturePatchDto) => value.geometry === undefined && value.properties === undefined)
  @IsString({ message: 'geometry or properties is required' })
  private readonly payloadRequired?: never;
}
