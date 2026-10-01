# Production Valhalla Deployment Runbook

This runbook prepares TritonNav for a future UCSD-supported Linux VM or equivalent managed host. It does not assume that UCSD has already provided a VM, firewall rule, DNS name, or certificate.

## Target Architecture

```text
iPhone / browser
  -> https://tritonnav.diegocordova.net
  -> Vercel /api/routes/walking
  -> HTTPS remote Valhalla endpoint
  -> UCSD-only Valhalla routing graph
```

The browser never receives a Valhalla URL or credential. TritonNav's frontend calls only `/api/routes/walking`; the Next.js route handler reads server-only configuration and calls Valhalla from the server runtime.

## VM Baseline

Minimum for the current UCSD-only proof of concept:

- 2 vCPU.
- 4 GB RAM.
- 20 GB persistent storage.
- Ubuntu LTS or comparable Linux distribution supported by Docker Engine.
- Docker Engine and Docker Compose v2.

Recommended for tile refreshes and safer operational headroom:

- 4 vCPU.
- 8 GB RAM.
- 40 GB persistent storage.
- Separate persistent volume or snapshot-backed disk for OSM input, generated tiles, config, and logs.

These estimates assume a UCSD-area extract, not a San Diego County or California extract.

## Persistent Storage

Use a portable layout such as:

```text
/opt/tritonnav-valhalla/
  docker-compose.yml
  .env
  osm/
  tiles/
  config/
  logs/
  backups/
```

Persist and back up:

- UCSD-area OSM `.osm.pbf` input.
- Generated Valhalla tile archive and supporting files.
- Valhalla configuration.
- Compose configuration and environment template.

Logs are useful for debugging but can usually be rotated rather than backed up indefinitely. Generated tiles can be rebuilt from the OSM extract and config, but retaining the last known-good tile set makes rollback faster.

## Ports And Networking

Valhalla listens on container port `8002`.

Preferred exposure:

- Bind Valhalla to localhost or a private interface when TritonNav backend traffic can reach it privately.
- If Vercel must cross the public internet, put Valhalla behind HTTPS with a reverse proxy or campus gateway.
- Do not expose unauthenticated Valhalla directly to the public internet.

Firewall and network requirements:

- Allow inbound HTTPS `443` only to the reverse proxy or gateway.
- Keep raw Valhalla `8002` closed to the public internet.
- If the service is private, allow only the backend or approved egress path.
- Allow outbound package/image access only as required for controlled maintenance.

## Reverse Proxy And HTTPS

Use a campus-managed gateway, Nginx, Caddy, or equivalent reverse proxy to terminate TLS and forward only the paths TritonNav needs, especially:

- `GET /status`
- `POST /route`

If the endpoint is public, add one of:

- Campus firewall allowlist.
- Authenticated reverse proxy.
- Header-based API key checked before proxying to Valhalla.
- Private tunnel or private network path.

Do not place credentials in the URL. If header authentication is required, configure both server-only variables:

```env
VALHALLA_API_KEY=
VALHALLA_API_KEY_HEADER=
```

## Docker Workflow

1. Place the UCSD-area OSM extract in the documented `osm/` directory.
2. Validate the extract and confirm it is scoped to campus plus a modest routing buffer.
3. Build Valhalla tiles once into persistent storage.
4. Start Valhalla using the existing generated tiles.
5. Verify `GET /status`.
6. Run a route smoke test from Geisel Library to Price Center.
7. Configure TritonNav's server-only `VALHALLA_BASE_URL` in Vercel.
8. Test production `/api/routes/walking`.

The local repository already keeps OSM input, generated tiles, `.env`, and logs ignored by Git.

## Remote VM Deployment Flow

When SSH access is available:

```bash
ssh <vm-user>@<vm-host>
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
docker --version
docker compose version
```

Place the routing infrastructure under a persistent directory such as:

```text
/opt/tritonnav-valhalla/
```

Transfer only the routing infrastructure and required data:

```text
infrastructure/valhalla/docker-compose.yml
infrastructure/valhalla/.env.example
infrastructure/valhalla/scripts/
infrastructure/valhalla/config/
infrastructure/valhalla/osm/ucsd-campus.osm.pbf
infrastructure/valhalla/tiles/
```

Create a VM-local `.env` from `.env.example`, then set VM-appropriate values:

```env
VALHALLA_PLATFORM=linux/amd64
VALHALLA_API_PORT=8002
VALHALLA_USE_TILES_IGNORE_PBF=True
VALHALLA_FORCE_REBUILD=False
```

Use `linux/arm64` only on Apple Silicon or an ARM VM. Most university Ubuntu VMs are expected to be `linux/amd64`, but the VM owner should confirm with:

```bash
uname -m
docker info --format '{{.Architecture}}'
```

Start the router from the VM routing directory:

```bash
docker compose --profile routing up -d
curl -fsS http://localhost:8002/status
```

Then test one route directly against Valhalla before connecting Vercel:

```bash
curl -fsS http://localhost:8002/route \
  -H 'Content-Type: application/json' \
  --data '{"locations":[{"lat":32.87931,"lon":-117.23455},{"lat":32.87788,"lon":-117.23604}],"costing":"pedestrian","units":"kilometers"}'
```

Do not expose raw port `8002` publicly by default. Put HTTPS, firewall policy, and optional authentication in front of it first.

## Vercel Configuration

Production needs a server-only environment variable:

```env
VALHALLA_BASE_URL=https://routing.future-host.example
```

Do not prefix it with `NEXT_PUBLIC_`. It must be available to the Vercel Production environment that serves `tritonnav.diegocordova.net`.

If a gateway requires header authentication, also configure:

```env
VALHALLA_API_KEY=
VALHALLA_API_KEY_HEADER=
```

Both authentication variables must be present together. Do not expose their values in logs or client bundles.

## Readiness Checks

Local development:

```bash
npm run check:valhalla
```

Production endpoint readiness from a configured environment:

```bash
npm run check:production-routing
```

To require a non-loopback endpoint during a production handoff:

```bash
npm run check:production-routing -- --require-remote
```

The production readiness script classifies the endpoint without printing the configured URL or any credential. It sends a controlled Geisel Library to Price Center route request and requires `provider=valhalla`, `isEstimated=false`, positive distance/duration, and a non-empty `LineString`.

## Updating Routing Data

1. Obtain a refreshed UCSD-area OSM extract.
2. Keep the current tile set running.
3. Build new tiles in a staging directory or maintenance window.
4. Run `/status` and route smoke tests against the new tiles.
5. Swap to the new tile set.
6. Keep the previous known-good tile set until the new one is verified.

## Backup And Rollback

Back up before tile rebuilds or VM migration:

- OSM extract.
- Current generated tiles.
- Valhalla configuration.
- Compose files.
- Vercel variable names and environment placement, without secret values.

Rollback is either:

- Point Valhalla back to the previous known-good tile directory.
- Restore the previous VM snapshot or persistent volume snapshot.
- Temporarily remove or unset production `VALHALLA_BASE_URL`, which makes TritonNav truthfully report routing unavailable rather than displaying fake routes.

## Current Production Blocker

`tritonnav.diegocordova.net` runs on Vercel. A local Mac service at `http://localhost:8002` is not reachable from Vercel functions. Production routing requires a remote HTTPS Valhalla endpoint plus the server-only `VALHALLA_BASE_URL` configured in Vercel.
