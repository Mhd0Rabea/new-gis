# التحقق من تعطيل WFS-T

**التاريخ:** 2026-10-03

- مستوى خدمة WFS: `BASIC`.
- `GetCapabilities` يعلن `ImplementsTransactionalWFS = false`.
- أُرسل طلب `Transaction/Delete` آمن يستهدف معرّفًا غير موجود.
- أعاد الخادم خطأ `OperationProcessingFailed` بالنص: `Transaction support is not enabled`.
- بقي عدد معالم `Military_Bases` مساويًا لـ4 قبل الطلب وبعده.

الطلب والاستجابة محفوظان في `wfs-transaction-request.xml` و`wfs-transaction-response.xml`.

النتيجة: **PASS** — القراءة متاحة والتحرير عبر WFS-T مرفوض.
