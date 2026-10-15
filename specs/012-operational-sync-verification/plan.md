# Implementation Plan: التحقق التشغيلي من التزامن

## Summary

إثبات أن ArcGIS Pro وMGOS وGeoServer يستهلكون PostGIS نفسها، مع أدوار محدودة واختبار تعديل قابل للاسترجاع وتعارض إصدار قديم. تنفذ الفحوص الآلية عبر SQL وAPI وWFS، وتوثق خطوات ArcGIS Pro التفاعلية بلقطات المستخدم.

## Technical Context

**Platform**: Windows، ArcGIS Pro 3.7.1، PostgreSQL 18.6، PostGIS 3.6.2، GeoServer، NestJS، React  
**Storage**: مخطط `mgos`؛ لا مخزن جديد  
**Testing**: SQL privilege probes، Jest/Supertest، HTTP verification، ودليل ArcGIS Pro  
**Constraints**: لا أسرار، لا Docker، لا بيانات مولدة، EPSG:32637 داخليًا وEPSG:4326 خارجيًا

## Constitution Check

- PASS: سجل المستخدم الحقيقي فقط.
- PASS: التشغيل المحلي دون تثبيت جديد.
- PASS: PostGIS مصدر الحقيقة وFileGDB ليس مزامنة.
- PASS: الأسماء وCRS ثابتة.
- PASS: الاتصال من البيئة ولا يسجل في الأدلة.

## Project Structure

```text
scripts/verify-operational-sync.ps1
database/security/operational-roles.sql
api/test/integration/optimistic-concurrency.e2e-spec.ts
docs/evidence/012-operational-sync-verification/
```

## Design

1. فحص البيئة دون تغيير.
2. قالب SQL idempotent للأدوار بلا كلمة مرور.
3. probes للصلاحيات والطبقات والإصدار.
4. اختيار سجل وحفظ الأصل.
5. تعديل ArcGIS والتحقق من API وGeoServer.
6. تعديل MGOS والتحقق في ArcGIS.
7. اختبار التعارض ثم الاستعادة.
8. تنقيح الأدلة وإغلاق المرحلة.

## Safety Gate

لا كتابة دون تمرير هوية الطبقة والمعلم والحقل وقيمة مؤقتة صراحةً مع `-Apply`. الاستعادة جزء إلزامي من التشغيل.
