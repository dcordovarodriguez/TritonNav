# Repository Structure

Infrastructure files are intentionally grouped under `infrastructure/`.

```text
infrastructure/
└── valhalla/
    ├── docker-compose.yml
    ├── README.md
    ├── config/
    ├── custom_files/
    ├── logs/
    ├── osm/
    ├── scripts/
    └── tiles/
```

Application routing code remains in the existing app architecture:

```text
app/api/routes/walking/
services/routing/
services/routingService.mjs
lib/routing/
components/MapView.jsx
```

Do not create another routing implementation. The infrastructure directory supports the existing Valhalla adapter and `/api/routes/walking` endpoint.
