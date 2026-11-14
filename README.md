# FloodScout VN

## Run the Next.js app locally

Use the Node and pnpm versions in `.mise.toml`.

1. Run `pnpm install --frozen-lockfile`.
2. Create an ignored `.env.local` and set `APP_OPENAI_API_KEY` there for voice and AI features.
3. Run `pnpm dev` and open http://localhost:3000.

Local mode supports the map, live warning sources, voice and route lookup. Shared reports,
the CMS and road-hazard screening rely on the Figma-managed backend. Local routes show
when road-hazard coverage is unavailable.

## Prototype files

Open `preview.html` directly in a browser. Vietnamese is the default. Use the language button to switch to English, or enable the optional Google basemap. The schematic is illustrative. Destination checks return a refusal while verified warning and road data are unavailable.

## Expo

1. Run `npm install`, then `npx expo install --fix` to align packages with the selected SDK.
2. Copy `.env.example` to `.env`. For Google tiles, enable the relevant Maps SDK and restrict each key to the app identifier and, on Android, its signing certificate.
3. Run `npm run android` or `npm run ios` with the corresponding native toolchain. Google Maps requires a development or release build with the key configured at build time.

Google is a basemap only. This scaffold has no live official feed, routing engine, location or camera permissions, report publishing, or installable PWA. The HTML preview and native app need device and assistive-technology testing before a WCAG 2.2 AA conformance claim.

## Apple Maps place search

Use Node 20.6 or later. In .env set APPLE_MAPS_TEAM_ID, APPLE_MAPS_KEY_ID and APPLE_MAPS_PRIVATE_KEY_PATH to the downloaded .p8 file. Keep that file outside the project. Run npm run maps-server. Set EXPO_PUBLIC_MAPS_SERVER_URL to an HTTPS URL reachable by the app, then restart Expo. For local phone testing, explicitly set MAPS_SERVER_HOST=0.0.0.0 and use the computer LAN address and port 8787 in EXPO_PUBLIC_MAPS_SERVER_URL. Use this only on a trusted network. Production requires HTTPS and access controls. Search provides place suggestions; route checks continue to refuse until a safety-aware router and official data are connected.
