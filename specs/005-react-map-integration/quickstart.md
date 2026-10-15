# Quickstart Validation: React Map Integration

## Prerequisites

- Node.js 24 أو أحدث وnpm.
- NestJS API يعمل محليًا وفق `api/.env`، افتراضيًا على `127.0.0.1:3000`.
- GeoServer يعمل محليًا، افتراضيًا على `127.0.0.1:8080`.
- Workspace `mgos` وطبقات النواة منشورة.
- لا يلزم Docker ولا Authentication.
- راجع الدليل الموحد docs/setup-and-portability.md عند النقل إلى جهاز آخر.

## 1. إعداد البيئة المحلية

من `GIS-Base`:

```powershell
Copy-Item .env.example .env
npm install
```

عدّل `.env` فقط إذا اختلف عنوان API أو GeoServer المحلي. لا تضع بيانات PostgreSQL أو كلمات مرور فيه.

**Expected**: يحتوي `.env` على هدفي proxy فقط ويبقى خارج Git.

للنشر أو النقل دون إعادة بناء React، عدّل `GIS-Base/public/runtime-config.js` أو قدّم ملفًا بديلًا بالصيغة نفسها:

```js
globalThis.__GIS_RUNTIME_CONFIG__ = Object.freeze({
  apiBaseUrl: '/api',
  geoserverBaseUrl: '/geoserver',
});
```

القيم النسبية مناسبة عندما يمر `/api` و`/geoserver` عبر Reverse Proxy واحد. إذا تغير الجهاز أو النطاق، تتغير إعدادات البيئة أو هذا الملف فقط، ولا يتغير مصدر React.

## 2. تشغيل الخدمات

من جذر المشروع يمكن تشغيل أو فحص خدمات الويب بأمر واحد:

```powershell
.\scripts\start-web.ps1
```

يفتح السكربت نافذة لكل من NestJS وReact فقط إذا لم تكن الخدمة تعمل، ويقرأ العناوين من ملفات `.env`. يبقى GeoServer تحت إدارة التثبيت المحلي ويُفحص دون إعادة تشغيله بالقوة.

لفحص الخدمات الثلاث دون تشغيل شيء:

```powershell
.\scripts\start-web.ps1 -CheckOnly
```

أو شغّل المكونات يدويًا كما يلي.
في نافذة أولى:

```powershell
Set-Location api
npm run start:dev
```

شغّل GeoServer بالطريقة المحلية الموثقة في `geoserver/README.md`.

في نافذة ثالثة:

```powershell
Set-Location GIS-Base
npm run dev
```

**Expected**: يفتح Vite على `http://127.0.0.1:5173`، وتمر طلبات `/api` و`/geoserver` عبر proxy دون CORS.

## 3. تحقق P1: العرض

1. افتح صفحة الخريطة.
2. شغّل وأخفِ كل طبقة من طبقات النواة.
3. افتح Legend ونفذ Zoom to Extent.
4. أوقف GeoServer مؤقتًا وتحقق من ظهور رسالة خطأ داخل شاشة الخريطة فقط.

**Expected**: تبقى الواجهة قابلة للاستخدام، وتعود الطبقات بعد تشغيل الخدمة وإعادة المحاولة.

## 4. تحقق P2: الاستعلام

1. اختر `Military_Bases`.
2. حدد المعلم الاصطناعي.
3. تحقق من الخصائص والسجلات المرتبطة.
4. طبّق فلترًا صالحًا ثم امسحه.

**Expected**: تتطابق التفاصيل مع API، ويعود العرض الكامل بعد مسح الفلتر.

## 5. تحقق P3: التحرير

1. أنشئ معلمًا اصطناعيًا في طبقة editable بالرسم، أو افتح خيار إدخال GeoJSON لاستخدام لوحة المفاتيح.
2. عدّل هندسته أو خاصية مسموحة.
3. احذفه بعد التأكيد.
4. جرّب حفظ هندسة خاطئة وتحقق من بقاء المسودة.

**Expected**: تمر الكتابة عبر NestJS فقط، وتتحدث طبقة WMS دون reload كامل.

## 6. فحوص الجودة

```powershell
npm run lint
npm run typecheck
npm run build
```

**Expected**: تنجح الأوامر الثلاثة، ولا تظهر مراجع `access_token` أو `refresh_token` أو `/login` في `GIS-Base/src`.