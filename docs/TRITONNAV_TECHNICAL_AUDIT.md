# TritonNav Technical Audit

Date: 2026-07-20  
Repository: `/Users/diegocordova/Desktop/TritonNav`  
Branch audited: `main`  
Latest audited commit: `bf19c44 Build map-first campus search experience`

## 1. Repository Overview

TritonNav is a working Next.js App Router and React prototype for UC San Diego campus wayfinding. The current product is a client-heavy MVP with static campus datasets, browser geolocation, map-first homepage search, room-aware route previews, and Google Maps iframe/link handoff.

### Folder Structure

```text
.
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── navigation/
│   │   ├── page.js
│   │   └── NavigationClient.jsx
│   └── search/
│       └── page.js
├── components/
│   ├── ClassCard.jsx
│   ├── DirectionsPanel.jsx
│   ├── MapView.jsx
│   ├── RouteBottomSheet.jsx
│   ├── SearchBar.jsx
│   └── Layout/
│       ├── Container.jsx
│       └── Navbar.jsx
├── data/
│   ├── colleges.js
│   ├── locations.js
│   ├── recreationFacilities.js
│   └── schedule.json
├── hooks/
│   ├── useLocation.js
│   └── useNavigation.js
├── lib/
│   ├── buildings.js
│   ├── distance.js
│   ├── navigation.js
│   ├── reverseGeocode.js
│   ├── schedule.js
│   ├── searchIndex.js
│   └── utils.js
├── services/
│   ├── authService.js
│   ├── mapsService.js
│   └── navigationService.js
├── store/
│   └── useNavigationStore.js
├── styles/
│   └── globals.css
├── public/
│   └── images/buildings/README.md
├── starter-code/
│   └── triton-nav-mvp/
├── README.md
├── jsconfig.json
├── package.json
├── package-lock.json
└── .gitignore
```

### Tracked Runtime Files

- App routes: `app/layout.js`, `app/page.js`, `app/search/page.js`, `app/navigation/page.js`, `app/navigation/NavigationClient.jsx`.
- Reusable UI: `components/SearchBar.jsx`, `components/MapView.jsx`, `components/DirectionsPanel.jsx`, `components/RouteBottomSheet.jsx`, `components/ClassCard.jsx`, `components/Layout/*`.
- Domain logic: `lib/navigation.js`, `lib/searchIndex.js`, `lib/buildings.js`, `lib/distance.js`, `lib/reverseGeocode.js`, `services/navigationService.js`, `services/mapsService.js`.
- State/geolocation: `store/useNavigationStore.js`, `hooks/useLocation.js`, `hooks/useNavigation.js`.
- Static datasets: `data/locations.js`, `data/colleges.js`, `data/recreationFacilities.js`, `lib/buildings.js`, `lib/schedule.js`, `data/schedule.json`.
- Styling: `styles/globals.css`.
- Configuration: `package.json`, `package-lock.json`, `jsconfig.json`, `.gitignore`.

### Ignored Local or Generated Files

The repository correctly ignores common generated/private artifacts:

- `.next/`
- `node_modules/`
- `dist/`
- `coverage/`
- `.env.local`
- `.env*.local`
- `.DS_Store`
- PDFs
- brand/design folders and local poster/screenshot artifacts

Current ignored local artifacts observed during audit:

- `.DS_Store`
- `.env.local`
- `.next/`
- `node_modules/`
- `TritonNav Poster — Design for America UCSD.pdf`
- `TritonNav_Poster.html`
- `TritonNav_branding/`
- `UCSD fonts:colors/`
- `tritonnav_creenshots/`
- `tritonnav_poster_concepts.html`

### Environment Variables

`.env.local` exists and is ignored. No secret values were exposed in this audit. The only key name detected is:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

The current code does not require this key for the existing iframe/embed URL behavior.

## 2. Existing Architecture

### Frontend Architecture

TritonNav is a Next.js App Router application with client components for the interactive navigation experience.

- `app/layout.js` wraps all pages in `Navbar` and `Container`.
- `app/page.js` is the map-first homepage. It owns the current search input, featured/demo searches, inline Google Maps iframe, destination selection, route SVG overlay, college boundary overlay, route preview card, and facility CTA rendering.
- `app/search/page.js` is a separate search flow using `SearchBar` and the shared navigation store.
- `app/navigation/page.js` provides a `Suspense` wrapper.
- `app/navigation/NavigationClient.jsx` reads URL params, resolves route data through `useNavigation`, and composes `MapView`, `DirectionsPanel`, and `RouteBottomSheet`.

State is held in two ways:

- Homepage-local state in `app/page.js` for the map-first demo flow.
- Shared Zustand state in `store/useNavigationStore.js` for route/search/geolocation state across `/search` and `/navigation`.

### Backend Architecture

There is no backend in the current repository.

- No `app/api/*` routes exist.
- No database client exists.
- No ORM, migrations, schema files, or server-side route engine exist.
- `services/authService.js` is a placeholder for future UCSD sign-in behavior.

### Map Implementation

Current map implementation is Google Maps URL/embed based:

- `services/mapsService.js` builds Google Maps direction URLs and iframe embed URLs.
- `components/MapView.jsx` renders a Google Maps iframe on `/navigation`.
- `app/page.js` renders a separate Google Maps iframe for the homepage.
- `app/page.js` overlays TritonNav-owned SVG UI on top of the iframe:
  - approximate route polyline
  - origin marker
  - destination marker
  - college polygon placeholder

Important limitation: Google Maps iframe content is not programmatically controllable. The current route line is a TritonNav overlay, not a native map layer.

### Routing Logic

Routing is currently approximate and static-data based:

- `lib/navigation.js` resolves destination input to college, recreation facility, building, or location.
- `services/navigationService.js` builds route details, distance, origin label, destination label, and walking estimate.
- `lib/distance.js` computes Haversine distance, feet formatting, and walking-time estimates.
- `app/page.js` has additional route preview geometry functions for drawing a stylized SVG route overlay.
- Google Maps handoff URLs are generated but should eventually be de-prioritized for the North Star.

### Reusable Components

- `SearchBar.jsx`: reusable search input and suggestion list used by `/search`.
- `MapView.jsx`: iframe map/details card for `/navigation`.
- `DirectionsPanel.jsx`: desktop route instructions and known entrances.
- `RouteBottomSheet.jsx`: mobile trip summary sheet.
- `ClassCard.jsx`: class schedule card, currently not referenced by live routes.
- `Navbar.jsx` and `Container.jsx`: global layout wrappers.

### Utilities, Hooks, and Services

- `hooks/useLocation.js`: browser geolocation watcher with permission state and retry support.
- `hooks/useNavigation.js`: hydrates destination from URL params and combines location with navigation data.
- `store/useNavigationStore.js`: Zustand state for destination selection, search query, map state, geolocation state, and bottom sheet expansion.
- `lib/searchIndex.js`: in-memory ranked campus search index.
- `lib/navigation.js`: destination resolution and route data creation.
- `lib/buildings.js`: structured building/room/entrance data.
- `lib/reverseGeocode.js`: UCSD-first reverse geocoding against known static locations.
- `lib/distance.js`: distance and walk time primitives.
- `lib/utils.js`: generic formatting helpers, currently unused.
- `services/mapsService.js`: Google Maps URL/embed builders.
- `services/navigationService.js`: route detail builder.
- `services/authService.js`: future sign-in placeholder.

### Assets

- `public/images/buildings/README.md` exists, but no production building images are currently tracked.
- Branding/design PDFs, screenshots, and font/color resources exist locally but are ignored or non-runtime.
- Some proposal/pitch PDF/docx files are tracked, but they are not application runtime assets.

### Configuration

- `package.json`: minimal scripts and dependencies.
- `package-lock.json`: lockfile version 3.
- `jsconfig.json`: path alias `@/* -> ./*`.
- `.gitignore`: covers dependency/build outputs, local env files, PDFs, branding folders, and local design artifacts.

## 3. Current Features

### Search

Implemented through `lib/searchIndex.js` and exposed by `searchCampusLocations` in `lib/navigation.js`.

Supports:

- building names
- acronyms/short names
- room numbers
- aliases
- partial matching
- subsequence matching
- Levenshtein typo tolerance
- schedule/course documents
- college results
- recreation facility results

Search result priority:

1. classroom
2. course
3. recreation
4. college
5. other locations/buildings

### Data Coverage

Current static coverage includes:

- 17 campus location entries in `data/locations.js`
- 8 college entries with approximate polygons in `data/colleges.js`
- 7 recreation facilities with official UCSD Rec links in `data/recreationFacilities.js`
- 13 structured building entries or nested building objects in `lib/buildings.js`

Known room/building data includes CSB, FAH, CSE, MOS, DIB, Mandeville, Warren Lecture Hall, Center Hall, Peterson Hall, York Hall, AP&M, Pepper Canyon/York neighborhood, and Price Center.

### Homepage

`app/page.js` is map-first:

- search bar
- demo quick actions
- featured destination chips
- result cards
- current location pill
- Google Maps iframe
- SVG route line
- origin and destination markers
- route preview card
- college detail panel
- UCSD Rec facility links
- prototype badge

### Navigation Page

`/navigation` supports URL param based route previews:

- `?building=cse&room=1202`
- route details
- embedded Google Maps map preview
- text instructions
- mobile bottom sheet
- location permission/error messaging

### Search Page

`/search` uses the reusable `SearchBar` component and shared store to preview route destinations.

### Geolocation

`useLocation` uses browser geolocation watch mode with:

- permission query support
- location permission state
- denied/error fallback state
- retry mechanism

### Authentication

`services/authService.js` contains a placeholder function only. TritonLink SSO is not implemented.

## 4. Duplicate Feature Report

This section answers the critical rule: do not rebuild features that already exist. The repository already contains several working implementations that should be reused or refactored rather than duplicated.

### Map Rendering

Existing implementations:

- `app/page.js`: homepage Google Maps iframe plus TritonNav SVG overlay.
- `components/MapView.jsx`: `/navigation` Google Maps iframe card.
- `services/mapsService.js`: shared Google Maps URL/embed helpers.

Recommendation:

- Extend/refactor, do not create another map component.
- Preserve `services/mapsService.js` while Google Maps handoff remains.
- For future in-app maps, introduce one new shared map abstraction only after choosing MapLibre. Then migrate `app/page.js` and `MapView.jsx` onto that shared renderer.

Status:

- Should be refactored later because map rendering is duplicated between homepage and navigation page.

### Route Calculation and Preview

Existing implementations:

- `lib/distance.js`: distance and walking-time primitives.
- `services/navigationService.js`: route detail builder.
- `app/page.js`: separate homepage route geometry, projected points, route distance, and route preview card data.

Recommendation:

- Reuse `lib/distance.js`.
- Refactor homepage-only geometry into a shared `lib/routePreview` or future routing module.
- Do not create a separate route calculator.

Status:

- Should be refactored. It is functional, but route-preview calculation is split across page and services.

### Search

Existing implementations:

- `lib/searchIndex.js`: canonical search index and ranking.
- `lib/navigation.js`: `searchCampusLocations` wrapper.
- `components/SearchBar.jsx`: reusable search UI used by `/search`.
- `app/page.js`: custom map-first search UI using the same search logic.

Recommendation:

- Keep `lib/searchIndex.js` as the single search engine.
- Refactor shared result-card formatting helpers out of `app/page.js` if the UI expands.
- Do not build another search index.

Status:

- Search engine should remain unchanged.
- Search UI is intentionally different for homepage vs `/search`, but formatting logic can be consolidated.

### Location Services

Existing implementations:

- `hooks/useLocation.js`: browser geolocation.
- `store/useNavigationStore.js`: geolocation state.
- `lib/reverseGeocode.js`: UCSD-first origin naming.

Recommendation:

- Reuse `useLocation` everywhere.
- Avoid adding another geolocation hook.

Status:

- Remain unchanged for now.

### Destination Data Models

Existing data:

- `data/locations.js`: general campus locations.
- `lib/buildings.js`: structured building/room/entrance data.
- `data/colleges.js`: college centers, polygons, associated buildings, residence halls, landmarks.
- `data/recreationFacilities.js`: recreation facilities and official CTA links.

Recommendation:

- Do not create new parallel static datasets.
- Future online schema should migrate and unify these datasets rather than adding a fifth source of truth.

Status:

- Should be consolidated over time because `data/locations.js` and `lib/buildings.js` contain overlapping building identities and coordinates.

### Navigation UI

Existing implementations:

- `RouteBottomSheet.jsx`
- `DirectionsPanel.jsx`
- `MapView.jsx`
- homepage route preview card in `app/page.js`

Recommendation:

- Preserve the homepage route preview as the demo-first experience.
- Reuse `RouteBottomSheet`/`DirectionsPanel` patterns if route UI gets richer.
- Do not introduce a second mobile sheet.

Status:

- Remain unchanged until MapLibre/routing architecture is selected.

### Authentication

Existing implementation:

- `services/authService.js`: placeholder `signInWithUcsd`.

Recommendation:

- Extend this placeholder when TritonLink SSO work begins.
- Do not add a second auth service file without deprecating this one.

Status:

- Placeholder; keep but mark as future work.

## 5. Dead Code Report

Potential unused or stale files/functions:

- `components/ClassCard.jsx`: no current source import besides README mention. It appears left over from the earlier schedule-card homepage.
- `services/authService.js`: placeholder, unused.
- `lib/utils.js`: `formatCoords` and `titleCase` are not referenced in source.
- `data/schedule.json`: tracked but not imported; `lib/schedule.js` provides the active `MOCK_SCHEDULE`.
- `starter-code/triton-nav-mvp/`: present but appears empty in the audited tree.
- README copy is partially stale: it still describes the home screen as demo class cards, but `app/page.js` is now map-first.

Potential stale tracked artifacts:

- `TritonNav_Pitch_v2.pdf`
- `TritonNav_SDUTC_Proposal.docx`
- `TritonNav_SDUTC_Proposal.pdf`

These may be useful project materials, but they are not app runtime files.

Recommendation:

- Do not delete anything during this audit.
- In a cleanup task, confirm whether `ClassCard.jsx`, `data/schedule.json`, `lib/utils.js`, and proposal files should remain.
- Update README before the next demo or public release.

## 6. Build Status

Commands were run from `/Users/diegocordova/Desktop/TritonNav` with `NEXT_TELEMETRY_DISABLED=1` where applicable.

### Install

Command:

```bash
npm install
```

Result:

- Passed on retry.
- Installed ignored local dependencies in `node_modules/`.
- Reported 2 moderate vulnerabilities through `npm audit`; no dependency changes were made during the audit.

### Lint

Command:

```bash
npm run lint
```

Result:

- Failed because the current `lint` script uses `next lint`, which this installed Next.js version interprets as an invalid project directory:

```text
> triton-nav@0.1.0 lint
> next lint

Invalid project directory provided, no such directory: /Users/diegocordova/Desktop/TritonNav/lint
```

### Typecheck

Command:

```bash
npm run typecheck
```

Result:

- Skipped because no `typecheck` script exists.

### Tests

Command:

```bash
npm test
```

Result:

- Skipped because no `test` script exists.

### Production Build

Command:

```bash
npm run build
```

Result:

- Passed.

```text
> triton-nav@0.1.0 build
> next build

✓ Compiled successfully
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /navigation
└ ○ /search
```

### Outdated Packages

Command:

```bash
npm outdated
```

Result:

```text
Package    Current   Wanted   Latest
next        16.2.6  16.2.10  16.2.10
react       18.3.1   18.3.1   19.2.7
react-dom   18.3.1   18.3.1   19.2.7
zustand     5.0.13   5.0.14   5.0.14
```

Recommendation:

- Treat the invalid lint script and missing automated tests as the first engineering blockers before adding major features.
- Add a real `typecheck` script only if TypeScript is introduced.
- Add tests for search ranking, destination resolution, and route details before migrating data online.

## 7. Technical Debt

### High Priority

- `npm run lint` is invalid for the installed Next.js version, and CI confidence is weak without tests.
- Map implementation depends on Google Maps iframe, which cannot support true in-app route layers, offline vector data, or custom campus routing.
- Route geometry is split between `app/page.js`, `lib/distance.js`, and `services/navigationService.js`.
- Campus data is split across multiple static files with overlapping concepts.

### Medium Priority

- No tests for search ranking, destination resolution, or distance math.
- No backend/API/data persistence layer.
- No typed schema or runtime validation for campus data.
- README is stale relative to map-first homepage.
- Existing route page still emphasizes Google Maps handoff, conflicting with the stated vision of staying inside TritonNav.

### Low Priority

- `ClassCard.jsx`, `lib/utils.js`, `data/schedule.json`, and `authService.js` need explicit keep/remove decisions.
- Styling is centralized in one large `globals.css` file.

## 8. Database Recommendation

### Recommendation: Supabase PostgreSQL with PostGIS

Supabase is the best near-term online database choice for TritonNav because it gives the project managed PostgreSQL plus geospatial extensions, authentication integration, Row Level Security, and a relatively smooth path from static MVP data to production campus data.

Sources consulted:

- Supabase PostGIS docs: https://supabase.com/docs/guides/database/extensions/postgis
- Supabase pgRouting docs: https://supabase.com/docs/guides/database/extensions/pgrouting
- Supabase Row Level Security docs: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Auth docs: https://supabase.com/docs/guides/auth
- PostGIS official docs: https://postgis.net/
- Firebase Firestore docs: https://firebase.google.com/docs/firestore
- Firebase geoquery docs: https://firebase.google.com/docs/firestore/solutions/geoqueries

### Supabase

Strengths:

- PostgreSQL foundation.
- PostGIS support for points, polygons, spatial indexes, nearest-neighbor queries, containment, and distance.
- pgRouting support for graph routing if enabled/available in the project.
- SQL schema fits buildings, entrances, walkways, nodes, edges, accessibility metadata, and future indoor graph models.
- Row Level Security works well for future student profiles and schedule-linked data.
- Supabase Auth can be extended for future SSO/OIDC patterns.
- Easy to start by seeding current JS data into tables.

Weaknesses:

- Requires relational schema discipline.
- More up-front modeling than Firebase.
- Real-time route collaboration is not the primary use case, though Supabase Realtime can help if needed later.

Fit for TritonNav:

- Best fit.
- Campus navigation is graph/geospatial data, not just document sync.

### Plain PostgreSQL

Strengths:

- Maximum control.
- PostGIS and pgRouting are mature and open.
- Good fit for routing graphs and GIS.

Weaknesses:

- Requires hosting, auth, backups, APIs, and security setup.
- More operational overhead for an MVP team.

Fit for TritonNav:

- Excellent long-term database engine.
- Supabase is the recommended managed way to get PostgreSQL/PostGIS faster.

### Firebase / Firestore

Strengths:

- Strong mobile SDKs.
- Offline sync and real-time listeners are excellent.
- Firebase Auth is mature.
- Good for user profiles, saved destinations, and app settings.

Weaknesses:

- Firestore is document-oriented, not a natural fit for route graphs.
- Geoqueries require geohash-style modeling and are less expressive than PostGIS.
- Complex graph traversal, weighted edges, accessibility constraints, and indoor routing become awkward.

Fit for TritonNav:

- Good for some mobile/user features.
- Not recommended as the primary campus navigation database.

### Proposed Schema

Use PostgreSQL with PostGIS geometry/geography columns. Keep names conceptual here; exact migrations should be generated in a dedicated backend setup task.

#### `categories`

- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `parent_id uuid references categories(id)`
- `icon text`
- `sort_order integer`

Examples: academic, classroom, library, residence, dining, parking, recreation, transit, restroom, elevator.

#### `buildings`

- `id uuid primary key`
- `slug text unique not null`
- `name text not null`
- `short_name text`
- `official_code text`
- `category_id uuid references categories(id)`
- `address text`
- `description text`
- `center geography(Point, 4326) not null`
- `footprint geometry(Polygon, 4326)`
- `levels jsonb`
- `source text`
- `source_updated_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `aliases`

- `id uuid primary key`
- `entity_type text not null`
- `entity_id uuid not null`
- `alias text not null`
- `normalized_alias text not null`
- `priority integer default 0`

Use for acronyms, room lookup, common nicknames, UCSD naming variants, and typo-friendly search.

#### `entrances`

- `id uuid primary key`
- `building_id uuid references buildings(id)`
- `name text not null`
- `kind text`
- `location geography(Point, 4326) not null`
- `level text`
- `is_accessible boolean default false`
- `has_power_door boolean`
- `notes text`

#### `rooms`

- `id uuid primary key`
- `building_id uuid references buildings(id)`
- `room_number text not null`
- `normalized_room_number text not null`
- `level text`
- `category_id uuid references categories(id)`
- `nearest_entrance_id uuid references entrances(id)`
- `indoor_node_id uuid references indoor_nodes(id)`
- `instructions text`

#### `outdoor_nodes`

- `id uuid primary key`
- `location geography(Point, 4326) not null`
- `name text`
- `node_type text`
- `is_accessible boolean default true`
- `source text`

#### `outdoor_edges`

- `id uuid primary key`
- `from_node_id uuid references outdoor_nodes(id)`
- `to_node_id uuid references outdoor_nodes(id)`
- `path geometry(LineString, 4326) not null`
- `distance_meters numeric`
- `walk_cost numeric`
- `wheelchair_cost numeric`
- `slope_percent numeric`
- `stairs boolean default false`
- `construction_status text`
- `is_accessible boolean default true`
- `notes text`

#### `indoor_nodes`

- `id uuid primary key`
- `building_id uuid references buildings(id)`
- `level text`
- `name text`
- `node_type text`
- `location_hint text`
- `approx_location geography(Point, 4326)`

#### `indoor_edges`

- `id uuid primary key`
- `building_id uuid references buildings(id)`
- `from_node_id uuid references indoor_nodes(id)`
- `to_node_id uuid references indoor_nodes(id)`
- `distance_meters numeric`
- `walk_cost numeric`
- `wheelchair_cost numeric`
- `requires_elevator boolean default false`
- `stairs boolean default false`
- `notes text`

#### `accessibility_features`

- `id uuid primary key`
- `entity_type text not null`
- `entity_id uuid not null`
- `feature_type text not null`
- `description text`
- `verified_at timestamptz`
- `source text`

Examples: ramp, elevator, accessible entrance, steep slope, stairs, curb cut, tactile paving.

#### `hours`

- `id uuid primary key`
- `entity_type text not null`
- `entity_id uuid not null`
- `day_of_week integer`
- `opens_at time`
- `closes_at time`
- `valid_from date`
- `valid_to date`
- `source_url text`
- `last_checked_at timestamptz`
- `notes text`

Do not hardcode volatile hours in app bundles. Link or sync from official sources.

#### `services`

- `id uuid primary key`
- `building_id uuid references buildings(id)`
- `category_id uuid references categories(id)`
- `name text not null`
- `description text`
- `url text`
- `location geography(Point, 4326)`
- `level text`

Examples: Outback gear rentals, RIMAC open rec, dining services, library service desks.

#### `transit_stops`

- `id uuid primary key`
- `name text not null`
- `location geography(Point, 4326) not null`
- `operator text`
- `stop_code text`
- `source_url text`

#### `parking_assets`

- `id uuid primary key`
- `name text not null`
- `asset_type text`
- `location geography(Point, 4326)`
- `footprint geometry(Polygon, 4326)`
- `permit_types text[]`
- `source_url text`

### Data Migration Path

1. Seed current static JS data into Supabase.
2. Keep local JS data as fallback fixtures.
3. Add a read-only API/data service that can switch between static data and Supabase.
4. Add admin-only import scripts for official GIS, room, accessibility, and hours feeds.
5. Replace static data gradually table by table.

## 9. Routing Recommendation

### Recommended Strategy

Separate routing into four concerns:

1. Map Rendering
2. Campus Data
3. Routing Engine
4. Navigation UI

Do not use Google Maps routing as the primary product path.

### Map Rendering

Recommended:

- Web: MapLibre GL JS
- iOS/native future: MapLibre Native or React Native MapLibre

MapLibre is an open-source WebGL map renderer with a native ecosystem. It supports custom sources and layers, which TritonNav needs for campus paths, entrances, accessibility routes, indoor overlays, and route highlighting.

Source consulted:

- MapLibre GL JS docs: https://www.maplibre.org/maplibre-gl-js/docs/

### Campus Data

Recommended:

- Supabase PostgreSQL/PostGIS as the source of truth.
- Store buildings, entrances, walkways, nodes, edges, polygons, aliases, services, accessibility metadata, and room hints as structured relational/geospatial data.
- Keep all official-source URLs and verification dates.

### Routing Engine

Recommended phases:

1. MVP routing service in JavaScript:
   - load campus graph from static JSON or Supabase
   - run Dijkstra/A* in app/server for a small campus graph
   - support route profiles: walking, accessible, avoid stairs, shortest, safest
2. PostgreSQL/PostGIS/pgRouting:
   - move graph routing into database-backed functions once data volume grows
   - compute edge weights for accessibility, slope, construction, and indoor transitions
3. Optional dedicated routing service:
   - only if pgRouting/API latency or mobile offline constraints require it

### Navigation UI

Preserve the current UI concepts:

- map-first homepage
- search cards
- selected destination card
- route preview card
- bottom sheet
- room instructions

Improve the implementation underneath:

- replace iframe with MapLibre map component
- render route as real map layer
- render destination/origin/entrance markers as map symbols
- render college/building boundaries as GeoJSON layers
- render indoor route segments after arrival at building entrance

### Interaction Flow

```text
User search/selects result
    ↓
searchCampusLocations / future search API resolves entity
    ↓
navigation domain resolves destination + nearest entrance
    ↓
routing engine computes path across campus graph
    ↓
MapLibre renders base map + route GeoJSON + markers + polygons
    ↓
Navigation UI shows distance, ETA, steps, accessibility notes, room instructions
```

## 10. Mapping Recommendation

### Current State

TritonNav currently uses Google Maps iframe embeds and Google Maps direction links. This is adequate for an MVP preview but conflicts with the long-term requirement that navigation remain inside TritonNav.

### Recommended Direction

Adopt MapLibre for in-app map rendering.

Benefits:

- open-source renderer
- custom route layers
- custom markers
- campus-only overlays
- polygon boundaries
- indoor/floor overlays later
- iOS/native path through MapLibre Native ecosystem
- no dependency on Google Maps routing UI

Tile/data options:

- Start with open basemap tiles for demo use.
- Add campus-specific GeoJSON overlays from Supabase.
- Later evaluate hosted vector tiles for performance.
- Keep UCSD-owned/official GIS data separate from generic basemap tiles.

### What to Preserve

- Keep `services/mapsService.js` during transition as a fallback.
- Preserve existing route preview card and search UX.
- Preserve current route state model while swapping map renderer behind it.

## 11. Proposed Architecture

### Preserve Current App Shape

Do not migrate frameworks now. Keep:

- Next.js App Router
- React
- Zustand
- existing routes
- current CSS system
- current static datasets as fallback fixtures

### Add Thin Data Layer

Introduce a future `services/campusDataService` or `lib/campusData` only after the audit:

- `getLocations()`
- `getBuildings()`
- `getRooms()`
- `getColleges()`
- `getRecreationFacilities()`
- `searchDestinations(query)`
- `resolveDestination(input)`

This should wrap existing data first, then Supabase later.

### Consolidate Domain Logic

Future structure:

```text
lib/
├── campus/
│   ├── dataAdapter.js
│   ├── destinationResolver.js
│   ├── searchIndex.js
│   └── schemas.js
├── routing/
│   ├── distance.js
│   ├── graphRouter.js
│   ├── routePreview.js
│   └── routeProfiles.js
└── maps/
    ├── googleMapsFallback.js
    ├── mapLibreLayers.js
    └── geojson.js
```

This should be done incrementally, not as a rewrite.

### Backend

Phase 1:

- no backend needed for the current MVP
- add tests and stabilize build first

Phase 2:

- Supabase project with PostGIS
- seed current data
- read-only API/data adapter

Phase 3:

- route graph tables
- campus routing endpoint or database function
- admin/import scripts for official GIS and room data

### Authentication

Phase 1:

- keep `services/authService.js` placeholder

Phase 2:

- evaluate UCSD/TritonLink SSO feasibility
- if official SSO is unavailable, use Supabase Auth for prototype accounts
- design auth boundaries so guest search remains public

Phase 3:

- student schedule import/SSO only after guest navigation is stable

### Deployment

Keep Vercel for the Next.js app. Add Supabase separately for data. Avoid adding server infrastructure until routing data requires it.

## 12. Migration Risk Assessment

### Low Risk

- Add tests for `lib/searchIndex.js`, `lib/navigation.js`, and `lib/distance.js`.
- Update README.
- Extract homepage route preview helpers into a shared module.
- Add data validation for static datasets.

### Medium Risk

- Consolidate `data/locations.js` and `lib/buildings.js`.
- Introduce Supabase read-only data fetches with static fallback.
- Replace Google iframe with MapLibre while preserving current UI.

### High Risk

- Full rewrite into React Native before the data/routing model is stable.
- Replacing all static data with online data at once.
- Implementing TritonLink SSO before confirming official integration requirements.
- Building indoor navigation before outdoor graph routing is reliable.

### Migration Principle

Every migration should preserve:

- existing search behavior
- existing homepage UX
- existing route preview card
- existing destination URLs
- static fallback data

## 13. Incremental Development Plan

### Phase 0: Stabilize Current Repo

1. Fix the invalid `npm run lint` script and preserve the now-passing install/build flow.
2. Update README to match the map-first homepage.
3. Add basic tests for search and route data.
4. Decide whether to keep/remove stale files.

### Phase 1: Refactor Without Product Change

1. Extract homepage route preview geometry from `app/page.js`.
2. Create shared result formatting helpers.
3. Keep `SearchBar` and homepage custom search UI, but share display helpers.
4. Add static data validation for required fields.

### Phase 2: Map Renderer Upgrade

1. Add MapLibre behind a feature flag.
2. Render current destination markers and route preview as GeoJSON.
3. Keep Google Maps fallback available but no longer primary.
4. Replace college boundary SVG projection with real GeoJSON layer.

### Phase 3: Online Data

1. Create Supabase schema.
2. Seed current static datasets.
3. Add read-only data service with static fallback.
4. Add admin/import scripts for official UCSD data.

### Phase 4: Campus Routing

1. Define outdoor nodes and edges.
2. Implement Dijkstra/A* for a small campus graph.
3. Add route profiles for default walking and accessibility.
4. Add route steps and entrance-aware final-leg routing.

### Phase 5: iOS-Ready Product

1. Extract shared domain package if needed.
2. Reuse campus/search/routing logic in Expo or React Native.
3. Use MapLibre Native-compatible data structures.
4. Add offline cache for core campus graph and destination index.

## 14. Immediate Next Task

Do not begin major feature development yet.

Recommended immediate task:

Fix the invalid lint command and add automated tests around the current search/navigation logic.

Why:

- Lint/test confidence is the foundation for safe incremental work.
- The app currently has no automated tests or typecheck.
- A stable build must exist before introducing MapLibre, Supabase, or routing engine changes.

Suggested first debugging steps:

1. Replace or remove the deprecated/invalid `next lint` script.
2. Add a supported ESLint configuration if linting remains desired.
3. Add tests for `lib/searchIndex.js`, `lib/navigation.js`, and `lib/distance.js`.
4. Keep `npm install` and `npm run build` passing before Expo or Supabase work begins.
5. Consider pinning dependency updates after validation.

## 15. Features Explicitly Reused Instead of Rebuilt

The audit recommends reusing these existing pieces:

- `lib/searchIndex.js` as the canonical search engine.
- `lib/navigation.js` as the canonical destination resolver.
- `lib/distance.js` as the canonical distance primitive.
- `services/navigationService.js` as the route details builder.
- `hooks/useLocation.js` as the canonical browser geolocation hook.
- `store/useNavigationStore.js` as the shared navigation state store.
- `services/mapsService.js` as the Google Maps fallback/handoff service during migration.
- `components/SearchBar.jsx` for reusable search surfaces.
- `components/MapView.jsx`, `DirectionsPanel.jsx`, and `RouteBottomSheet.jsx` as route-page UI patterns.
- Existing static datasets as seed/fallback data for future Supabase tables.

## Final Summary

### Preserved

- Existing Next.js/React architecture.
- Existing map-first homepage.
- Existing search and destination resolution.
- Existing static UCSD building, room, college, and recreation datasets.
- Existing route preview and geolocation behavior.
- Existing UCSD navy/gold visual system.

### Improved

- No production code was changed in this audit.
- The repository is now documented with a technical inventory, duplicate report, build status, and incremental architecture plan.
- Online database, routing, and mapping recommendations are now aligned around in-app navigation rather than Google Maps routing.

### Build Next

1. Fix the invalid lint script and add automated tests.
2. Add tests for search, destination resolution, and route details.
3. Extract duplicate route preview geometry into a shared module.
4. Introduce MapLibre only after build/test confidence improves.
5. Seed current static campus data into Supabase/PostGIS once schema work begins.
