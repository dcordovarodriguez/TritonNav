# Routing Architecture

TritonNav separates map rendering from route calculation.

```text
Browser
  -> Next.js UI
  -> POST /api/routes/walking
  -> server-only Valhalla adapter
  -> VALHALLA_BASE_URL/route
  -> normalized route model
  -> MapLibre route layer
```

The browser never calls Valhalla directly. It calls TritonNav's internal API. The server adapter decides where Valhalla is hosted by reading `VALHALLA_BASE_URL`.

## Responsibilities

- MapLibre renders the basemap, markers, and GeoJSON route line.
- Valhalla calculates pedestrian route geometry, distance, duration, and maneuvers.
- `/api/routes/walking` validates TritonNav requests and returns provider-independent route data.
- `VALHALLA_BASE_URL` points the server adapter at local Docker or a VM-hosted Valhalla service.

## Portability Rule

The frontend should not change when Valhalla moves. Local Mac, Azure Student VM, UCSD Research Cloud, and SDSC VM deployments should all use the same app code. Only `VALHALLA_BASE_URL` changes.
