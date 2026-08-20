# Indoor Navigation Data Foundation

Phase 3G prepares TritonNav to ingest authoritative indoor GIS and floor-plan data without changing the existing outdoor routing architecture.

Current architecture remains:

MapLibre -> campus resolver / destination intelligence -> `/api/routes/walking` -> Valhalla

Indoor navigation is an additive layer after Valhalla reaches a building entrance:

Current location -> Valhalla outdoor route -> preferred building entrance -> indoor entrance node -> floor/corridor graph -> destination room.

## Why Geisel First

Geisel Library is the proof-of-concept building because TritonNav already has stable outdoor records for it:

- Building ID: `geisel-library`
- Building code: `GEISEL`
- Outdoor entrance ID: `geisel-library-main`
- Outdoor routing anchor: Library Walk approach

No authoritative machine-readable Geisel indoor floor-plan dataset is currently present in this repository. Phase 3G therefore records only metadata and the outdoor-to-indoor transfer relationship. It does not invent floors, room geometry, hallways, stairs, elevators, accessibility claims, or public/restricted classifications.

## Indoor Graph Model

The normalized indoor model supports:

- Indoor building metadata
- Floors
- Rooms/spaces
- Indoor nodes
- Indoor edges
- Vertical connections
- Route composition

### Indoor Buildings

Fields include:

- `buildingId`
- `canonicalName`
- `code`
- `aliases`
- `officialId`
- `caan`
- `floorIds`
- `outdoorEntranceIds`
- `indoorDataAvailable`
- `indoorGraphAvailable`
- `source`
- `verificationStatus`

### Floors

Fields include:

- `floorId`
- `buildingId`
- `floorNumber`
- `displayName`
- `floorOrder`
- `geometryRef`
- `source`
- `verificationStatus`

### Rooms And Spaces

Fields include:

- `roomId`
- `buildingId`
- `floorId`
- `roomNumber`
- `roomName`
- `roomType`
- `aliases`
- `searchableLabel`
- `centroid`
- `geometryRef`
- `nearestIndoorNodeId`
- `source`
- `verificationStatus`

### Indoor Nodes

Supported node types include:

- building entrance
- doorway
- hallway
- corridor intersection
- room entrance
- stair
- elevator
- ramp
- indoor landmark

Each node can carry accessibility status, public-access status, geometry references, and provenance.

### Indoor Edges

Edges connect nodes and support:

- hallway/corridor traversal
- doorway traversal
- stairs
- elevators
- ramps
- directionality
- distance
- public/restricted status
- accessibility metadata

## Vertical Navigation

Vertical connections are modeled as indoor edges between nodes on different floors. Future routing can apply preferences such as:

- avoid stairs
- require elevator or ramp
- prefer accessible paths
- avoid restricted spaces

Unknown accessibility remains unknown. It is not converted to false.

## Outdoor To Indoor Transition

The transfer point is a stable relationship between an outdoor campus entrance and an indoor node.

For Geisel:

`geisel-library-main` -> `geisel-indoor-entrance-main`

The indoor node currently has no asserted indoor geometry. It exists so future authoritative floor-plan data can connect the existing outdoor arrival point to the indoor graph.

## Import Architecture

Indoor import helpers live under:

`lib/campus/import/indoor/`

They prepare future ingestion from:

- GeoJSON
- Esri GIS exports
- structured JSON
- floor-plan GIS data
- CAD-derived geometry converted outside TritonNav
- room/space inventory exports

Heavy CAD, DWG, or Revit parsing dependencies are intentionally not added.

## Route Composition

Indoor routing is represented as an application-level composition:

```js
{
  outdoorRoute,
  transition,
  indoorRoute,
  destination
}
```

The existing outdoor route response is unchanged.

## Current Geisel Coverage

- Indoor building metadata: present
- Outdoor entrance transfer node: present
- Authoritative floors: unavailable
- Authoritative rooms/spaces: unavailable
- Authoritative indoor graph: unavailable
- Authoritative accessibility metadata: unavailable

The destination-intelligence layer can report that indoor navigation data is unavailable without adding misleading actions.

## UCSD Data Request

For Geisel, TritonNav would benefit from:

- official building ID / CAAN
- floor identifiers
- floor polygons
- room/space polygons
- official room identifiers
- room centroids if available
- exterior doors
- interior doors
- corridors / circulation network
- stairs
- elevators
- ramps
- accessible entrances
- accessible interior paths
- public/restricted space classification
- indoor POIs

Campus-wide, the same datasets would enable indoor routing for academic buildings, residence halls, dining areas, libraries, transit hubs, student services, and accessibility-sensitive routes.

## Expansion Strategy

1. Import authoritative Geisel building/floor metadata.
2. Import Geisel exterior door and indoor entrance nodes.
3. Import Geisel rooms/spaces.
4. Import Geisel circulation graph, stairs, elevators, and ramps.
5. Validate accessible routing metadata.
6. Enable Geisel room-level route composition.
7. Repeat the same pipeline building-by-building.

No campus-wide indoor mapping should begin until the Geisel import path is validated with official data.
