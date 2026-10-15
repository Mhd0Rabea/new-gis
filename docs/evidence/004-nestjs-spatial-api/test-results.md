# نتائج اختبار المرحلة 004

**التاريخ**: 2026-10-04

## البيئة

- Node.js: `24.19.0`
- npm: `11.17.0`
- NestJS: `11`
- TypeScript: `5.9.3`
- قاعدة البيانات: PostgreSQL 18 / PostGIS 3.6، schema باسم `mgos`

## النتائج النهائية

| الأمر | النتيجة |
|---|---|
| `npm run build` | ناجح |
| `npm run lint` | ناجح |
| `npm run test:e2e -- --detectOpenHandles` | 5 مجموعات و12 اختبارًا ناجحة، دون عمليات مفتوحة |
| `npm run test:integration -- --detectOpenHandles` | مجموعتان و4 اختبارات ناجحة، بما فيها PostGIS الحي |
| `npm audit --audit-level=moderate` | 0 ثغرات |
| تشغيل `dist/main.js` وطلب `/docs-json` | HTTP 200 وثلاثة مسارات رئيسية |
| `scripts/preflight.ps1 -Target Full` | PASS، صفر أخطاء وصفر تحذيرات |

## التغطية

- Allowlist لأسماء الطبقات والعلاقات والحقول.
- GET لقائمة ومعلم واحد، pagination، ونتائج 400/404.
- دورة POST → GET → PATCH → DELETE حقيقية على PostGIS مع تنظيف السجل الاصطناعي.
- تخزين الهندسة في EPSG:32637 وإرجاع GeoJSON في EPSG:4326.
- SQL parameterized، rollback، وتحويل مخالفة FK إلى 409.
- السجلات المرتبطة والنتيجة الفارغة.
- تطابق مسارات وطرق Swagger الناتجة مع `contracts/openapi.yaml`.
- إغلاق `pg.Pool` عند إغلاق تطبيق NestJS؛ لا يظهر تحذير Jest عن open handles.

لا يحتوي هذا التقرير أو المستودع بيانات الاتصال. ملف `.env` محلي ومستبعد من Git.