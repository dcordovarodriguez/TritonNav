# TritonNav GIS Data Requirements

This document is the working checklist for requesting official UC San Diego GIS data. TritonNav can currently route from local campus fixtures through MapLibre, the campus resolver, `/api/routes/walking`, and Valhalla. Official GIS data should replace or augment those fixtures without changing the frontend flow.

## Current Import Assumption

TritonNav is prepared to normalize GeoJSON-like features from ArcGIS REST FeatureServer exports, GeoJSON, shapefile-to-GeoJSON conversions, or CSV coordinate exports. The application does not currently connect to any UCSD GIS API.

All future records should carry provenance:

- `authority`
- `dataset`
- `status`
- `sourceType`
- `sourceUrl`
- `verified`
- `verifiedAt`
- `confidence`
- `notes`

## Required For Routing

### Campus Buildings

- Official building ID
- Official building name
- Building code and known aliases
- Building polygon
- Official centroid
- Street address or campus address
- Current/public status where available

### Entrances

- Entrance ID
- Related official building ID
- Latitude/longitude or point geometry
- Entrance type: main, secondary, service, restricted, courtyard, event, residence
- Public/restricted status
- Accessible status
- Stairs/ramp presence
- Door or approach notes when available

### Pedestrian Paths

- Path geometry
- Surface type
- Stairs
- Ramp
- Slope/grade where available
- Accessible status
- Public/restricted status
- Temporary closures or construction restrictions where available

## Useful For Destination Intelligence

### Accessibility Features

- Elevators
- Accessible path segments
- Curb cuts
- Ramps
- Accessible parking adjacency
- Door operators where available
- Accessibility notes and verification date

### Bike Racks

- Rack ID
- Point geometry
- Capacity where available
- Covered/uncovered status where available
- Nearby building or campus place relationship

### Restrooms

- Restroom ID
- Building relationship
- Floor
- Public access status
- Single-occupancy status
- Gender-inclusive status
- Accessible status

### Dining And Coffee

- Name
- Category
- Point geometry
- Building relationship
- Public access status
- Source system or owning department

### Residential Buildings

- Official residential building ID
- Official name
- Housing community or college relationship
- Polygon and centroid
- Public entrance points
- Residential office/community entrance points
- Accessibility status where available

## Optional/Future

### Parking And Transit

- Parking lot/structure polygons
- Accessible spaces
- Shuttle stops
- Trolley station entrances
- Bike/scooter parking

### Indoor Floorplans And Rooms

- Building ID
- Room ID/name/number
- Floor
- Department ownership where releasable
- Preferred public entrance
- Indoor route hints where permitted

Indoor data should only be imported when UCSD explicitly approves its use. TritonNav should continue to route to entrances, not fabricate indoor turn-by-turn guidance.

## Questions For UCSD GIS

- Which datasets can be used publicly in a student-facing app?
- Which datasets are internal-only and must not be shipped to Vercel or client browsers?
- Are entrance/accessibility layers available with verification dates?
- Is there an official campus pedestrian network that can enhance or replace OSM-derived Valhalla routing?
- Are temporary closures available through an API or published feed?
- Can building codes, aliases, and residence-hall names be redistributed?
- Are room/floorplan datasets permitted, and if so at what granularity?
