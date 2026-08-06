# Infrastructure Overview

Routing infrastructure lives under:

```text
infrastructure/valhalla/
```

This keeps Docker files, future OSM extracts, generated tiles, logs, and helper scripts out of application folders.

## Components

- `docker-compose.yml`: future Valhalla runtime shape.
- `config/`: future Valhalla configuration templates.
- `osm/`: future OpenStreetMap extracts.
- `tiles/`: generated Valhalla routing tiles.
- `logs/`: runtime logs.
- `custom_files/`: future support files.
- `scripts/`: placeholder management commands.

## Persistent Storage

Generated routing tiles and OSM extracts are infrastructure data, not source code. They should persist on the host or VM disk and remain outside Git history.

## App Connection

The app connects through:

```env
VALHALLA_BASE_URL=http://localhost:8002
```

For VM hosting, set the same variable to the VM route-service URL.
