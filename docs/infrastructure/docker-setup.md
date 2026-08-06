# Docker Setup

This repository includes Docker scaffolding for Valhalla but does not install or run Valhalla yet.

## Current State

`infrastructure/valhalla/docker-compose.yml` defines a future Valhalla service behind the `routing` profile. It reads configuration from `infrastructure/valhalla/.env`.

Recommended proof-of-concept image:

```env
VALHALLA_IMAGE=ghcr.io/valhalla/valhalla-scripted:latest
VALHALLA_PLATFORM=linux/arm64
```

The old Docker Hub `valhalla/valhalla` repository is no longer receiving updates. Use GitHub Container Registry images from the upstream Valhalla project instead.

Before pulling, verify Apple Silicon support:

```sh
docker buildx imagetools inspect ghcr.io/valhalla/valhalla-scripted:latest
```

The manifest must include `linux/arm64`.

## Future Startup Shape

```sh
cd infrastructure/valhalla
cp .env.example .env
./scripts/start-routing
```

`start-routing` validates Docker, required environment variables, OSM file presence, port availability, and image manifest architecture before running Compose. It uses `--pull never`, so it will not pull images automatically.

## Mounted Volumes

- `./config:/config:ro`
- `./tiles:/custom_files`
- `./osm:/custom_files/osm:ro`
- `./config:/config:ro`
- `./custom_files:/tritonnav_custom_files:ro`
- `./logs:/var/log/valhalla`

The `valhalla-scripted` image uses `/custom_files` as its working area. TritonNav keeps source OSM extracts in `osm/` and generated tiles in `tiles/`; Compose mounts `osm/` inside `/custom_files/osm` and points `VALHALLA_TILE_URLS` at the UCSD-only PBF path.

## Host Port

The future default host port is configured by:

```env
VALHALLA_API_PORT=8002
```

TritonNav should then use `VALHALLA_BASE_URL=http://localhost:8002`.

Do not expose the port publicly on a VM until firewall and access rules are defined.
