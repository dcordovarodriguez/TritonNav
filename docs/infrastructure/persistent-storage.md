# Persistent Storage

Valhalla routing data can become large. Generated and downloaded data must not live in source folders.

## Storage Layout

```text
infrastructure/valhalla/
├── osm/
├── tiles/
├── logs/
└── custom_files/
```

## OSM Extracts

Store downloaded OpenStreetMap extracts in:

```text
infrastructure/valhalla/osm/
```

The first proof-of-concept extract should cover only:

- UC San Diego main campus
- East Campus and UC San Diego Health
- Scripps Institution of Oceanography
- Central Campus and Health La Jolla trolley stations
- A small routing buffer around campus

Do not use California, Southern California, or San Diego County extracts for the local laptop POC.

## Routing Tiles

Store generated Valhalla tiles in:

```text
infrastructure/valhalla/tiles/
```

## Logs

Store runtime logs in:

```text
infrastructure/valhalla/logs/
```

## Git Rules

The repository tracks placeholder `.gitkeep` files and README files only. OSM extracts, generated routing tiles, local runtime logs, and custom local files are ignored.
