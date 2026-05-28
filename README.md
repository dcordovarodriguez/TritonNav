# TritonNav

TritonNav is a UCSD-focused campus navigation app built with Next.js and React. It is designed as a polished MVP that can demo a real student workflow today and still scale toward a future iPhone-ready Expo + React Native product.

## Project Description

TritonNav helps a student move from a class schedule or campus search query into the right destination with:

- UCSD-aware destination search
- room-aware navigation handoff
- live browser geolocation
- campus-first reverse geocoding
- Google Maps preview and live walking handoff

The app is intentionally structured so the campus logic, search index, distance math, and navigation state can be reused later in a native mobile client.

## Tech Stack

- Next.js App Router
- React
- Zustand
- Plain CSS with responsive mobile-first layout rules
- Google Maps URL/embed handoff

## Current MVP Features

- Home screen with demo class cards
- Search screen with partial matching, aliases, building codes, and fuzzy campus lookup
- Live browser geolocation with permission-aware fallback messaging
- UCSD-first reverse geocoding for user origin labels
- Distance calculation in feet
- Route preview screen with:
  - destination details
  - final-leg room instructions
  - embedded Google Maps preview
  - direct "Open in Google Maps" action
- Mobile bottom-sheet trip summary for iPhone-sized demos

## Demo Instructions

1. Start the app with `npm run dev`.
2. Open [http://localhost:3000](http://localhost:3000).
3. On the home screen, tap a class card like `COGS 101B`.
4. Allow location access to show live origin context.
5. Open the navigation screen and point out:
   - destination building and room
   - estimated walk time
   - feet-based distance
   - room-level final-leg instructions
   - Google Maps handoff
6. For search, go to `/search` and try:
   - `MANDE`
   - `CSB 115`
   - `Price Center`
   - `PC East Ballroom`

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Build the production version:

```bash
npm run build
```

## Deployment Instructions

### Vercel

1. Push the repository to GitHub.
2. Import the repo into [Vercel](https://vercel.com).
3. Let Vercel auto-detect `Next.js`.
4. Keep the default build command:

```bash
npm run build
```

5. Keep the default output settings unless you later add environment-backed APIs.
6. Deploy from the `main` branch.

### Environment Variables

- `.env.local` is for local-only secrets and should not be committed.
- It is already ignored in `.gitignore`.
- The current MVP does not require any production environment variables.
- If you later add Google Maps API-backed services, document the required keys in Vercel project settings before deploying.

## About TritonNav

TritonNav is not just a generic map wrapper. It is a UCSD-specific navigation layer designed around how students actually move through campus:

- course and room context instead of just building pins
- campus-specific aliases and abbreviations
- reverse geocoding that prefers known UCSD locations before generic address fallbacks
- architecture intended to adapt to real student schedules, destinations, and future campus coverage

The long-term direction is a stronger mobile-native version with Expo + React Native, live route tracking, better destination datasets, and a more complete student mobility experience.

## Core Files

- `app/page.js`: homepage and demo overview
- `app/search/page.js`: campus search flow
- `app/navigation/NavigationClient.jsx`: route preview experience
- `components/MapView.jsx`: embedded map preview and live handoff
- `components/DirectionsPanel.jsx`: room-level route details
- `components/RouteBottomSheet.jsx`: mobile route summary
- `store/useNavigationStore.js`: shared navigation and geolocation state
- `hooks/useLocation.js`: live browser geolocation
- `lib/searchIndex.js`: ranked campus search utility
- `lib/reverseGeocode.js`: UCSD-first reverse geocoding
- `lib/distance.js`: Haversine distance + feet formatting
- `data/locations.js`: UCSD location dataset

## Roadmap

- Expand the UCSD destination dataset beyond the current sample set
- Add stronger typo tolerance and richer campus autocomplete UX
- Support deeper Google Maps or campus routing integrations
- Add analytics and saved destinations
- Migrate the shared navigation domain logic into an Expo + React Native client
- Add production-grade testing for search, reverse geocoding, and route generation
