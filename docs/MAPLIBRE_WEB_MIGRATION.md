# MapLibre Web Migration

## Current Foundation

TritonNav now renders the web map with MapLibre GL JS instead of an active Google Maps iframe. The existing search, destination selection, current-location state, bottom sheet, distance estimates, and temporary route preview flow remain in place.

The homepage and navigation route both reuse `components/MapView.jsx`. Temporary route geometry is normalized to GeoJSON in `lib/mapGeometry.js` and rendered as a MapLibre line layer. This is not real pedestrian routing yet.

## Worker Modules

MapLibre v6 derives its worker URL from `import.meta.url`. In the current Next.js/Turbopack development build, that default resolved to `/`, causing Chrome to request the app homepage as a module worker and reject it because the response was `text/html`.

Two fixed App Router route handlers serve the installed MapLibre package files with JavaScript MIME types:

- `/maplibre-gl-worker.mjs` serves `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs`
- `/maplibre-gl-shared.mjs` serves `node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs`

The routes do not accept request parameters, proxy external URLs, expose environment variables, or allow user-controlled filesystem paths. They require the Node.js runtime because they read fixed local package files. `next.config.js` includes only those exact files for output tracing so Vercel serverless packaging can include them.

The worker URLs are intentionally not cached as immutable for a year because the URL does not include the MapLibre package version. Browsers should revalidate after a dependency upgrade.

## Style Provider

When `NEXT_PUBLIC_MAP_STYLE_URL` is not supplied, TritonNav uses a public CARTO raster preview style:

- tiles: `https://*.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png`
- attribution: CARTO and OpenStreetMap contributors

This fallback uses no key or secret and is suitable for local development and light preview testing. It is not considered production-ready until provider terms, quota, attribution, account ownership, domain restrictions, and usage plan are confirmed.

Production should provide a MapLibre-compatible style through:

```env
NEXT_PUBLIC_MAP_STYLE_URL=https://your-provider.example/style.json
```

Changing providers should not require rewriting `MapView`; the environment variable overrides the fallback style.

## Remaining Google Handoff

Google Maps remains only as an external directions handoff link through `services/mapsService.js`, `lib/navigation.js`, `components/DirectionsPanel.jsx`, and `components/RouteBottomSheet.jsx`. It no longer renders an embedded active map. This legacy handoff should be removed once TritonNav has real in-app pedestrian routing.

## Routing Accuracy

The current route line is temporary preview geometry. It is useful for validating MapLibre layers, markers, camera fitting, and UI flow, but it is not turn-by-turn walking guidance. Future pedestrian routing can replace the GeoJSON input produced by `lib/mapGeometry.js` without rewriting the `MapView` rendering surface.
