# Capacitor Integration

This is the shortest path from the current Next.js TritonNav codebase to an iOS/Xcode prototype without rewriting the app in React Native.

## Architecture Decision

TritonNav uses server-side Next.js routes, especially:

```text
frontend -> /api/routes/walking -> Valhalla provider
```

Those API routes do not run inside an iPhone WebView. For the Capacitor prototype, the iOS app loads the hosted TritonNav web app:

```text
iPhone Capacitor shell
  -> https://tritonnav.diegocordova.net
  -> /api/routes/walking on Vercel
  -> remote Valhalla through server-only VALHALLA_BASE_URL
```

This preserves the current web deployment and keeps the browser/iOS client from seeing Valhalla URLs or secrets.

## Current Config

- App name: `TritonNav`
- App ID: `net.diegocordova.tritonnav`
- Hosted URL: `https://tritonnav.diegocordova.net`
- Native platform target: iOS first
- Server-side routing config remains in Vercel, not in the iOS bundle

The App ID should be changed later if TritonNav is signed under a UCSD-owned Apple Developer team and UCSD requires an institutional bundle identifier.

## Setup Commands

Install dependencies:

```bash
npm install
```

Add the iOS platform:

```bash
npm run cap:add:ios
```

Sync native configuration:

```bash
npm run cap:sync:ios
```

Open manually in Xcode only after the generated native project exists:

```bash
npm run cap:open:ios
```

## Geolocation Permission

TritonNav uses browser geolocation in the web app. The generated iOS project must include a location usage description in `ios/App/App/Info.plist`, for example:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>TritonNav uses your location to show your campus position and request walking routes from your current location.</string>
```

The iOS app should never silently replace a real off-campus location with a campus origin. The current web UI already distinguishes real device location from preview/manual origins.

## Physical iPhone Local Development

The iPhone should call TritonNav's Next.js server, never Valhalla directly. Keep Valhalla on the Mac at `http://localhost:8002`, start Next.js on port 3000, and sync Capacitor with the Mac's current LAN address:

```bash
npm run dev:webpack
CAPACITOR_SERVER_URL=http://<MAC_LAN_IP>:3000 npm run cap:sync:ios
npm run cap:open:ios
```

The Mac and iPhone must be on the same trusted Wi-Fi network. The local URL is written only into the generated iOS runtime config during that sync. It is not hardcoded into the repository configuration. Running `npm run cap:sync:ios` without `CAPACITOR_SERVER_URL` restores the production hosted URL.

The local request path remains:

```text
iPhone WebView
  -> http://<MAC_LAN_IP>:3000/api/routes/walking
  -> Next.js server on the Mac
  -> http://localhost:8002/route
```

Do not expose port 8002 to the iPhone or place `VALHALLA_BASE_URL` in Capacitor configuration. iOS local-network permission text and local HTTP transport permission are limited to development access to the Mac-hosted web app.

## MapLibre In WKWebView

The current MapLibre GL JS web implementation should run inside WKWebView as long as the hosted page can load its scripts, worker module route, CSS, and tile/style resources over HTTPS. No native MapLibre SDK is being introduced in this Capacitor phase.

## Routing Caveat

Production routing will continue to show a truthful route-unavailable state until Vercel has a server-only `VALHALLA_BASE_URL` pointing at a reachable remote Valhalla service.

Do not put `VALHALLA_BASE_URL`, `VALHALLA_API_KEY`, or `VALHALLA_API_KEY_HEADER` in Capacitor config or any `NEXT_PUBLIC_*` variable.
