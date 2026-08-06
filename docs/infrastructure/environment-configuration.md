# Environment Configuration

The routing adapter is intentionally centralized around:

```env
VALHALLA_BASE_URL=
```

This is the only environment value that should need to change when moving between:

- Local Mac Docker Desktop
- Azure Student VM
- UCSD Research Cloud
- SDSC Virtual Machine

## Current App Variable

`VALHALLA_BASE_URL` is server-only. It must not be prefixed with `NEXT_PUBLIC_`.

Examples:

```env
VALHALLA_BASE_URL=http://localhost:8002
VALHALLA_BASE_URL=http://vm-host-or-private-ip:8002
```

## Future Variables

Infrastructure-only values live in `infrastructure/valhalla/.env`:

```env
VALHALLA_IMAGE=ghcr.io/valhalla/valhalla-scripted:latest
VALHALLA_PLATFORM=linux/arm64
VALHALLA_API_PORT=8002
VALHALLA_OSM_FILENAME=ucsd-campus.osm.pbf
VALHALLA_OSM_DIR=./osm
VALHALLA_TILE_DIR=./tiles
VALHALLA_CONFIG_DIR=./config
VALHALLA_LOG_DIR=./logs
VALHALLA_CUSTOM_FILES_DIR=./custom_files
```

These configure Docker and storage only. They should not change frontend behavior.

Future provider auth variables already supported by the server adapter are:

```env
VALHALLA_API_KEY=
VALHALLA_API_KEY_HEADER=
```

Use them only if the chosen Valhalla deployment requires header authentication. Do not expose them to the browser.
