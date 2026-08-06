# TritonNav Valhalla Infrastructure

This directory is the single home for self-hosted Valhalla routing infrastructure.

The Next.js app does not care whether Valhalla runs on a local Mac, Azure Student VM, UCSD Research Cloud, or SDSC VM. The app calls TritonNav's internal `/api/routes/walking` endpoint, and the server-side Valhalla adapter reads only:

```env
VALHALLA_BASE_URL=
```

Changing `VALHALLA_BASE_URL` points TritonNav at a different Valhalla host without frontend code changes.

## Directory Layout

```text
infrastructure/valhalla/
├── docker-compose.yml
├── README.md
├── config/
├── custom_files/
├── logs/
├── osm/
├── scripts/
└── tiles/
```

## Storage Roles

- `osm/`: local OpenStreetMap extracts, such as a future UCSD-only `.osm.pbf`.
- `tiles/`: generated Valhalla routing tiles.
- `config/`: Valhalla configuration templates.
- `logs/`: Valhalla runtime logs.
- `custom_files/`: optional future costing, boundary, or routing support files.
- `scripts/`: placeholder infrastructure commands.

Generated OSM data, tiles, logs, and local custom files are ignored by Git. Only placeholder `.gitkeep` files and documentation should be committed.

The compose file maps `tiles/` to the Valhalla image's `/custom_files` working directory and maps `osm/` to `/custom_files/osm`. The default `VALHALLA_TILE_URLS` value points at the UCSD-only PBF inside that mounted OSM directory.

## Docker Workflow

This scaffold is intentionally safe until a UCSD-only OSM extract is present.

Recommended local proof-of-concept image:

```env
VALHALLA_IMAGE=ghcr.io/valhalla/valhalla-scripted:latest
VALHALLA_PLATFORM=linux/arm64
```

The upstream Valhalla Docker documentation describes `valhalla-scripted` as the image intended for environment-variable driven tile-build configuration. GitHub Container Registry currently advertises `linux/arm64` for `ghcr.io/valhalla/valhalla-scripted:latest`, but compatibility must be verified before pulling:

```sh
docker buildx imagetools inspect ghcr.io/valhalla/valhalla-scripted:latest
```

Do not pull the image until the manifest shows `linux/arm64`.

Future flow:

```sh
cd infrastructure/valhalla
cp .env.example .env
# edit .env after placing the UCSD-only OSM extract
./scripts/start-routing
./scripts/routing-status
./scripts/routing-health
./scripts/stop-routing
```

The compose service is behind the `routing` profile and uses `--pull never` in `start-routing`. This prevents accidental image pulls during startup. Pull the selected image separately only after compatibility is verified.

## Networking

By default, the future Valhalla container will expose port `8002` on the host. TritonNav should then use:

```env
VALHALLA_BASE_URL=http://localhost:8002
```

For a VM deployment, replace the host with the VM DNS name or private IP:

```env
VALHALLA_BASE_URL=http://your-vm-host:8002
```

Do not expose Valhalla publicly without firewall rules, access control, and monitoring.

## What This Phase Does Not Do

This phase does not pull Valhalla images, download OSM data, build routing tiles, or run Valhalla. It only prepares the repository structure for those future steps.
