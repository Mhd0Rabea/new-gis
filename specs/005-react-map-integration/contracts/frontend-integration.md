# Frontend Integration Contract

## Runtime Configuration

يُحمّل `public/runtime-config.js` قبل تطبيق React ويعرّف:

```js
globalThis.__GIS_RUNTIME_CONFIG__ = {
  apiBaseUrl: '/api',
  geoserverBaseUrl: '/geoserver',
};
```

القيم الافتراضية نسبية. يجوز استبدال الملف وقت النشر دون إعادة بناء الواجهة. لا يحتوي هذا الكائن أسرارًا أو بيانات اتصال PostgreSQL.

## Development Environment

ينسخ المطور `GIS-Base/.env.example` إلى `GIS-Base/.env` محليًا:

```dotenv
MGOS_API_PROXY_TARGET=http://127.0.0.1:3000
MGOS_GEOSERVER_PROXY_TARGET=http://127.0.0.1:8080
```

- `.env` غير متعقب.
- المتغيرات بلا بادئة `VITE_` كي لا تصل إلى bundle المتصفح.
- Vite يمرر `/api` إلى NestJS، و`/geoserver` إلى GeoServer.

## GeoServer Read Contract

- WMS base: `{geoserverBaseUrl}/mgos/wms`
- Workspace: `mgos`
- Version: `1.3.0`
- Core layer names:
  - `mgos:Military_Bases`
  - `mgos:Checkpoints`
  - `mgos:Operation_Sectors`
  - `mgos:Patrol_Routes`
- العمليات المستخدمة: `GetMap`, `GetFeatureInfo`, `GetLegendGraphic`
- لا تستخدم الواجهة `WFS-T`.

## NestJS Feature Contract

المرجع القانوني هو `specs/004-nestjs-spatial-api/contracts/openapi.yaml`.

- `GET /api/features/:layer`: GeoJSON FeatureCollection في `EPSG:4326`.
- `GET /api/features/:layer/:id`: GeoJSON Feature.
- `GET /api/features/:layer/:id/related/:table`: سجلات مرتبطة مسموحة.
- `POST /api/features/:layer`: إنشاء.
- `PATCH /api/features/:layer/:id`: تعديل جزئي.
- `DELETE /api/features/:layer/:id`: حذف.

تُرسل `bbox`, `limit`, `offset`, و`filter` فقط كما يعرّفها OpenAPI. لا تُرسل أسماء طبقات أو جداول خارج allowlist.

## Refresh Contract

بعد `POST` أو `PATCH` أو `DELETE` ناجح:

1. تغلق حالة الحفظ.
2. يعاد تحميل بيانات الطبقة النشطة من NestJS.
3. يستدعى refresh لمصدر WMS المقابل.
4. لا يعاد تحميل التطبيق كاملًا.

## Error Contract

- خطأ API المنظم يعرض `message` للمستخدم ويحافظ على المسودة.
- فشل WMS لا يمنع فتح بقية الصفحة أو استخدام API.
- لا تعرض كلمات مرور أو connection strings أو stack traces.
- لا يؤدي `401` إلى login أو token refresh في النطاق الحالي.