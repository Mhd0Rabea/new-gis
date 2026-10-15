# عقد API: مركز القرار

المسار الأساسي: `/api/decision`

## القراءة

| Method | Path | Purpose |
|---|---|---|
| GET | `/risk?limit=100` | ترتيب تقييمات المخاطر وعواملها |
| GET | `/routes?limit=100` | جاهزية مسارات الدوريات وتوصياتها |
| GET | `/alerts?limit=100` | جلسات التتبع والإنذارات المحفوظة |
| GET | `/forecast?limit=100` | المؤشرات والتوقعات المحفوظة |
| GET | `/changes?limit=100` | مرشحات تغير الصور مع هندسة GeoJSON في EPSG:4326 |

## الأفعال

| Method | Path | Input | Result |
|---|---|---|---|
| POST | `/tracking/start` | `multipart/form-data` بحقل `file` لملف JSON حقيقي يرفعه المستخدم | جلسة تتبع محفوظة وإنذارات مشتقة |
| POST | `/tracking/:id/stop` | لا شيء | جلسة موقوفة محفوظة |
| POST | `/tracking/:sessionId/alerts/:alertId/review` | `{ decision, note? }` | الجلسة والإنذار المراجع |
| POST | `/forecast/analyze` | `multipart/form-data` بحقل `file` لملف JSON يحوي `metric`, `scope`, `period`, `values` | توقع محفوظ |
| POST | `/forecast/:id/review` | `{ decision, note? }` | توقع مراجع |
| POST | `/change/analyze` | `multipart/form-data` بحقل `files` لصورتين GeoTIFF متوافقتين | مرشح تغير محفوظ |
| POST | `/change/:id/review` | `{ decision, note? }` | مرشح تغير مراجع |

## قواعد العقد

- `decision` إما `accepted` أو `rejected`، و`note` اختيارية حتى 500 محرف.
- كل الملفات والطبقات يرفعها المستخدم؛ لا ينشئ النظام عينات أو نتائج اصطناعية بديلة.
- `confidence` قيمة من 0 إلى 1، بينما تعرضها الواجهة كنسبة مئوية.
- ترسل هندسة مناطق التغير GeoJSON بنظام EPSG:4326، ويستخدم التخزين الداخلي EPSG:32637.
- لا يحتوي أي فعل على اعتماد أو نشر تلقائي، وتبقى كل نتيجة خاضعة للمراجعة البشرية.
- يعاد خطأ عربي واضح عند نقص البيانات أو عدم توافق الملفات أو غياب المعرّف.