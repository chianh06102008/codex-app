# FloodScout VN

## Run the Next.js app locally

Use the Node and pnpm versions in `.mise.toml`.

1. Run `pnpm install --frozen-lockfile`.
2. Copy `.env.example` to `.env.local` and set `APP_OPENAI_API_KEY` for voice and AI features.
3. Generate a separate random secret with `node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('hex'))"` and save it as `PAYLOAD_SECRET` in the same file.
4. Run `pnpm dev`, open http://localhost:3000, and visit http://localhost:3000/admin to create the first admin.

The demo stores Payload records in the ignored `floodscout.sqlite` file and uploads in `media/`.
The database starts empty. Add current hazard segments in the CMS to give routing local
road data. Figma-hosted records require a separate import. For a shared demo, use the hosted setup below.

## Host the shared demo

Run one instance on a Node server with a persistent disk. Install from the lockfile
with `pnpm install --frozen-lockfile`. Configure these environment variables on the server.

| Variable | Value |
| --- | --- |
| `APP_OPENAI_API_KEY` | A restricted key for this deployment |
| `PAYLOAD_SECRET` | A separate random secret |
| `DATABASE_URL` | An absolute SQLite file URL on the persistent disk, e.g. `file:/var/lib/floodscout/floodscout.sqlite` |
| `UPLOADS_DIR` | An absolute directory on that disk, e.g. `/var/lib/floodscout/media` |
| `APP_PUBLIC_URL` | The external HTTPS URL |

On a fresh database, run `pnpm db:migrate` and then `pnpm build`. Start with
`pnpm start`. Put an HTTPS reverse proxy in front of the local port and
restrict the demo to invited users at the proxy before sharing its URL.
HTTPS enables microphone and location permissions on remote devices.
Create the first CMS admin at `/admin` through that protected URL. Back up the
SQLite database and upload directory together. Existing development databases
created by schema push should be kept separately from the fresh hosted database.

## Prototype files

Open `preview.html` directly in a browser. Vietnamese is the default. Use the language button to switch to English, or enable the optional Google basemap. The schematic is illustrative. Destination checks return a refusal while verified warning and road data are unavailable.

## Expo

1. Run `npm install`, then `npx expo install --fix` to align packages with the selected SDK.
2. Copy `.env.example` to `.env`. For Google tiles, enable the relevant Maps SDK and restrict each key to the app identifier and, on Android, its signing certificate.
3. Run `npm run android` or `npm run ios` with the corresponding native toolchain. Google Maps requires a development or release build with the key configured at build time.

Google is a basemap only. This scaffold has no live official feed, routing engine, location or camera permissions, report publishing, or installable PWA. The HTML preview and native app need device and assistive-technology testing before a WCAG 2.2 AA conformance claim.

## Apple Maps place search

Use Node 20.6 or later. In .env set APPLE_MAPS_TEAM_ID, APPLE_MAPS_KEY_ID and APPLE_MAPS_PRIVATE_KEY_PATH to the downloaded .p8 file. Keep that file outside the project. Run npm run maps-server. Set EXPO_PUBLIC_MAPS_SERVER_URL to an HTTPS URL reachable by the app, then restart Expo. For local phone testing, explicitly set MAPS_SERVER_HOST=0.0.0.0 and use the computer LAN address and port 8787 in EXPO_PUBLIC_MAPS_SERVER_URL. Use this only on a trusted network. Production requires HTTPS and access controls. Search provides place suggestions; route checks continue to refuse until a safety-aware router and official data are connected.
