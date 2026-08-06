# Infrastructure Troubleshooting

## `VALHALLA_BASE_URL` Missing

`npm run check:valhalla` should clearly report that the provider is not configured. This is expected before Docker or a VM service exists.

## Docker Service Not Running

Checks:

```sh
cd infrastructure/valhalla
./scripts/routing-status
```

If Docker is unavailable, start Docker Desktop and wait until `docker info` succeeds.

## Image Incompatible Or Unavailable

Before pulling:

```sh
docker buildx imagetools inspect ghcr.io/valhalla/valhalla-scripted:latest
```

Confirm the manifest includes `linux/arm64`. If it does not, choose another image or build a local arm64 image before continuing.

## Port 8002 Occupied

`start-routing` checks `VALHALLA_API_PORT`. If port `8002` is occupied, stop the existing service or change:

```env
VALHALLA_API_PORT=8003
```

## No Tiles Found

Generated tiles must live in:

```text
infrastructure/valhalla/tiles/
```

Do not place generated tiles in app, lib, services, or docs folders.

## OSM Extract Too Large

Large extracts belong in:

```text
infrastructure/valhalla/osm/
```

They are ignored by Git. Keep them on local or VM storage.

## App Cannot Reach Valhalla

Check:

- `VALHALLA_BASE_URL`
- Docker container status
- host port mapping
- VM firewall rules
- whether the Valhalla `/status` endpoint responds
