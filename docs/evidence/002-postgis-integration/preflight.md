# فحص البيئة المحلية

**التاريخ:** 2026-10-03

- PostgreSQL: `18.6` محلي.
- PostGIS المتاح والمفعّل: `3.6.2`.
- قاعدة البيانات: `mgos`.
- Schema: `mgos` والمالك `mgos`.
- الدور `mgos`: Login فقط؛ ليس Superuser ولا يملك CreateDB أو CreateRole.
- CRS التخزين: `EPSG:32637`، وتم اختباره بدالة PostGIS.
- Docker: غير مستخدم.
- لم يتم تثبيت أو استبدال أي مكوّن.