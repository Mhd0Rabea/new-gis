# Quickstart Validation: NestJS Spatial API

## المتطلبات

- قاعدة `mgos` مكتملة من المرحلة `002-postgis-integration`.
- Node.js 24 وnpm.
- إعداد الاتصال في متغيرات البيئة فقط، دون أسرار داخل الملفات.

## 1. التشغيل

من مجلد `api/`:

```powershell
npm ci
Copy-Item .env.example .env
npm run build
npm start
```

عدّل `.env` محليًا قبل التشغيل. تستمع الخدمة إلى `API_HOST` و`API_PORT`، والقيمتان الافتراضيتان للتطوير هما `127.0.0.1` و`3000`.

## 2. القراءة

اطلب `GET /api/features/Military_Bases?limit=10` ثم اطلب معلمًا واحدًا باستخدام UUID.

النتيجة المتوقعة: `FeatureCollection` ثم `Feature` صالحان، والهندسة معادة بصيغة GeoJSON في EPSG:4326.

## 3. Allowlist

اطلب طبقة غير مسموحة، ثم جرّب UUID غير صالح.

النتيجة المتوقعة: أخطاء 400/404 موحدة لا تكشف SQL أو بيانات الاتصال.

## 4. CRUD

نفّذ POST لمعلم Point اصطناعي، ثم PATCH وGET وDELETE.

النتيجة المتوقعة: 201 ثم 200 ثم 204 ثم 404، بينما تُخزن الهندسة داخل PostGIS في EPSG:32637.

## 5. السجلات المرتبطة

اطلب `Military_Personnel` و`Military_Vehicles` لقاعدة معروفة، ثم جرّب اسم علاقة غير موجود في allowlist.

النتيجة المتوقعة: السجلات التابعة فقط، ورفض اسم العلاقة غير المسموح.

## 6. الاختبارات الآلية

```powershell
npm run lint
npm run test:e2e
npm audit
```

تعمل الاختبارات المعزولة بلا أسرار. لتفعيل اختبار PostGIS الحي اضبط `TEST_DATABASE_URL` مؤقتًا قبل تشغيل `npm run test:integration`.