import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class DecisionListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'يجب أن يكون حد النتائج عددًا صحيحًا.' })
  @Min(1, { message: 'يجب ألا يقل حد النتائج عن 1.' })
  @Max(100, { message: 'يجب ألا يزيد حد النتائج على 100.' })
  limit = 100;
}
export class ReviewDecisionDto {
  @IsIn(['accepted', 'rejected'], { message: 'قرار المراجعة يجب أن يكون قبولًا أو رفضًا.' })
  decision!: 'accepted' | 'rejected';

  @IsOptional()
  @IsString({ message: 'ملاحظة المراجع يجب أن تكون نصًا.' })
  @MaxLength(500, { message: 'ملاحظة المراجع طويلة جدًا.' })
  note?: string;
}