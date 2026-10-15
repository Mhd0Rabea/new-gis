# فحص بيئة GeoServer

**التاريخ:** 2026-10-03

## النتيجة

- لم توجد خدمة Windows باسم GeoServer أو Tomcat.
- لم توجد عملية GeoServer أو Java قيد التشغيل.
- المنافذ المحلية `8080` و`8081` و`8082` و`8181` غير مستخدمة وقت الفحص.
- لم يوجد تثبيت في `C:\Program Files\GeoServer` أو `C:\GeoServer`.
- Java المتاحة هي Temurin OpenJDK `17.0.20.1` في:
  `C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`.
- النسخة المستقرة المختارة هي GeoServer `3.0.1` لأنها النسخة المستقرة الحالية
  المتوافقة مع Java 17 وتتضمن إصلاح CVE-2026-76904.

## القرار

يلزم تثبيت GeoServer محليًا. لا يُخزن ملف التثبيت أو Data Directory أو بيانات
دخول الإدارة ضمن المستودع.
