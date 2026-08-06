# Future VM Deployment

The same Docker layout should work on:

- Azure Student VM
- UCSD Research Cloud
- SDSC Virtual Machine

## Deployment Model

1. Clone the repository on the VM.
2. Install Docker.
3. Place the OSM extract in `infrastructure/valhalla/osm/`.
4. Generate Valhalla tiles into `infrastructure/valhalla/tiles/`.
5. Place Valhalla config in `infrastructure/valhalla/config/`.
6. Start the routing service with Docker Compose.
7. Point TritonNav at the VM by changing only `VALHALLA_BASE_URL`.

## No Frontend Changes

The frontend continues calling `/api/routes/walking`. The hosting location is hidden behind the server-only environment variable:

```env
VALHALLA_BASE_URL=http://vm-host-or-private-ip:8002
```

## Network Notes

Prefer private networking where possible. If the route service must be public, add firewall restrictions, monitoring, TLS or a private tunnel, and rate limiting before production traffic.
