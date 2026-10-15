# Verification Contract

## Script inputs

- Layer: اسم canonical معتمد.
- FeatureId: UUID لسجل مصرح باختباره.
- Field: حقل قابل للتحرير، ويفضل notes.
- ArcGisExpectedValue: القيمة المحفوظة من ArcGIS Pro.
- MgosTestValue: قيمة مؤقتة يحددها المستخدم.
- Apply: مطلوب صراحة للكتابة.

## Outputs

JSON منقح يتضمن حالات الفحص والإصدارات وحالة الاستعادة، دون بيانات اتصال.

## Failure contract

أي فشل بعد بدء التعديل يطلق محاولة الاستعادة في finally. فشل الاستعادة يجعل النتيجة blocked ويعرض الإجراء اليدوي الآمن.
