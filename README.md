# TritonNav

TritonNav is a lightweight Next.js starter for a UCSD campus navigation MVP.
It demonstrates the core flow from the prompt:

- mock class schedule
- click into a class
- compute the best building destination
- hand off to Google Maps
- show room-level last-leg directions

## Quick Start

1. Open `/Users/diegocordova/Desktop/TritonNav` in VS Code.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

## Core Files

- `lib/buildings.js` contains your UCSD building, entrance, and room data.
- `lib/navigation.js` converts a building plus room into route-ready UI data.
- `lib/schedule.js` provides a demo schedule for the home screen.
- `app/navigation/page.js` is the core demo route screen.
- `starter-code/` is your archive area for storing future starter kits and prompt notes.

## Current MVP Behavior

- Home screen with schedule cards
- Search screen for buildings and rooms
- Navigation screen with Google Maps handoff
- Room-level instructions based on entrances and floors
- Optional browser geolocation for a stronger route origin

## Notes

- The map view is currently a polished placeholder card, not an embedded live map.
- Replace the placeholder image paths in `public/images/buildings/` when you have real photos.
- If you later add the Google Maps JavaScript API, you can use `.env.local` for the API key.
