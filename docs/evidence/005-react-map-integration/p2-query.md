# P2 Query Verification

**Date**: 2026-10-04
**Scope**: Tasks T016–T021

## Static Quality

- npm run lint: PASS
- npm run typecheck: PASS
- npm run build: PASS
- Vite production build transformed 1864 modules.

## Runtime Services

- Vite /map: HTTP 200.
- Vite proxy /api/features/Military_Bases?limit=1: HTTP 200.
- Vite proxy /geoserver/mgos/wms GetCapabilities: HTTP 200.
- No Authentication headers, tokens, route guards, or login redirects were used.

## Filter Flow

1. Active query layer: Military_Bases.
2. Filter field: base_name.
3. Filter value: Training Base 01.
4. API result count shown by the UI: 1.
5. WMS received the equivalent allowlisted CQL_FILTER.
6. Clear filter emptied the input and removed the WMS/API filter state.

## Selection Flow

1. The visible point was selected from the map after filtering.
2. GeoServer GetFeatureInfo returned a feature identifier in layer.uuid form.
3. The frontend extracted the UUID and requested NestJS.
4. NestJS returned the complete GeoJSON feature for Training Base 01.
5. The selected GeoJSON was highlighted in the OpenLayers vector selection layer.

## Related Records

- Military_Personnel: 1 record.
- Military_Vehicles: 1 record.
- Empty and null property values display as an em dash.
- Related table names come only from the centralized allowlist.

## Browser and Accessibility

- All filter controls had unique programmatic labels.
- Query results were announced through stable status regions.
- The feature detail region exposed the selected layer, UUID, properties, and relations.
- The filter was applied and cleared using native controls.
- At a 320px viewport, document width remained within the viewport.
- Browser console errors: none.

## Cleanup

The temporary Vite server and NestJS process used for verification were stopped. GeoServer remained running.