# Research: NestJS Spatial API

## Decision 1: Database access

- **Decision**: استخدام `pg.Pool` وSQL parameterized مباشرة داخل خدمة واحدة.
- **Rationale**: PostGIS functions ظاهرة بوضوح ولا توجد حاجة إلى ORM أو Repository layer.
- **Alternatives considered**: TypeORM وPrisma رُفضا لزيادة التجريد ومحدودية القيمة في مشروع التعلم.

## Decision 2: Generic endpoints

- **Decision**: endpoints عامة حسب `:layer` مع Allowlist ثابت في `layers.config.ts`.
- **Rationale**: يقلل تكرار controller/service مع الحفاظ على الأمان.
- **Alternatives considered**: Module لكل طبقة رُفض للتكرار؛ SQL identifier مباشر من URL رُفض أمنيًا.

## Decision 3: CRS boundary

- **Decision**: GeoJSON خارجي دائمًا `EPSG:4326`، والتحويل إلى `EPSG:32637` والعكس داخل SQL.
- **Rationale**: عقد ويب بسيط مع قياسات تخزين مترية.
- **Alternatives considered**: إرسال 32637 للعميل رُفض لأنه يزيد عبء الواجهة.

## Decision 4: Validation

- **Decision**: DTO للتحقق العام، ثم تحقق layer-specific من Allowlist وPostGIS `ST_IsValid` ونوع الهندسة.
- **Rationale**: يفصل أخطاء payload عن أخطاء الهندسة بأقل كود.
- **Alternatives considered**: JSON Schema engine إضافي رُفض في النسخة الأولى.

## Decision 5: Testing

- **Decision**: اختبارات contract لجميع endpoints واختبارات integration على `mgos_test` ببيانات اصطناعية صغيرة.
- **Rationale**: العقد هو نقطة اعتماد React اللاحقة ويجب أن يبقى ثابتًا.
- **Alternatives considered**: Unit tests فقط لا تثبت SQL وCRS والعلاقات.
