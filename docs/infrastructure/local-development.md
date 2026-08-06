# Local Development

Use the existing TritonNav development commands for the Next.js app:

```sh
npm run dev
```

If Turbopack has local `.next` cache or filesystem write trouble, use:

```sh
npm run dev:webpack
```

## Routing Service

Docker Desktop is expected to expose Valhalla on port `8002` for the local proof of concept.

Prepare infrastructure configuration:

```sh
cd infrastructure/valhalla
cp .env.example .env
```

Do not start routing until the UCSD-only OSM extract is present in `infrastructure/valhalla/osm/`.

Set:

```env
VALHALLA_BASE_URL=http://localhost:8002
```

Then run:

```sh
npm run check:valhalla
```

## Current Placeholder Scripts

```sh
infrastructure/valhalla/scripts/start-routing
infrastructure/valhalla/scripts/stop-routing
infrastructure/valhalla/scripts/routing-status
infrastructure/valhalla/scripts/routing-health
```

The scripts validate Docker, environment variables, local files, and port availability. `start-routing` will start Compose only after validation passes and will not pull images automatically.
