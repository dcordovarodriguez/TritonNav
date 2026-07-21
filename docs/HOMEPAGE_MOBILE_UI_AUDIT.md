# TritonNav Homepage Mobile UI Audit

Date: 2026-07-21  
Homepage entry: `app/page.js`  
Stylesheet: `styles/globals.css`

## 1. Existing Homepage Inventory

The existing homepage was already map-first, but it rendered too many independent panels at the same time.

| Area | Existing implementation | Decision | Notes |
| --- | --- | --- | --- |
| Homepage entry file | `app/page.js` | retain/refactor | Keep one active homepage implementation. Do not create `HomepageV2`. |
| Map canvas | `app/page.js` iframe using `createGoogleMapsEmbedUrl` | retain | Mapping provider is unchanged for this UI-only task. |
| Search logic | `searchCampusLocations` from `lib/navigation.js` | retain | Canonical search logic remains untouched. |
| Destination resolution | `getNavigationData` from `lib/navigation.js` | retain | Reused for selected destination and route preview. |
| Distance logic | `calculateDistanceMeters`, `metersToFeet` from `lib/distance.js` | retain | Reused for route preview calculations. |
| Prototype badge | `.prototype-badge` in old top panel | consolidate | Moved into compact top brand row. |
| Large search + GO | `.map-search-form`, `.map-search-button` | refactor | Replaced with compact search field, clear control, and single submit. |
| Large Demo Mode panel | `.demo-mode-panel` | consolidate | Demo functionality moved into bottom sheet quick actions. |
| Destination chips | `.map-featured-row` | consolidate | Retained as one quick-destination row in discovery sheet. |
| Result cards | `.map-result-list`, `.map-result-card` | refactor | Results now render as one scrollable bottom-sheet list without per-row GO buttons. |
| Raw coordinate location pill | `getLocationLabel` and `.map-location-button` | refactor | Replaced raw coordinates with user-facing location status. |
| Route preview card | `.route-preview-card` | consolidate | Route preview now appears as a bottom-sheet state. |
| Multiple GO buttons | result rows + route card | consolidate | Replaced with one primary action per state. |
| College detail panel | `selectedCollege` details | refactor | Kept as contextual selected-destination supporting copy. |
| Rec links | `selectedRecreationFacility.ctas` | retain/refactor | Kept, limited to relevant CTAs in selected state. |
| SVG route overlay | route polyline/markers in `app/page.js` | retain | Route line now appears only in route-preview state. |
| Header/navigation | `Navbar` hidden through `body:has(.map-first-page)` | retain | Homepage remains full-screen map. |
| Mobile CSS | `@media (max-width: 640px)` | refactor | Added final overrides for compact top search and bottom sheet. |
| Desktop CSS | `@media (min-width: 780px)` override | refactor | Bottom sheet becomes a side panel while preserving state model. |

## 2. Previous UI Problems

Observed issues:

- top panel could scroll independently
- result panel could scroll independently
- page-level scroll was visually confusing
- demo panel dominated the mobile map
- search results and route preview could appear simultaneously
- every result row had its own GO button
- route card had another GO button
- raw coordinates dominated location status
- overlays competed for limited mobile viewport space

## 3. New Mobile Information Architecture

Implemented structure:

```text
FULL-SCREEN MAP
├── compact top brand/search bar
├── compact location status control
└── one contextual bottom sheet
```

The bottom sheet switches states instead of rendering multiple panels simultaneously.

## 4. Bottom-Sheet States

### Discovery

Displays:

- prompt
- short quick-destination row
- subtle demo route actions

Does not display:

- full Demo Mode dashboard
- route metrics
- search results

### Search Results

Displays:

- one vertical results list
- primary destination text
- secondary detail/category text
- tappable rows

Does not display:

- per-row GO buttons
- route preview at the same time

### Destination Selected

Displays:

- selected destination
- distance
- estimated walk time
- route instruction summary
- one `Preview Route` action
- one `Change` action

### Route Preview

Displays:

- destination
- origin
- distance
- estimated walk time
- route summary
- accessibility placeholder
- one `Start Route` action
- one `Change` action

## 5. Overflow and Scroll Rules

Current intended behavior:

- `body:has(.map-first-page)` prevents page-level scrolling.
- `.map-first-page` fills `100dvh`.
- `.campus-map-frame` fills the viewport.
- `.map-bottom-sheet` is the only bottom overlay.
- `.sheet-result-list` is the only vertical scrolling region in the search-results state.
- quick destination rows may scroll horizontally.
- no long stacked dashboard is rendered on mobile.

## 6. Z-Index Layers

Tokens added:

- `--map-z-map`
- `--map-z-route`
- `--map-z-control`
- `--map-z-search`
- `--map-z-sheet`

Layer intent:

1. map iframe
2. route overlay and markers
3. location control
4. top search
5. bottom sheet

## 7. Accessibility Notes

Implemented/retained:

- semantic buttons for sheet actions
- accessible labels for search submit, clear search, location, and sheet handle
- visible focus states
- minimum touch target tokens
- reduced-motion media query
- text labels, not color-only states

Follow-up checks:

- browser screen reader smoke test
- increased text size test
- keyboard-only homepage flow

## 8. Deprecated UI Pieces

Deprecated from the active homepage render:

- large `.demo-mode-panel`
- separate `.map-featured-row`
- `.map-result-card` with per-row GO buttons
- standalone `.route-preview-card`
- raw coordinate location label

The old CSS classes remain in the stylesheet for now because adjacent route/search pages still share global styling patterns and a deeper CSS cleanup should be separate from this UI refactor.

## 9. Responsive Targets

Minimum manual verification targets:

- 375 × 667
- 390 × 844
- 393 × 852
- 430 × 932
- tablet
- desktop

Expected desktop behavior:

- same state model
- map-first layout
- bottom sheet becomes a right-side panel
- no marketing/landing-page layout

## 10. Components Reused Instead of Rebuilt

Reused:

- `useLocation`
- `searchCampusLocations`
- `getNavigationData`
- `buildNavigationHref`
- `createGoogleMapsEmbedUrl`
- `calculateDistanceMeters`
- `metersToFeet`
- existing campus datasets
- existing route geometry helpers in `app/page.js`

Not created:

- `HomepageV2`
- `NewHomepage`
- duplicate search engine
- duplicate route engine
- duplicate map provider
- Expo/React Native app
- SwiftUI app
