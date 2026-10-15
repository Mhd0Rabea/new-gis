# GeoServer المحلي

- الإصدار المجرب: `3.0.1`
- مسار التشغيل: تحدده `GEOSERVER_HOME` محليًا ولا يُحفظ كمسار مطلق داخل المشروع.
- Java: Temurin OpenJDK `17.0.20.1`
- عنوان الخدمة: تحدده `GEOSERVER_URL`، وقيمة التطوير الافتراضية `http://localhost:8080/geoserver`.
- Workspace: `mgos`
- PostGIS Store: `mgos`
- CRS الأصلي: `EPSG:32637`

لا يحتوي هذا المجلد على Data Directory أو كلمات مرور. ملفات التشغيل والاعتماد المحلية تبقى خارج Git.

## التشغيل المحلي

اضبط البيئة بحسب الجهاز ثم شغّل GeoServer:

```powershell
$env:GEOSERVER_HOME = '<local-geoserver-directory>'
$env:GEOSERVER_URL = 'http://localhost:8080/geoserver'
& (Join-Path $env:GEOSERVER_HOME 'bin\startup.bat')
```

للإيقاف:

```powershell
& (Join-Path $env:GEOSERVER_HOME 'bin\shutdown.bat')
```

يستطيع `scripts/preflight.ps1` اكتشاف التشغيل عبر `GEOSERVER_URL` حتى عندما يعمل GeoServer كعملية Java مستقلة وليس Windows Service.