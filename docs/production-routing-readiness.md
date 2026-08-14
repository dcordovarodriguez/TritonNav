# Production Routing Readiness

TritonNav currently uses a local Valhalla service for real campus walking routes. The frontend calls only TritonNav's server-side `/api/routes/walking` endpoint. The browser should never know where Valhalla is hosted.

## Current Local State

- OSM input: UCSD-area `ucsd-campus.osm.pbf`, ignored by Git.
- Routing tiles: generated under `infrastructure/valhalla/tiles/`, ignored by Git.
- Runtime: Valhalla container listening locally on port `8002`.
- Health endpoint: `GET /status`.
- Application configuration: server-only `VALHALLA_BASE_URL=http://localhost:8002` for local development.

## Production Requirements

### Valhalla Host

Production requires a remotely reachable Valhalla service because Vercel cannot reach a developer laptop's `localhost:8002`.

Acceptable hosting patterns:

- TritonNav backend and Valhalla on the same VM, with Valhalla bound to `127.0.0.1`.
- Valhalla on a private campus network reachable only from the backend.
- Valhalla behind a firewall allowlist.
- Valhalla behind an authenticated reverse proxy if it must cross a public network.

Do not expose Valhalla publicly without authentication or network restrictions.

### Docker Image And Tiles

- Use the configured Valhalla Docker image from `infrastructure/valhalla/.env`.
- Keep the UCSD-only OSM extract in persistent storage.
- Keep generated routing tiles in persistent storage.
- Separate tile build from service startup so restarts do not rebuild tiles.

### Runtime Resources

For the current UCSD-only proof of concept, allocate conservatively:

- 2 CPU cores minimum, 4 preferred.
- 4 GB memory minimum, 6 to 8 GB preferred for tile builds.
- 10 GB free disk minimum, 20 GB preferred before refreshing tiles.

Larger campus buffers, elevation data, or regional extracts will require more storage and memory.

### Storage

Persistent data should include:

- Source OSM extract.
- Generated tile archive and config.
- Compose file and environment template.
- Logs needed for debugging.

Regenerable data can be rebuilt from the OSM extract and config, but preserving tiles speeds rollback.

### Networking

- Local development URL: `http://localhost:8002`.
- Production `VALHALLA_BASE_URL`: server-only URL reachable from the Next.js runtime.
- Vercel deployments need a network path to Valhalla over HTTPS unless using a private connectivity option.
- Keep `VALHALLA_BASE_URL` out of client-side `NEXT_PUBLIC_*` variables.

### HTTPS And Reverse Proxy

If Valhalla is remote:

- Terminate HTTPS at a reverse proxy such as Nginx, Caddy, campus load balancer, or cloud gateway.
- Restrict access by source IP, VPN, or authentication.
- Forward only the Valhalla API paths TritonNav needs.
- Keep request and response logs free of secrets.

### Monitoring And Restart

- Use `restart: unless-stopped` for the container.
- Keep a Compose health check aligned with `GET /status`.
- Monitor container health, route latency, disk usage, and memory pressure.
- Alert when `/status` fails or when routing responses stop returning `provider=valhalla`.

### Tile/Data Update Strategy

1. Download or receive a refreshed UCSD-area OSM/GIS extract.
2. Validate the extract.
3. Build tiles into a staging directory.
4. Run health and route smoke tests.
5. Swap the service to the new tiles.
6. Keep the previous known-good tiles for rollback.

## Production Smoke Tests

After setting production `VALHALLA_BASE_URL`, verify:

- `npm run check:valhalla` identifies the provider.
- Geisel Library to Price Center returns `provider=valhalla` and `isEstimated=false`.
- MANDE B202 to Sixth College returns `provider=valhalla` and `isEstimated=false`.
- Route geometry is a non-empty GeoJSON `LineString`.
- Production UI does not label real routes as temporary previews.

## Current Blocker

Production routing is not configured until a reachable Valhalla host exists and `VALHALLA_BASE_URL` is set in the deployment environment. The current local `localhost:8002` service is not reachable from Vercel.
