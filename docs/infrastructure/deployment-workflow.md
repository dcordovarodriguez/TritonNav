# Deployment Workflow

This is the future workflow for portable Valhalla deployment. Do not run these steps until Docker and Valhalla inputs are approved.

## Local Mac

1. Install Docker Desktop.
2. Configure Docker CPU, memory, and disk limits.
3. Verify `ghcr.io/valhalla/valhalla-scripted:latest` advertises `linux/arm64`.
4. Pull the image only after compatibility is verified.
5. Add a UCSD-only OSM extract to `infrastructure/valhalla/osm/`.
6. Build tiles into `infrastructure/valhalla/tiles/`.
7. Start Valhalla with `infrastructure/valhalla/scripts/start-routing`.
8. Set `VALHALLA_BASE_URL=http://localhost:8002`.
9. Run `npm run check:valhalla`.

## VM

1. Provision Azure Student VM, UCSD Research Cloud, or SDSC VM.
2. Install Docker.
3. Clone TritonNav.
4. Copy or build the same OSM extract and tile data under `infrastructure/valhalla/`.
5. Start the same Docker Compose service.
6. Set `VALHALLA_BASE_URL` to the VM route service URL.
7. Run `npm run check:valhalla` from the app environment.

The app code and frontend behavior should remain identical across both workflows.
