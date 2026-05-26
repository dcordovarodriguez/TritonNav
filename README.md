# TritonNav

TritonNav is a UCSD-focused campus navigation app built with Next.js App Router.
It currently demonstrates a scalable MVP-to-product workflow:

- mock class schedule
- destination search and selection
- live browser geolocation
- shared navigation state via Zustand
- compute the best building destination
- hand off to Google Maps with embedded preview
- show room-level last-leg directions

## Quick Start

1. Open `/Users/diegocordova/Desktop/TritonNav` in VS Code.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

## Deployment

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Vercel should detect `Next.js` automatically.
4. Add any client-side map-related variables in the Vercel dashboard if you introduce them later.
5. Deploy the `main` branch.

## Core Files

- `lib/buildings.js` contains your UCSD building, entrance, and room data.
- `lib/navigation.js` converts a building plus room into route-ready UI data.
- `lib/searchIndex.js` powers ranked campus search with aliases, partial matching, and fuzzy fallbacks.
- `lib/reverseGeocode.js` resolves raw coordinates into the closest known UCSD place when possible.
- `lib/distance.js` handles Haversine distance math and feet-based formatting.
- `lib/schedule.js` provides a demo schedule for the home screen.
- `store/useNavigationStore.js` contains shared destination, map, and geolocation state.
- `app/navigation/page.js` is the core demo route screen.

## Current Behavior

- Home screen with schedule cards
- Search screen for buildings and rooms with route preview handoff
- Navigation screen with Google Maps handoff and embedded preview
- Room-level instructions based on entrances and floors
- Browser geolocation for a stronger route origin
- Mobile-ready destination selection flow

## Notes

- Replace the placeholder image paths in `public/images/buildings/` when you have real photos.
- If you later add the Google Maps JavaScript API, you can use `.env.local` for the API key.
- `.env.local` should stay local-only and should not be committed.
- The navigation store is intentionally UI-framework-light so the destination logic is easier to migrate later into Expo + React Native.
