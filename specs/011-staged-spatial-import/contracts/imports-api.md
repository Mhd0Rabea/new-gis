# Staged Imports API

## POST /imports/:layer

multipart: file, sourceName.  
201: batch summary، counts، first issues and staged features. لا يغير الطبقة التشغيلية.

## GET /imports/:batchId

يعيد metadata، totals، features paginated، issues، duplicate match وdecision.

## PATCH /imports/:batchId/decisions

body: { decisions: [{ stagedFeatureId, action }] } حيث action=create|update|skip.  
يرفض update بلا matchedFeatureId.

## POST /imports/:batchId/commit

body: { reviewer }.  
ينفذ transaction واحدة. 409 عند تغير matched row_version بعد الفحص.  
200: {status:"committed", created, updated, skipped}.

## POST /imports/:batchId/reject

body: { reviewer, reason? }. لا يغير التشغيل.

## GET /imports/:batchId/report.csv

تقرير UTF-8 للمعالم والمشكلات والقرارات.

## GET /imports

يعيد أحدث دفعات الاستيراد مع الحالة والأعداد والتوقيت لفتح سجل التدقيق.

## POST /imports/:batchId/revalidate

يعيد فحص المعالم المحفوظة في staging ويحدث المشكلات والتطابقات دون كتابة تشغيلية.

## DELETE /imports/:batchId

يحذف دفعة غير منتهية ومعالمها المرحلية فقط.