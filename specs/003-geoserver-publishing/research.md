# Research: GeoServer Publishing

## Decision 1: Runtime محلي

- **Decision**: استخدام Windows Installer للإصدار Stable وتشغيله محليًا، بعد فحص أي تثبيت موجود.
- **Rationale**: يزيل Docker ويتبع تفضيل المستخدم، مع أقل إعداد يدوي.
- **Alternatives considered**: Docker رُفض؛ WAR على Tomcat رُفض لأنه يضيف Application Server غير مطلوب.

## Decision 2: Java

- **Decision**: استخدام Temurin JDK 17 المثبت، مع اكتشافه من `JAVA_HOME` أو النظام بدل حفظ مسار جهاز بعينه.
- **Rationale**: إصدار مدعوم ومثبت، ويبقى المشروع قابلًا للنقل عندما يُضبط موقعه في البيئة المحلية.
- **Alternatives considered**: إعادة تثبيت Java أو استخدام Java 21 رُفضا دون حاجة.

## Decision 3: بروتوكولات النشر

- **Decision**: WMS للعرض وGetFeatureInfo، وWFS/GeoJSON للقراءة والاستعلام.
- **Rationale**: يغطي تعلم المعايير ويترك CRUD في Backend.
- **Alternatives considered**: WFS-T رُفض بسبب ازدواج قناة الكتابة؛ Vector Tiles مؤجلة لعدم الحاجة.

## Decision 4: Styling

- **Decision**: ثلاثة Styles عامة بسيطة للنقاط والخطوط والمضلعات، مع تخصيص محدود عند الحاجة.
- **Rationale**: يقلل التكرار ويركز على النشر.
- **Alternatives considered**: Style مستقل معقد لكل طبقة رُفض في النسخة التعليمية.

## Decision 5: Security Boundary

- **Decision**: حساب PostGIS للقراءة في GeoServer، وعدم تضمين حساب الإدارة في أي عقد Frontend.
- **Rationale**: WMS/WFS قراءة فقط وNestJS قناة الكتابة الوحيدة.
- **Alternatives considered**: حساب واحد واسع الصلاحيات رُفض.
