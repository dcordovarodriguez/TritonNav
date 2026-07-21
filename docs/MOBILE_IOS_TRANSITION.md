# TritonNav Mobile iOS Transition Plan

Date: 2026-07-20  
Canonical repository: `/Users/diegocordova/Desktop/TritonNav`  
Canonical production web deployment: https://tritonnav.diegocordova.net/  
Legacy/generated Vercel URL: https://triton-nav.vercel.app/  
Recommended mobile path: Expo / React Native  
Not recommended now: full SwiftUI rewrite

## 1. Current State

### Existing Next.js Prototype

TritonNav is currently a working Next.js App Router and React prototype. The existing repository remains the single source of truth. The production web prototype is deployed at:

https://triton-nav.vercel.app/

The current app includes:

- map-first homepage
- campus search
- room-level lookup
- college-level lookup
- recreation facility lookup
- route preview
- browser geolocation
- Google Maps iframe/link fallback
- UCSD navy/gold styling
- technical audit documentation

### Current Reusable Logic

These existing files contain logic that should be reused by a future mobile app rather than rebuilt:

- `data/locations.js`
- `data/colleges.js`
- `data/recreationFacilities.js`
- `lib/buildings.js`
- `lib/searchIndex.js`
- `lib/navigation.js`
- `lib/distance.js`
- `lib/reverseGeocode.js`
- `services/navigationService.js`
- `store/useNavigationStore.js`, conceptually
- campus destination data
- building and room search
- aliases
- destination resolution
- distance calculations
- route details
- future Supabase data adapter concepts

### Current Web-Specific Code

These areas should not be copied directly into React Native:

- `app/page.js`
- `app/search/page.js`
- `app/navigation/page.js`
- `app/navigation/NavigationClient.jsx`
- DOM-specific JSX and form behavior
- browser-only geolocation assumptions
- Google Maps iframe rendering
- `components/MapView.jsx` as currently implemented
- `services/mapsService.js` as primary mobile map strategy
- `styles/globals.css`
- Next.js routing and metadata

React Native screens and styles should be implemented separately while consuming shared campus/domain logic.

## 2. Preservation Strategy

### Git Branch

Preservation branch:

```bash
chore/mobile-transition-baseline
```

This branch exists to preserve the pre-Expo working state and document the mobile transition plan without changing the production branch.

### Git Tag

Baseline tag:

```bash
tritonnav-pre-expo-baseline-2026-07-20
```

This tag should point at the preservation commit.

### Local Archive

Local archive:

```bash
/Users/diegocordova/Desktop/TritonNav_Xcode_Snapshot_2026-07-20
```

The archive is a source-code backup, not a native iOS project. Its README clarifies that `node_modules`, `.next`, `.git`, and secrets are intentionally excluded.

### Production Deployment Protection

The production branch and Vercel deployment must remain untouched during preservation work. Do not create a second deployment or replace the current public prototype.

### Recovery Instructions

To recover the baseline branch:

```bash
cd /Users/diegocordova/Desktop/TritonNav
git fetch --all --tags
git switch chore/mobile-transition-baseline
```

To inspect the tagged baseline:

```bash
git checkout tritonnav-pre-expo-baseline-2026-07-20
```

To create a recovery branch from the tag:

```bash
git switch -c recovery/pre-expo tritonnav-pre-expo-baseline-2026-07-20
```

Do not copy `.env.local`, signing certificates, credentials, or private secrets into recovery branches or archives.

## 3. Shared Code Strategy

The future mobile app should reuse one canonical domain layer rather than duplicating logic.

Shared modules should eventually cover:

- campus data types
- building and room models
- college models
- recreation facility models
- aliases and normalized search keys
- search index
- destination resolution
- distance calculations
- route details
- route step models
- room instructions
- accessibility preferences
- Supabase queries
- validation schemas
- provenance and verification metadata

Recommended incremental extraction:

1. Keep current files in place.
2. Add tests around existing behavior.
3. Extract pure JS/TypeScript logic into shared modules.
4. Have the web app import the shared modules.
5. Add the Expo app later and import the same shared modules.

Do not create a second search implementation, second routing implementation, or second campus data model.

## 4. Web App Responsibilities

The current web app should remain:

- a functioning public prototype
- a portfolio demonstration
- a way to validate search and campus datasets
- a future candidate for an admin/data review interface
- a safe fallback while mobile work is in progress

The web app should continue to own:

- public demo URL
- fast iteration
- search validation
- dataset review
- documentation and technical proof of concept

## 5. Mobile App Responsibilities

A future Expo app should provide:

- native mobile screens
- native navigation stack
- native permission prompts
- MapLibre map rendering
- user location permissions
- campus route display
- step-by-step directions
- accessibility route preferences
- offline or cached campus data where appropriate
- iOS simulator and physical iPhone testing

The mobile app should not copy browser CSS or Google Maps iframe behavior. It should present the same product concepts through native React Native views.

## 6. Expo-to-Xcode Lifecycle

Exact intended lifecycle:

```text
Existing Next.js repository
→ extract shared TypeScript logic
→ add an Expo/React Native mobile workspace
→ implement native mobile screens
→ connect shared backend and data services
→ create an Expo development build
→ generate the native ios project when required
→ open ios/TritonNav.xcworkspace in Xcode
→ test with iOS Simulator and physical iPhone
→ configure signing and capabilities
→ distribute through TestFlight
→ submit through App Store Connect
```

Expo does not translate browser UI or CSS into SwiftUI. React Native renders native platform views while JavaScript/TypeScript application logic remains reusable.

Official references:

- Expo development builds: https://docs.expo.dev/develop/development-builds/introduction/
- Expo prebuild adoption: https://docs.expo.dev/guides/adopting-prebuild/
- Expo iOS build process: https://docs.expo.dev/build-reference/ios-builds/
- EAS Build: https://docs.expo.dev/build/introduction/

## 7. Xcode Responsibilities

Xcode should be used for native iOS responsibilities after Expo generates or manages the iOS project:

- iPhone simulator
- native compilation
- iOS permission configuration
- entitlements
- signing
- capabilities
- profiling
- native debugging
- archive creation
- TestFlight delivery
- App Store delivery

The current Next.js repository should not be described as an Xcode-native iOS app.

## 8. Swift Responsibilities

Swift is only required if a specialized native feature lacks an adequate Expo or React Native solution.

Possible future Swift use cases:

- custom native location behavior unavailable through Expo modules
- advanced background navigation behavior
- specialized Bluetooth/NFC/hardware integration
- native performance-critical module
- campus-specific AR navigation experiment

Swift should be added as a targeted native module, not as a wholesale rewrite.

React Native native module references:

- React Native native modules intro: https://reactnative.dev/docs/legacy/native-modules-intro
- React Native iOS native modules: https://reactnative.dev/docs/legacy/native-modules-ios
- React Native Turbo Native Modules: https://reactnative.dev/docs/turbo-native-modules-introduction

## 9. Duplication Prevention

Rules for the mobile transition:

- one repository or an intentional monorepo
- one backend
- one canonical data model
- one search implementation
- one routing implementation
- one validation layer
- shared TypeScript packages
- separate web and mobile presentation layers only
- no SwiftUI rewrite unless a future native-only requirement justifies it
- no second production deployment

Before creating any new implementation, ask:

> Does an equivalent already exist?

If yes, reuse, extract, or extend it.

## 10. Rollback Procedure

Restore the preservation branch:

```bash
cd /Users/diegocordova/Desktop/TritonNav
git fetch --all --tags
git switch chore/mobile-transition-baseline
```

Restore from the tag into a new branch:

```bash
cd /Users/diegocordova/Desktop/TritonNav
git fetch --all --tags
git switch -c recovery/pre-expo tritonnav-pre-expo-baseline-2026-07-20
```

Compare current work against the baseline:

```bash
git diff tritonnav-pre-expo-baseline-2026-07-20..HEAD
```

Return to production branch:

```bash
git switch main
```

Safety notes:

- Do not force push.
- Do not delete branches or tags without confirmation.
- Do not restore or commit `.env.local`.
- Do not commit signing certificates.
- Do not commit generated `ios/`, `.next/`, `node_modules/`, or build artifacts unless a future migration explicitly approves them.

## 11. Future Repository Structure

The current repository is simple and should not be converted to a monorepo solely for appearance.

Long-term structure, if justified:

```text
TritonNav/
├── apps/
│   ├── web/
│   ├── mobile/
│   └── admin/
├── packages/
│   ├── domain/
│   ├── database/
│   ├── search/
│   ├── routing/
│   ├── validation/
│   └── design-tokens/
├── supabase/
├── docs/
└── tooling/
```

Smallest safe next change:

- Keep the current repo layout.
- Add tests and docs first.
- Extract shared logic into `packages/` only when the Expo app is approved.
- Avoid moving the web app into `apps/web` until build/test confidence is restored.

Recommended phased structure:

1. Current flat Next.js app.
2. Add `packages/domain` for pure shared logic.
3. Add `packages/search`, `packages/routing`, and `packages/validation` only when extraction pressure is real.
4. Add `apps/mobile` when Expo migration is approved.
5. Move web into `apps/web` only after the monorepo need is proven.

## 12. Reuse Matrix

| Existing file or feature | Current responsibility | Reuse directly | Refactor into shared module | Rebuild only at UI layer | Web-only | Mobile replacement | Risk or dependency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `app/layout.js` | Next.js root layout | No | No | Yes | Yes | Expo root navigator/layout | Next.js-specific |
| `app/page.js` | Map-first web homepage and inline route preview | Partial concepts | Route preview helpers | Yes | Mostly | Native home/search/map screen | Contains reusable logic mixed with UI |
| `app/search/page.js` | Web search page | No | No | Yes | Yes | Native search screen | Uses Next router and DOM |
| `app/navigation/page.js` | Suspense wrapper for route page | No | No | Yes | Yes | Native stack screen | Next.js-specific |
| `app/navigation/NavigationClient.jsx` | Route page composition and URL params | Partial concepts | Navigation state flow | Yes | Mostly | Native route screen | Uses Next search params |
| `components/SearchBar.jsx` | Web search input/suggestions | Concepts only | Result display helpers | Yes | Yes | React Native search input/list | DOM form/input |
| `components/MapView.jsx` | Google iframe route preview | No | Map state concepts | Yes | Yes | MapLibre React Native map | iframe/browser-specific |
| `components/DirectionsPanel.jsx` | Route detail panel | Concepts only | Route step presentation model | Yes | Mostly | Native route detail card | DOM/styling-specific |
| `components/RouteBottomSheet.jsx` | Mobile-ish web bottom sheet | Concepts only | Sheet data model | Yes | Mostly | Native bottom sheet | CSS/DOM behavior |
| `components/ClassCard.jsx` | Old schedule class card | Maybe | Schedule model later | Yes | No | Native schedule card if schedule returns | Currently unused |
| `components/Layout/Navbar.jsx` | Web navigation header | No | Branding text maybe | Yes | Yes | Native tab/header | Web-only links |
| `components/Layout/Container.jsx` | Web layout wrapper | No | No | Yes | Yes | Native safe-area layout | DOM-only |
| `data/locations.js` | Static campus locations | Yes | Yes | No | No | Shared data/seed | Must unify with building data later |
| `data/colleges.js` | College centers/polygons/metadata | Yes | Yes | No | No | Shared data/seed | Polygons are approximate |
| `data/recreationFacilities.js` | Rec destinations and official links | Yes | Yes | No | No | Shared data/seed | Hours should remain sourced externally |
| `data/schedule.json` | Legacy/static schedule data | Maybe | Maybe | No | No | Future schedule fixture | Currently unused |
| `lib/buildings.js` | Building, room, entrance model | Yes | Yes | No | No | Shared domain data | Overlaps with `data/locations.js` |
| `lib/searchIndex.js` | Canonical search/ranking logic | Yes | Yes | No | No | Shared search package | Should get tests before extraction |
| `lib/navigation.js` | Destination resolution and route data | Yes | Yes | No | No | Shared domain/routing package | Currently also creates Google Maps URLs |
| `lib/distance.js` | Distance and walking estimates | Yes | Yes | No | No | Shared routing utility | Good extraction candidate |
| `lib/reverseGeocode.js` | UCSD-first origin naming | Yes | Yes | No | No | Shared location utility | Depends on static location data |
| `lib/schedule.js` | Mock schedule used by search index | Yes as fixture | Maybe | No | No | Shared fixture or future schedule adapter | Mock-only |
| `lib/utils.js` | Generic format helpers | Maybe | Maybe | No | No | Shared utilities if used | Currently unused |
| `services/navigationService.js` | Route detail construction | Yes | Yes | No | No | Shared routing/domain service | Good extraction candidate |
| `services/mapsService.js` | Google Maps URL/embed fallback | Fallback only | Fallback adapter | No | Mostly | MapLibre + native linking fallback | Not primary mobile map |
| `services/authService.js` | UCSD sign-in placeholder | Concept only | Auth adapter later | No | No | Supabase/OIDC/TritonLink auth adapter | Placeholder only |
| `hooks/useLocation.js` | Browser geolocation watcher | No | Permission state concepts | Yes | Yes | Expo Location hook/service | Browser API |
| `hooks/useNavigation.js` | Web navigation hook | Partial concepts | Shared route selection logic | Yes | Mostly | Native navigation hook | Uses web geolocation flow |
| `store/useNavigationStore.js` | Zustand search/location/map state | Maybe | State shape | Yes | No | Zustand or native state store | Browser statuses need adaptation |
| `styles/globals.css` | Web visual system and layouts | Design tokens only | Yes | Yes | Yes | React Native StyleSheet/tokens | CSS not portable |
| `public/images/buildings/README.md` | Asset placeholder | Maybe | Asset manifest later | No | No | Native bundled/remote assets | No actual images tracked |
| `docs/TRITONNAV_TECHNICAL_AUDIT.md` | Technical baseline/audit | Yes | No | No | No | Shared planning doc | Keep current |
| `.gitignore` | Ignore generated/private files | Yes | No | No | No | Add Expo ignores later | Must avoid secrets/native build artifacts |
| `package.json` | Current web dependencies/scripts | Partial | Workspace config later | No | No | Root or web package config | Monorepo not yet approved |
| `package-lock.json` | Current npm lockfile | Yes | No | No | No | Workspace lockfile later | Changes during migration |
| `README.md` | Web MVP overview | Yes but stale | No | No | No | Update when migration begins | Mentions old class-card homepage |

## 13. What Is Preserved

- Current Next.js production prototype.
- Current Vercel deployment.
- Current search engine.
- Current destination datasets.
- Current navigation route logic.
- Current route preview concepts.
- Current technical audit.
- Current ignored-file safety posture.

## 14. What Should Be Built Next

Safest next implementation task:

Fix the local verification/build pipeline before creating the Expo app.

Recommended scope:

- investigate why `npm install`, `npm run lint`, and `npm run build` time out locally
- add a minimal test runner after build health is restored
- test `lib/searchIndex.js`, `lib/navigation.js`, and `lib/distance.js`
- only then extract shared modules for mobile reuse
