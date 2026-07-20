# TritonNav Backend Roadmap

Date: 2026-07-20  
Status: Planning only  
Do not implement backend during the preservation task.

## 1. Backend Goal

TritonNav should eventually use one canonical online data layer for web and mobile campus navigation. The backend should support:

- buildings
- rooms
- entrances
- route nodes
- route edges
- campus pathways
- accessibility metadata
- aliases
- search
- hours
- services
- closures and detours
- provenance and verification dates
- route APIs
- mobile-compatible caching

Recommended backend: Supabase PostgreSQL with PostGIS.

Official references:

- Supabase PostGIS: https://supabase.com/docs/guides/database/extensions/postgis
- Supabase pgRouting: https://supabase.com/docs/guides/database/extensions/pgrouting
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase backups: https://supabase.com/docs/guides/platform/backups
- PostGIS: https://postgis.net/

## 2. Supabase Project Setup

### Phase 1: Project Creation

1. Create a Supabase project for TritonNav.
2. Keep production and development projects separate if possible.
3. Store project URLs and anon keys in environment variables.
4. Never commit service-role keys.
5. Enable Row Level Security on all public tables before exposing client access.

### Phase 2: Extensions

Enable required extensions:

```sql
create extension if not exists postgis;
create extension if not exists pgrouting;
```

Use dashboard extension controls if direct SQL extension creation is restricted.

### Phase 3: Environments

Recommended environments:

- local development
- staging
- production

Each environment should have:

- independent Supabase project or isolated schema
- migration history
- seed data
- backup policy
- documented env vars

## 3. PostgreSQL Schema

Design principles:

- one canonical data model
- PostGIS geometry/geography for spatial data
- normalized aliases
- provenance fields
- verification timestamps
- accessibility metadata
- future indoor navigation support
- safe public reads for guest navigation
- restricted writes for admins/import scripts

### Core Tables

#### `categories`

Purpose: classify campus entities.

Fields:

- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `parent_id uuid references categories(id)`
- `icon text`
- `sort_order integer`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Examples:

- academic
- classroom
- library
- residence
- dining
- recreation
- parking
- transit
- accessibility

#### `buildings`

Purpose: canonical campus building records.

Fields:

- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `short_name text`
- `official_code text`
- `category_id uuid references categories(id)`
- `address text`
- `center geography(Point, 4326) not null`
- `footprint geometry(Polygon, 4326)`
- `levels jsonb`
- `is_public boolean default true`
- `source_name text`
- `source_url text`
- `source_updated_at timestamptz`
- `verified_at timestamptz`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

#### `rooms`

Purpose: room-level destinations inside buildings.

Fields:

- `id uuid primary key`
- `building_id uuid references buildings(id) not null`
- `room_number text not null`
- `normalized_room_number text not null`
- `level text`
- `category_id uuid references categories(id)`
- `nearest_entrance_id uuid references entrances(id)`
- `indoor_node_id uuid references indoor_nodes(id)`
- `instructions text`
- `is_public boolean default true`
- `source_name text`
- `source_url text`
- `verified_at timestamptz`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Unique constraint:

```sql
unique (building_id, normalized_room_number)
```

#### `entrances`

Purpose: route endpoints at buildings.

Fields:

- `id uuid primary key`
- `building_id uuid references buildings(id) not null`
- `name text not null`
- `kind text`
- `location geography(Point, 4326) not null`
- `level text`
- `is_accessible boolean default false`
- `has_power_door boolean`
- `notes text`
- `source_name text`
- `source_url text`
- `verified_at timestamptz`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

#### `aliases`

Purpose: canonical search aliases across entity types.

Fields:

- `id uuid primary key`
- `entity_type text not null`
- `entity_id uuid not null`
- `alias text not null`
- `normalized_alias text not null`
- `priority integer default 0`
- `source_name text`
- `verified_at timestamptz`
- `created_at timestamptz default now()`

Index:

```sql
create index aliases_normalized_alias_idx on aliases (normalized_alias);
```

#### `services`

Purpose: destination-linked campus services.

Fields:

- `id uuid primary key`
- `building_id uuid references buildings(id)`
- `category_id uuid references categories(id)`
- `name text not null`
- `description text`
- `url text`
- `location geography(Point, 4326)`
- `level text`
- `source_name text`
- `source_url text`
- `verified_at timestamptz`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Examples:

- RIMAC open rec
- Outback gear rentals
- dining
- library service desk
- transit office

#### `hours`

Purpose: current or sourced operating hours.

Fields:

- `id uuid primary key`
- `entity_type text not null`
- `entity_id uuid not null`
- `day_of_week integer`
- `opens_at time`
- `closes_at time`
- `valid_from date`
- `valid_to date`
- `is_closed boolean default false`
- `source_url text`
- `last_checked_at timestamptz`
- `notes text`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Rule:

- Do not hardcode volatile hours in app bundles.
- Prefer official URLs or scheduled syncs.

## 4. PostGIS

PostGIS should power:

- nearest destination lookup
- nearest entrance lookup
- campus polygon queries
- college boundary queries
- route-node snapping
- distance calculations
- bounding-box map loading
- future vector tile generation

Recommended indexes:

```sql
create index buildings_center_gix on buildings using gist (center);
create index buildings_footprint_gix on buildings using gist (footprint);
create index entrances_location_gix on entrances using gist (location);
create index services_location_gix on services using gist (location);
```

## 5. Campus Building Import

### Initial Import

Seed from current static files:

- `data/locations.js`
- `lib/buildings.js`
- `data/colleges.js`
- `data/recreationFacilities.js`

### Future Official Import

Preferred official sources:

- UCSD GIS/building data if available
- official facilities data
- official room/instruction data
- official accessibility maps
- official recreation/dining/library sources

Import requirements:

- source name
- source URL
- import date
- verification date
- confidence level
- manual override support

## 6. Entrances

Entrances must become first-class route targets.

Required attributes:

- exact location
- building relation
- level/floor
- accessible status
- power-door availability
- stairs/ramp nearby
- user-facing label
- notes
- source and verification date

Routing should target an entrance first, then provide final indoor/room instructions.

## 7. Route Nodes and Edges

### `outdoor_nodes`

Fields:

- `id uuid primary key`
- `location geography(Point, 4326) not null`
- `name text`
- `node_type text`
- `is_accessible boolean default true`
- `source_name text`
- `source_url text`
- `verified_at timestamptz`
- `created_at timestamptz default now()`

Node types:

- walkway_intersection
- entrance_connection
- transit_stop
- parking_connection
- elevator_connection
- ramp_connection
- crosswalk
- plaza

### `outdoor_edges`

Fields:

- `id uuid primary key`
- `from_node_id uuid references outdoor_nodes(id) not null`
- `to_node_id uuid references outdoor_nodes(id) not null`
- `path geometry(LineString, 4326) not null`
- `distance_meters numeric`
- `walk_cost numeric`
- `wheelchair_cost numeric`
- `bike_cost numeric`
- `slope_percent numeric`
- `stairs boolean default false`
- `is_accessible boolean default true`
- `lighting_level text`
- `construction_status text`
- `closure_id uuid references closures(id)`
- `notes text`
- `source_name text`
- `verified_at timestamptz`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Indexes:

```sql
create index outdoor_edges_path_gix on outdoor_edges using gist (path);
create index outdoor_edges_from_idx on outdoor_edges (from_node_id);
create index outdoor_edges_to_idx on outdoor_edges (to_node_id);
```

## 8. Accessibility Attributes

Accessibility should be modeled both as entity metadata and routing weights.

### `accessibility_features`

Fields:

- `id uuid primary key`
- `entity_type text not null`
- `entity_id uuid not null`
- `feature_type text not null`
- `description text`
- `severity text`
- `verified_at timestamptz`
- `source_name text`
- `source_url text`
- `created_at timestamptz default now()`

Feature types:

- ramp
- elevator
- accessible_entrance
- curb_cut
- stairs
- steep_slope
- narrow_path
- tactile_paving
- construction_barrier

User routing preferences:

- avoid stairs
- prefer accessible entrances
- minimize slope
- avoid unpaved paths
- avoid construction

## 9. Aliases and Search

Search should have one canonical implementation.

Backend responsibilities:

- store aliases
- normalize aliases
- expose destination search API
- rank exact code/room matches first
- preserve current behavior from `lib/searchIndex.js`

Client responsibilities:

- use shared search package for offline/static fallback
- call API when online
- avoid parallel ranking behavior

Future search stack:

1. Current in-memory search as baseline.
2. SQL-backed search with normalized aliases.
3. Optional PostgreSQL full-text search or trigram indexes.
4. Optional cached local index for mobile offline mode.

Potential indexes:

```sql
create extension if not exists pg_trgm;
create index aliases_trgm_idx on aliases using gin (normalized_alias gin_trgm_ops);
```

## 10. Validation

Add validation before importing online data.

Recommended validation:

- required coordinates
- valid latitude/longitude ranges
- unique slugs
- unique room per building
- non-empty aliases
- valid PostGIS geometry
- source URL when imported from official data
- verification date
- accessibility flag consistency
- route graph connectivity

Future shared validation package:

```text
packages/validation/
```

Use it for:

- seed scripts
- API writes
- admin UI
- mobile cache validation

## 11. Provenance and Verification Dates

Every imported or manually curated record should include:

- `source_name`
- `source_url`
- `source_updated_at`
- `verified_at`
- `verified_by`
- `confidence`
- `notes`

Do not treat manually approximated coordinates as official GIS data.

## 12. Routing API

Initial route API shape:

```http
GET /api/routes?originLat=...&originLng=...&destinationId=...&profile=walking
```

Profiles:

- walking
- accessible
- avoid_stairs
- shortest
- safest

Response shape:

```json
{
  "routeId": "temporary-or-persisted-id",
  "profile": "walking",
  "distanceMeters": 640,
  "estimatedWalkMinutes": 8,
  "geometry": {
    "type": "LineString",
    "coordinates": []
  },
  "steps": [],
  "warnings": [],
  "destination": {},
  "entrance": {}
}
```

Implementation phases:

1. JavaScript Dijkstra/A* over small graph.
2. Supabase RPC backed by pgRouting.
3. Optional dedicated routing service only if needed.

## 13. Caching

Web caching:

- cache read-only campus datasets by version
- keep static fallback for demos
- avoid caching private user schedule data in public storage

Mobile caching:

- cache destination index
- cache route graph version
- cache recent successful routes
- support offline campus search
- invalidate when dataset version changes

Suggested tables:

- `dataset_versions`
- `import_runs`
- `mobile_cache_manifests`

## 14. Closures and Detours

### `closures`

Fields:

- `id uuid primary key`
- `name text not null`
- `description text`
- `affected_entity_type text`
- `affected_entity_id uuid`
- `geometry geometry(Geometry, 4326)`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `severity text`
- `source_name text`
- `source_url text`
- `verified_at timestamptz`
- `created_at timestamptz default now()`
- `updated_at timestamptz default now()`

Routing should either:

- remove affected edges
- increase edge cost
- warn the user

## 15. Administrative Updates

Future admin surface can remain web-based.

Admin capabilities:

- review imported buildings
- edit aliases
- verify entrances
- mark accessibility features
- add closures/detours
- update service URLs
- flag stale data
- approve route graph changes

Security:

- admin-only roles
- RLS policies
- audit logs
- no service-role keys in browser clients

## 16. Monitoring

Monitor:

- failed route API calls
- slow route calculations
- search no-result queries
- stale data warnings
- import failures
- closure/detour updates
- Supabase error rates
- mobile cache version mismatches

Suggested metrics:

- route calculation latency
- search latency
- most searched destinations
- no-result terms
- fallback-origin usage
- accessibility-route usage

## 17. Security

Security requirements:

- enable RLS on public tables
- public read policies only for non-sensitive campus data
- admin writes through authenticated roles
- service-role key server-side only
- do not expose secrets in mobile bundles
- do not commit `.env.local`
- do not commit signing certificates
- validate all route/API parameters
- rate-limit write endpoints and expensive route calculations

## 18. Backups

Backup requirements:

- daily managed Supabase backups for production when plan supports it
- manual backup before schema migrations
- export seedable campus data
- keep migration files versioned
- test restore process
- never backup private data into a public repository

Recommended backup command pattern for future work:

```bash
supabase db dump --file backup.sql
```

Exact commands should be verified against the active Supabase CLI version before use.

## 19. Testing

Backend testing should include:

- schema migration tests
- seed import tests
- coordinate validation tests
- alias normalization tests
- search ranking tests
- route graph connectivity tests
- route profile tests
- accessibility route tests
- RLS policy tests
- API contract tests
- mobile cache compatibility tests

Start with tests around current code:

- `lib/searchIndex.js`
- `lib/navigation.js`
- `lib/distance.js`
- `services/navigationService.js`

## 20. Mobile API Compatibility

The mobile app needs stable API contracts.

Requirements:

- versioned endpoints
- explicit dataset version
- GeoJSON route responses
- consistent entity IDs
- offline cache manifest
- low payload size
- no web-only response fields
- no dependency on Google Maps iframe

Potential API groups:

```text
/api/v1/search
/api/v1/destinations/:id
/api/v1/routes
/api/v1/dataset-version
/api/v1/closures
```

Do not implement these APIs until the preservation branch, build pipeline, and shared domain tests are stable.

## 21. Incremental Backend Plan

### Step 1: Stabilize Current App

- fix build/lint timeouts
- add tests
- update stale README

### Step 2: Validate Static Data

- create schemas
- validate current locations/buildings/rooms/colleges/facilities
- fix data inconsistencies

### Step 3: Create Supabase Project

- set up development database
- enable PostGIS
- enable pgRouting if available
- create migrations

### Step 4: Seed Current Data

- import current static JS data
- preserve IDs/slugs where possible
- add provenance fields
- mark approximated coordinates as manual

### Step 5: Read-Only Data Adapter

- add data service
- keep static fallback
- do not remove current JS data immediately

### Step 6: Routing Graph

- define nodes and edges
- seed small campus graph
- implement route API
- render real route GeoJSON in future MapLibre UI

### Step 7: Admin and Maintenance

- add admin workflows only after core public data reads are stable
- support closures, detours, and verification updates

## 22. Explicit Non-Goals for Preservation

Do not do these yet:

- create Supabase project files
- implement database migrations
- add API routes
- generate Expo app
- generate `ios/`
- replace the map UI
- rewrite in SwiftUI
- create a second deployment
