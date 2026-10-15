# Data Model: مركز القرار والذكاء المكاني

## RiskAssessment

- `subjectType`: قطاع أو طريق أو مسار.
- `subjectId`: معرّف العنصر.
- `score`: عدد صحيح من 0 إلى 100.
- `factors`: عوامل مسماة وقيمها وأوزانها.
- `confidence`: من 0 إلى 1، تنخفض عند نقص البيانات.
- `calculatedAt`: وقت الحساب.
- `source`: `rule-engine-user-upload`.

## RouteReadiness

- `routeId` و`routeName`.
- `riskScore` و`readinessScore`: من 0 إلى 100.
- `travelTime` و`roadStatus`.
- `resourceAvailability`: مؤشر موارد مرفوع من المستخدم.
- `recommendation`: سبب ترتيب قابل للقراءة.

## DecisionAlert

- `id` و`trackId`.
- `kind`: دخول منطقة خطر أو تأخر تحديث أو انخفاض جاهزية.
- `severity`: منخفض أو متوسط أو مرتفع.
- `reason` و`createdAt`.
- `reviewStatus`: جديد أو مقبول أو مرفوض.
- `reviewNote`: ملاحظة المراجع.

## ForecastInsight

- `scope`: قطاع أو فترة.
- `baselineValue` و`forecastValue`.
- `confidence` و`limitations`.
- `reviewStatus`.

## ChangeCandidate

- `id` و`geometry` و`confidence`.
- `summary`: وصف تغير مرفوع من المستخدم.
- `reviewStatus` و`reviewNote`.

## Validation

- لا قيمة خارج 0–100 للدرجات.
- لا تحول `reviewStatus` إلى اعتماد تلقائي.
- كل مصدر وعينة موسومان بوضوح بأنهما مرفوع من المستخدمان.
- ترسل الهندسة عبر العقد GeoJSON بـ EPSG:4326.
