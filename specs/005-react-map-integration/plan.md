# Implementation Plan: React Map Integration

**Branch**: `005-react-map-integration` | **Date**: 2026-10-04 | **Spec**: [spec.md](./spec.md)

**Input**: دمج خرائط MGOS مع NestJS وGeoServer داخل قالب `GIS-Base` الموجود، دون Authentication أو مشروع Frontend بديل.

## Summary

إضافة شاشة خريطة واحدة إلى قالب React الحالي. تستخدم الشاشة OpenLayers لعرض WMS من GeoServer، وتستخدم عميل NestJS الحالي لقراءة GeoJSON والتحرير. تعتمد الطبقات على سجل إعداد مركزي واحد، وتبقى أسماء الطبقات و`EPSG:4326` عقودًا ثابتة. تستخدم عناوين الخوادم مسارات نسبية وقت التشغيل، بينما يقرأ Vite أهداف proxy المحلية من ملف `.env` غير المتعقب.

## Technical Context

**Language/Version**: JavaScript ES2022 مع React 19 وNode.js 24 أو أحدث

**Primary Dependencies**: React Router 7، Axios 1، OpenLayers (`ol`) 10.10.0، Vite 6

**Storage**: لا تخزين دائم في الواجهة؛ PostGIS خلف NestJS وGeoServer

**Testing**: ESLint، TypeScript checkJs، Vite production build، وتحقق يدوي رأسي موثق لكل قصة مستخدم

**Target Platform**: متصفحات سطح المكتب الحديثة، مع تخطيط متجاوب للهاتف

**Project Type**: تطبيق ويب React داخل `GIS-Base` مع خدمات خلفية محلية منفصلة

**Performance Goals**: فتح شاشة الخريطة واستعمال عناصر التحكم دون تجمد ملحوظ، وتحميل بيانات المتجهات حسب الطبقة والنطاق بدل تحميل كامل المخطط

**Constraints**: لا Authentication، لا WFS-T، لا Docker، لا ORM أو state library جديدة، لا عناوين جهاز ثابتة في المصدر، وGeoJSON عبر API في `EPSG:4326`

**Scale/Scope**: شاشة خريطة واحدة؛ أربع طبقات WMS للنواة؛ استعلام وتحرير بسيطان تقودهما إعدادات الطبقات المعتمدة

## Constitution Check

*GATE: Passed before Phase 0 and re-checked after Phase 1.*

- **التعلم والبيانات الاصطناعية**: PASS — لا تضيف الخطة بيانات حقيقية أو مواقع حساسة.
- **البساطة**: PASS — مكتبة خرائط واحدة، عميل HTTP موجود، وReact state محلي.
- **ثبات أسماء GIS**: PASS — الطبقات تستخدم الأسماء Canonical نفسها في سجل مركزي.
- **الفحص قبل التثبيت**: PASS — فُحص القالب وحزمته؛ تثبيت `ol` ينتظر خطوة التنفيذ مع التحقق من الإصدار.
- **دون Docker**: PASS — التشغيل مع الخدمات المحلية الحالية.
- **مراحل رأسية**: PASS — العرض، ثم الاستعلام، ثم دورة تحرير واحدة.
- **فصل FGDB/PostGIS**: PASS — الواجهة لا تصل إلى FGDB؛ الويب يمر عبر PostGIS وخدماته.
- **العقود المكانية**: PASS — API يستقبل ويرجع `EPSG:4326`، والتحويل الداخلي مسؤولية PostGIS.
- **قالب React**: PASS — العمل داخل `GIS-Base` بعد فحصه.
- **استبعاد التحليل المتقدم**: PASS — لا تحليل أو AI أو تتبع لحظي.
- **قابلية النقل**: PASS — عناوين المتصفح نسبية، وأهداف التطوير في `.env` محلي.

لا توجد مخالفات تحتاج تبريرًا.

## Project Structure

### Documentation (this feature)

```text
specs/005-react-map-integration/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── frontend-integration.md
└── tasks.md
```

### Source Code (repository root)

```text
GIS-Base/
├── .env.example
├── public/
│   └── runtime-config.js
├── src/
│   ├── app/
│   │   └── routes.jsx
│   ├── config/
│   │   └── runtime.js
│   ├── features/
│   │   └── map/
│   │       ├── components/
│   │       │   ├── EditPanel.jsx
│   │       │   ├── FeatureDetails.jsx
│   │       │   ├── LayerPanel.jsx
│   │       │   └── MapCanvas.jsx
│   │       ├── config/
│   │       │   └── layers.js
│   │       ├── services/
│   │       │   ├── featuresApi.js
│   │       │   └── geoserver.js
│   │       └── useMapState.js
│   ├── pages/
│   │   └── MapPage.jsx
│   └── styles/
│       └── map.css
└── vite.config.js
```

**Structure Decision**: الحفاظ على القالب كتطبيق واحد، وتجميع كود الخريطة داخل feature folder صغير. تبقى الصفحة والتوجيه في مواضع القالب الحالية، بينما تعيش إعدادات الطبقات والخدمات ومكونات الخريطة معًا.

## Phase 0: Research Decisions

القرارات وتبريراتها موثقة في [research.md](./research.md).

## Phase 1: Design

- نموذج حالة الواجهة في [data-model.md](./data-model.md).
- عقد التكامل في [contracts/frontend-integration.md](./contracts/frontend-integration.md).
- سيناريوهات التشغيل والتحقق في [quickstart.md](./quickstart.md).

## Post-Design Constitution Check

PASS. حافظ التصميم على مكتبة خرائط واحدة، ولم يضف Authentication أو WFS-T أو state library. ملف `.env` المحلي غير متعقب، و`.env.example` لا يحتوي أسرارًا. لا توجد `NEEDS CLARIFICATION`.

## Complexity Tracking

لا توجد مخالفات دستورية أو تعقيدات تحتاج استثناءً.