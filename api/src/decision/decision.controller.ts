import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { DecisionService } from './decision.service';
import { DecisionListQueryDto, ReviewDecisionDto } from './decision.dto';
import { TrackingPoint } from './decision.types';

@ApiTags('decision')
@Controller('decision')
export class DecisionController {
  constructor(private readonly decision: DecisionService) {}

  @Get('risk')
  @ApiOperation({ summary: 'تقييم المخاطر من طبقات المستخدم المرفوعة' })
  risk(@Query() query: DecisionListQueryDto) { return this.decision.riskAssessments(query.limit); }

  @Get('routes')
  @ApiOperation({ summary: 'جاهزية مسارات الدوريات من طبقات المستخدم المرفوعة' })
  routes(@Query() query: DecisionListQueryDto) { return this.decision.routeReadiness(query.limit); }
  @Get('alerts')
  @ApiOperation({ summary: 'قراءة جلسات التتبع والإنذارات المحفوظة' })
  alerts(@Query() query: DecisionListQueryDto) { return this.decision.trackingSessions(query.limit); }

  @Get('forecast')
  @ApiOperation({ summary: 'قراءة نتائج التوقع المحفوظة' })
  forecasts(@Query() query: DecisionListQueryDto) { return this.decision.forecasts(query.limit); }

  @Get('changes')
  @ApiOperation({ summary: 'قراءة مرشحات التغير المحفوظة' })
  changes(@Query() query: DecisionListQueryDto) { return this.decision.changes(query.limit); }

  @Post('tracking/start')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  @ApiOperation({ summary: 'بدء تتبع من ملف JSON مرفوع من المستخدم' })
  startTracking(@UploadedFile() file: { originalname: string; buffer: Buffer } | undefined) {
    if (!file?.buffer) throw new BadRequestException('ملف التتبع بصيغة JSON مطلوب.');
    let payload: unknown;
    try { payload = JSON.parse(file.buffer.toString('utf8')); }
    catch { throw new BadRequestException('تعذر قراءة ملف التتبع. تأكد من أنه JSON صالح.'); }
    const points = Array.isArray(payload) ? payload : (payload as { points?: unknown[] })?.points;
    if (!Array.isArray(points)) throw new BadRequestException('يجب أن يحتوي ملف التتبع على مصفوفة points.');
    return this.decision.startTracking(file.originalname, points as TrackingPoint[]);
  }

  @Post('tracking/:id/stop')
  @ApiOperation({ summary: 'إيقاف جلسة التتبع الحالية' })
  stopTracking(@Param('id', new ParseUUIDPipe()) id: string) { return this.decision.stopTracking(id); }

  @Post('tracking/:sessionId/alerts/:alertId/review')
  @ApiOperation({ summary: 'تسجيل قرار المراجعة البشرية لإنذار' })
  reviewAlert(@Param('sessionId', new ParseUUIDPipe()) sessionId: string, @Param('alertId', new ParseUUIDPipe()) alertId: string, @Body() input: ReviewDecisionDto) {
    return this.decision.reviewAlert(sessionId, alertId, input.decision, input.note);
  }
  @Post('forecast/analyze')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  @ApiOperation({ summary: 'احتساب توقع تعليمي من ملف مؤشرات مرفوع' })
  analyzeForecast(@UploadedFile() file: { originalname: string; buffer: Buffer } | undefined) {
    if (!file?.buffer) throw new BadRequestException('ملف المؤشرات بصيغة JSON مطلوب.');
    try { return this.decision.analyzeForecast(file.originalname, JSON.parse(file.buffer.toString('utf8'))); }
    catch (error) { if (error instanceof BadRequestException) throw error; throw new BadRequestException('تعذر قراءة ملف المؤشرات. تأكد من أنه JSON صالح.'); }
  }

  @Post('forecast/:id/review')
  @ApiOperation({ summary: 'تسجيل قرار المراجعة البشرية للتوقع' })
  reviewForecast(@Param('id', new ParseUUIDPipe()) id: string, @Body() input: ReviewDecisionDto) { return this.decision.reviewForecast(id, input.decision, input.note); }
  @Post('change/analyze')
  @UseInterceptors(FilesInterceptor('files', 2, { limits: { fileSize: 100 * 1024 * 1024, files: 2 } }))
  @ApiOperation({ summary: 'مقارنة صورتين GeoTIFF مرفوعتين من المستخدم' })
  analyzeChange(@UploadedFiles() files: Array<{ originalname: string; buffer: Buffer }> | undefined) {
    if (!files || files.length !== 2) throw new BadRequestException('ارفع صورتين GeoTIFF للمقارنة.');
    if (files.some((file) => !/\.tiff?$/i.test(file.originalname))) throw new BadRequestException('المقارنة تدعم ملفات TIF وTIFF فقط.');
    return this.decision.analyzeChange(files[0], files[1]);
  }

  @Post('change/:id/review')
  @ApiOperation({ summary: 'تسجيل قرار المراجعة البشرية لنتيجة التغير' })
  reviewChange(@Param('id', new ParseUUIDPipe()) id: string, @Body() input: ReviewDecisionDto) { return this.decision.reviewChange(id, input.decision, input.note); }
}