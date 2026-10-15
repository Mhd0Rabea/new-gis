# P1 Display Verification

**Date**: 2026-10-04
**Scope**: Tasks T001–T015

## Toolchain

- Node.js: 24.19.0
- npm: 11.17.0
- OpenLayers checked and installed: 10.10.0
- npm audit after installation: 0 vulnerabilities

## Static Quality

- npm run lint: PASS
- npm run typecheck: PASS
- npm run build: PASS
- Vite transformed 1767 modules and emitted MapPage as a lazy-loaded JavaScript/CSS chunk.

## GeoServer

- Workspace WMS GetCapabilities: HTTP 200, 244152 bytes.
- mgos:Military_Bases GetMap: HTTP 200, image/png, 3238 bytes.
- mgos:Checkpoints GetMap: HTTP 200, image/png, 3137 bytes.
- mgos:Operation_Sectors GetMap: HTTP 200, image/png, 3008 bytes.
- mgos:Patrol_Routes GetMap: HTTP 200, image/png, 2533 bytes.

## Browser Verification

- /map rendered inside the existing AppShell.
- The four canonical WMS layer names appeared with accessible checkbox labels.
- Military_Bases was visible by default and its legend rendered.
- Enabling Checkpoints changed the visible legend count from 1 to 2.
- Zoom to Extent was activated for Military_Bases.
- Browser console errors: none.
- At a 320px viewport, document width stayed within the viewport and controls reflowed above the map.
- Keyboard-facing controls are native buttons and checkboxes with visible labels and focus-visible styling.

## Service Failure Path

The running GeoServer service was not stopped because it is a shared local dependency. The UI failure path is wired to OpenLayers tileloaderror, displays an alert with a native retry button, and remounts the map sources on retry. A deliberate outage can be repeated manually from quickstart.md without changing source code.

## Environment

- Browser URLs remain relative: /api and /geoserver.
- Vite reads local proxy targets from .env through MGOS_API_PROXY_TARGET and MGOS_GEOSERVER_PROXY_TARGET.
- .env.example contains non-secret defaults.
- .env remains ignored by Git.
- NestJS was not running during this P1 check; P1 uses GeoServer only. API availability becomes required in P2.