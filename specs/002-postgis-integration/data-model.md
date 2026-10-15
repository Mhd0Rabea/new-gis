# Data Model: PostGIS Integration

## Database Layout

- Database: `mgos`
- Owner/application role: `mgos`
- Schema: `mgos`
- Extension: `postgis`
- Spatial storage CRS: `EPSG:32637`

## Common Spatial Columns

| Column | Type | Constraint |
|---|---|---|
| `id` | uuid | Primary key; copied from ArcGIS GlobalID |
| business ID | integer | Unique and non-null per table |
| `geom` | geometry(type,32637) | Non-null for published layers |
| `created_at` | timestamptz | Default current timestamp |
| `updated_at` | timestamptz | Updated on write |

## Spatial Tables

| Canonical name | Geometry |
|---|---|
| `Military_Bases` | Point |
| `Checkpoints` | Point |
| `Operation_Sectors` | MultiPolygon |
| `Patrol_Routes` | MultiLineString |
| `Threat_Areas` | MultiPolygon |
| `Supply_Routes` | MultiLineString |
| `Military_Warehouses` | Point |
| `Airports` | Point |
| `Communication_Towers` | Point |

كل جدول يحتفظ بالحقول المعرفة في `../001-arcgis-foundation/data-model.md` مع تحويل: Long إلى integer، Short إلى smallint، Double إلى double precision، Text إلى varchar(n)، Date إلى timestamp، GUID إلى uuid.

## Descriptive Tables

| Canonical name | Kind |
|---|---|
| `Military_Personnel` | Descriptive |
| `Military_Vehicles` | Descriptive |
| `Weapons_Inventory` | Descriptive |
| `Intelligence_Reports` | Descriptive |
| `Military_Incidents` | Descriptive |
| `Communication_Devices` | Descriptive |
| `Maintenance_Records` | Descriptive |
| `System_Users` | Descriptive |
| `Audit_Log` | Descriptive |
| `Attachments_Metadata` | Descriptive |

الجداول العشرة تحتفظ بأسمائها وحقولها المرجعية. حقول `*IDFK` تصبح uuid مع Foreign Keys إلى `id`. `System_Users.Password_Hash` لا يستخدم للمصادقة وتبقى قيمه الاصطناعية غير حساسة.

## Identifier Policy

تبقى أسماء الطبقات Canonical مثل `Military_Bases` في ArcGIS وGeoServer وعقود API. تستخدم PostgreSQL أسماء فيزيائية lowercase مثل `mgos.military_bases` لأن ArcGIS لا يقرأ الأسماء التي تتطلب double quotes. تحتفظ allowlist في NestJS بالـmapping الصريح، ولا يأتي اسم جدول حر من المستخدم.

## Domain Mapping

Domains المحددة تتحول إلى جداول lookup صغيرة أو CHECK constraints صريحة. لا تُنشأ enum types حتى يبقى تعديل القيم بسيطًا. القيم غير الموثقة تبقى أرقامًا مع قيود range فقط عند وجودها في المصدر.

## Relationships

العلاقات الست في ArcGIS تتحول إلى Foreign Keys مع indexes على حقول `*IDFK`. سياسات الحذف `RESTRICT` في النسخة الأولى لمنع حذف الأصل مع وجود سجلات تابعة.

## Spatial Indexes

كل `geom` يحصل على GiST index. معرفات الأعمال وUUID والمفاتيح الأجنبية تحصل على B-tree indexes حسب الحاجة.

## Migration State

ملف Evidence يسجل لكل تشغيل: المصدر، الوقت، طريقة النقل، counts قبل/بعد، UUID mismatches، invalid geometries، SRID mismatches، والنتيجة النهائية.

