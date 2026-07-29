# Valhalla Walking Routing

## Current Routing Flow

The homepage selects an origin from browser geolocation when available and falls back to the campus origin near Geisel Library. Destination coordinates come from `lib/navigation.js`, which resolves buildings, rooms, colleges, recreation facilities, and campus locations from the local data models.

The real-routing flow is:

```text
Browser UI -> POST /api/routes/walking -> server-only Valhalla adapter -> Valhalla /route
```

`services/routingService.mjs` is the only browser-facing route requester, and it calls TritonNav's internal API. `services/routing/valhallaProvider.mjs` is server-only and owns the native Valhalla request and response formats. Provider credentials are never sent to browser code.

MapLibre and Valhalla are separate responsibilities. MapLibre renders the basemap, markers, and GeoJSON route line. Valhalla calculates the pedestrian route geometry, distance, duration, and maneuver data.

Before Phase 2A, `app/page.js` generated a temporary bent line between origin and destination, calculated an estimated route distance from that temporary path, formatted an estimated walk time, and passed the GeoJSON feature to `components/MapView.jsx`. `MapView` rendered that geometry as a MapLibre line layer. The temporary geometry remains only as a clearly labeled local-development fallback when provider configuration is absent.

Google Maps remains only as an optional external handoff through `services/mapsService.js` and `lib/navigation.js`. It does not render an active iframe.

## Phase 2A Route Model

The internal normalized walking route response is provider-independent:

```json
{
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-117.23758, 32.88114],
      [-117.23698, 32.87962]
    ]
  },
  "distanceMeters": 250,
  "durationSeconds": 190,
  "steps": [
    {
      "instruction": "Walk east.",
      "distanceMeters": 80,
      "durationSeconds": 60,
      "maneuverType": "1",
      "streetName": "Library Walk",
      "beginShapeIndex": 0,
      "endShapeIndex": 3
    }
  ],
  "provider": "valhalla",
  "isEstimated": false,
  "warnings": []
}
```

GeoJSON coordinates are always `[longitude, latitude]`. Client code renders only this normalized model and does not consume native Valhalla response fields.

## API Endpoint

`POST /api/routes/walking` accepts:

```json
{
  "origin": {
    "latitude": 32.88,
    "longitude": -117.23
  },
  "destination": {
    "latitude": 32.87,
    "longitude": -117.24
  },
  "options": {
    "wheelchair": false,
    "avoidStairs": false
  }
}
```

Accessibility options are reserved for a later milestone and are not used for routing decisions yet. Responses use `Cache-Control: no-store`.

## Provider Configuration

Server-only environment variables:

```env
VALHALLA_BASE_URL=
VALHALLA_API_KEY=
VALHALLA_API_KEY_HEADER=
```

Do not use `NEXT_PUBLIC_` for provider credentials. If `VALHALLA_BASE_URL` is missing, the API returns a controlled provider configuration error. Local development may show a clearly labeled temporary fallback route; production must not claim that fallback is real routing.

`VALHALLA_BASE_URL` expects the Valhalla service root, and the adapter appends `/route`. To prevent accidental duplicate paths during local setup, the adapter also tolerates a value that already ends in `/route` or `/route/` and normalizes it to a single `/route` endpoint.

No-auth local or private-provider configuration:

```env
VALHALLA_BASE_URL=https://your-valhalla-service.example
```

Header-auth provider configuration:

```env
VALHALLA_BASE_URL=https://your-valhalla-service.example
VALHALLA_API_KEY=your-provider-key
VALHALLA_API_KEY_HEADER=X-Provider-Key
```

`VALHALLA_API_KEY` and `VALHALLA_API_KEY_HEADER` must be configured together for header authentication. Neither is required for a no-auth provider. `VALHALLA_API_KEY_HEADER` must be a valid HTTP header token. Do not commit `.env.local`, provider keys, authorization headers, or real provider URLs with embedded credentials.

For Vercel production and preview deployments, add the same server-only variables in the Vercel project settings later. Do not create `NEXT_PUBLIC_VALHALLA_*` variables.

## Valhalla Adapter

`services/routing/valhallaProvider.mjs` is the only module that knows Valhalla's native request and response format. It sends a POST request to the normalized `/route` endpoint with this shape:

```json
{
  "locations": [
    { "lat": 32.88114, "lon": -117.23758, "type": "break" },
    { "lat": 32.8798, "lon": -117.23695, "type": "break" }
  ],
  "costing": "pedestrian",
  "units": "kilometers",
  "language": "en-US",
  "directions_options": {
    "units": "kilometers"
  }
}
```

The adapter applies a timeout, decodes Valhalla's encoded route shape, normalizes distance and duration, and maps maneuvers into TritonNav's internal step model. If accessibility preferences such as wheelchair or avoid-stairs are present in TritonNav's internal request, they are preserved and surfaced as warnings unless a provider-supported accessibility contract is added later. Generic Valhalla pedestrian costing must not be described as a fully wheelchair-accessible route.

Valhalla documentation states route shapes use encoded polyline data with six decimal places of precision. The adapter decodes that shape directly and returns GeoJSON `[longitude, latitude]` coordinates. A live configured provider is still required to verify a specific production endpoint's response against UCSD test routes.

## Route States

The homepage uses explicit route states:

- `idle`
- `loading`
- `success`
- `error`
- `temporaryFallback`

Successful provider routes show provider-neutral "Walking route preview" language and use provider distance and duration as the source of truth. Temporary fallback routes are local-development only, visibly labeled, and keep distance and duration marked as estimates.

Expected states:

- Before provider configuration, `POST /api/routes/walking` returns a controlled `502` provider-configuration response. In local development only, the UI may draw a clearly labeled temporary route preview.
- After provider configuration, successful responses should have `provider: "valhalla"`, `isEstimated: false`, real GeoJSON route geometry, provider distance and duration, and optional maneuver steps.
- In production, provider failures show a restrained route-unavailable state. Production must not silently draw fake temporary geometry.

Security rules:

- Browser code calls only `POST /api/routes/walking`.
- The server adapter never returns raw provider payloads.
- The health check and API logs never print API keys, authorization headers, or complete provider URLs containing credentials.
- Responses use `Cache-Control: no-store`.

## Development Testing

When `NODE_ENV` is `development`, the homepage exposes a small "Development test origin" control. It does not modify browser geolocation. It only changes the origin sent to `/api/routes/walking` for repeatable campus-to-campus route checks. Available fixed origins come from existing TritonNav data:

- Geisel Library
- Price Center
- Mandeville Center
- Warren Lecture Hall
- Sixth College

Select "Use current location" to return to normal geolocation/fallback behavior.

The development route diagnostics panel reports route state, origin and destination coordinates, HTTP status, internal error code, provider, `isEstimated`, geometry coordinate count, distance, duration, maneuver count, and request duration. It does not show provider URLs, headers, keys, stack traces, or filesystem paths.

## Local Development Troubleshooting

Use the normal development server first:

```sh
npm run dev
```

If Turbopack encounters local `.next` cache or filesystem write errors, use the temporary Webpack fallback:

```sh
npm run dev:webpack
```

Then open `http://localhost:3000`.

Recommended local recovery sequence:

1. Stop the development server.
2. Remove only `.next`.
3. Run `npm run dev:webpack`.
4. Run `npm test`.
5. Run `npm run build`.

Do not delete source files, `node_modules`, environment files, or Git history for this recovery path.

## Health Check

After setting server-only values in `.env.local`, run:

```sh
npm run check:valhalla
```

The script loads local environment values, confirms `VALHALLA_BASE_URL` exists, validates the API-key/header relationship, sends one controlled pedestrian request from Geisel Library to Price Center, validates the normalized response, and exits nonzero on failure. It does not print API keys, authorization headers, or the configured provider URL. It is not called during application startup and automated tests do not depend on a live provider.

If `VALHALLA_BASE_URL` is absent, the expected result is:

```text
Valhalla health check failed: PROVIDER_CONFIGURATION - VALHALLA_BASE_URL is not configured.
```

## Live Route Acceptance Criteria

- `/api/routes/walking` returns HTTP 200.
- `provider` equals `"valhalla"`.
- `isEstimated` equals `false`.
- `geometry` is a LineString with at least two `[longitude, latitude]` coordinates.
- The rendered line follows walkable mapped paths, not a straight temporary line.
- `distanceMeters` and `durationSeconds` come from Valhalla.
- Basic maneuver data is accepted when Valhalla provides it.
- UI says "Walking route preview".
- "Temporary route preview" is absent.
- No external Google Maps handoff is triggered automatically.
- No provider credential appears in browser Network requests.

## Future Milestones

- Select the production Valhalla provider or hosting plan.
- Configure `VALHALLA_BASE_URL` and any required server-only credentials.
- Verify campus routes against a live provider.
- Replace remaining Google Maps external fallback once TritonNav routing is reliable.
- Add accessibility routing only after the provider and data model support it.
