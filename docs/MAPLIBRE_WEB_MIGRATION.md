# MapLibre Web Migration

## Current Foundation

TritonNav now renders the web map with MapLibre GL JS instead of an active Google Maps iframe. The existing search, destination selection, current-location state, bottom sheet, and walking-route flow remain in place.

The homepage and navigation route both reuse `components/MapView.jsx`. Server-provided walking routes are normalized as GeoJSON and rendered as a MapLibre line layer. Temporary preview geometry remains available only as a clearly labeled development fallback when the Valhalla provider is unavailable.

## Worker Modules

MapLibre v6 derives its worker URL from `import.meta.url`. In the current Next.js/Turbopack development build, that default resolved to `/`, causing Chrome to request the app homepage as a module worker and reject it because the response was `text/html`.

Two fixed App Router route handlers serve the installed MapLibre package files with JavaScript MIME types:

- `/maplibre-gl-worker.mjs` serves `node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs`
- `/maplibre-gl-shared.mjs` serves `node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs`

The routes do not accept request parameters, proxy external URLs, expose environment variables, or allow user-controlled filesystem paths. They require the Node.js runtime because they read fixed local package files. `next.config.js` includes only those exact files for output tracing so Vercel serverless packaging can include them.

The worker URLs are intentionally not cached as immutable for a year because the URL does not include the MapLibre package version. Browsers should revalidate after a dependency upgrade.

## Style Provider

When `NEXT_PUBLIC_MAP_STYLE_URL` is not supplied, TritonNav uses OpenFreeMap's public Positron style:

- style: `https://tiles.openfreemap.org/styles/positron`
- attribution is supplied by the style and includes OpenStreetMap contributors

This fallback uses no account, key, secret, or browser cookie. A separately managed provider can still be selected for production if TritonNav later needs contractual support or service guarantees.

Production should provide a MapLibre-compatible style through:

```env
NEXT_PUBLIC_MAP_STYLE_URL=https://your-provider.example/style.json
```

Changing providers should not require rewriting `MapView`; the environment variable overrides the fallback style.

## Remaining Google Handoff

Google Maps remains only as an external directions handoff link through `services/mapsService.js`, `lib/navigation.js`, `components/DirectionsPanel.jsx`, and `components/RouteBottomSheet.jsx`. It no longer renders an embedded active map. This legacy handoff should be removed once TritonNav has real in-app pedestrian routing.

## Routing Accuracy

Configured routes come from TritonNav's server-side Valhalla provider and are returned with `provider=valhalla` and `isEstimated=false`. The development-only fallback remains useful for validating MapLibre layers, markers, camera fitting, and UI flow, but it is labeled as a temporary preview and is never silently presented as a real pedestrian route.
