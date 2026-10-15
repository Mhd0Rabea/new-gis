# MGOS Spatial API

واجهة NestJS بسيطة تتصل مباشرة بقاعدة PostGIS باستخدام `pg` وSQL parameterized. لا تستخدم ORM أو Docker، ولا تحتوي بيانات اتصال ثابتة.

## المتطلبات

- Node.js 24 وnpm.
- PostgreSQL 18 مع PostGIS 3.6 وقاعدة MGOS المُنشأة في المرحلة `002-postgis-integration`.
- صلاحية اتصال على schema باسم `mgos` أو اسم schema بديل عبر البيئة.

## الإعداد على أي جهاز

1. انسخ هذا المستودع وثبّت الاعتمادات من داخل `api/` بالأمر `npm ci`.
2. انسخ `.env.example` إلى `.env` محليًا، أو اضبط المتغيرات في نظام التشغيل.
3. ضع بيانات الاتصال في `DATABASE_URL`، ولا ترفع ملف `.env` إلى Git.
4. شغّل `npm run build` ثم `npm start`، أو استخدم `npm run start:dev` أثناء التطوير.

الإعدادات المتغيرة هي `DATABASE_URL`, `DATABASE_SCHEMA`, `DATABASE_SSL`, `API_HOST`, `API_PORT`, و`API_CORS_ORIGIN`. الاختبار الحي يستخدم `TEST_DATABASE_URL` فقط.

## التحقق

- `npm run lint`
- `npm run test:e2e`
- `npm audit`

تعمل اختبارات العقد دون قاعدة بيانات. عند وجود `TEST_DATABASE_URL` يعمل اختبار CRUD حي تلقائيًا ويتحقق من تخزين الهندسة في EPSG:32637 ثم يحذف بياناته.

Swagger متاح عند `/docs`، وجميع مسارات API تبدأ بـ`/api`.