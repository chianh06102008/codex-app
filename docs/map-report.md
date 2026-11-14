# Map, routing, report & vision (Dev 3 + Dev 4)

Branch: `feat/map-report` (Dev 3 and Dev 4 are one person, so the two areas share one branch).

## Run it on your phone (Expo Go)

1. Install Expo Go (the store version runs SDK 58, which this repo uses).
2. On the computer:
   ```bash
   npm install
   ```
   ```bash
   npx expo start
   ```
3. Scan the QR code (iPhone: Camera app; Android: Expo Go). The phone and computer must be on the same Wi-Fi. If they can't see each other, run `npx expo start --tunnel`.

### Optional: real photo analysis

```bash
cp .env.example .env
```

In `.env`, set `GEMINI_API_KEY` or `OPENAI_API_KEY` (or leave both empty for a labeled mock), and set `VISION_SERVER_HOST=0.0.0.0` and `EXPO_PUBLIC_VISION_SERVER_URL=http://<your-computer-LAN-IP>:8789`. Then:

```bash
npm run vision-server
```

Restart `npx expo start` after changing `.env`. Without a vision server, the report flow follows PRD §12: the only depth choice is "Unknown" plus "water visible".

## Map & geo data: no Google, no paid keys

| Need | Source | Key? | Notes |
|---|---|---|---|
| Basemap, iPhone | **Apple Maps** (native, through react-native-maps) | No | Free. No key and no Apple Developer account needed, in Expo Go or a release build. Muted style. |
| Basemap, Android | **CARTO Positron**, rendered from OpenStreetMap (`MAP_TILE_URL` in `src/config.ts`) | No | Replaces the Google basemap, so no Google key. Free for low-volume/non-commercial use with attribution (shown on the map). |
| Roads for routing | **OpenStreetMap** via Overpass, bundled in the app | No | Works offline. The safety-critical path never depends on a tile server (PRD §11). |
| Place search | **Photon** (komoot), an OSM geocoder (`src/features/map/geocode.ts`) | No | Fair use: searches only on tap. Vietnamese names work ("Chợ Hàn"). |
| Rain context (Dev 2) | **Open-Meteo** forecast API | No | Free, no key, hourly precipitation. Label it as a model (PRD §14). |
| Elevation prior (V1) | **Copernicus DEM GLO-30** / Open-Meteo elevation API | No | Weak prior only, never a depth (PRD §1). |
| Official warnings (Dev 2) | **NCHMF** (nchmf.gov.vn), **VNDMS** (vndms.dmc.gov.vn) | No | The only sources that may set a floor. |
| Production upgrade | **OpenFreeMap** vector tiles + **MapLibre** | No | Free, no limits, nicer and offline-cacheable, but needs a development build (it won't run in Expo Go). |

The Google/Apple keys in `.env.example` are now optional; the app doesn't need them. An **Apple Developer account** ($99/year) is only needed for the Apple Maps *Server* API (`server/maps.mjs`, place search) or MapKit JS. Photon already covers place search for free, and Apple Maps can't be used on Android.

## What is real and what is sample data

| Piece | Status |
|---|---|
| Road network | **Real** OpenStreetMap extract of central Hải Châu, Da Nang: 1,147 segments (`fixtures/segments/haichau.json`, rebuild with `scripts/build-road-fixture.py`). ODbL, attributed on the map. |
| Routing | **Real** penalized Dijkstra on that graph (`src/features/routing/router.ts`). It follows PRD §11: hard blocks, a zero-ankle budget for motorbike/walking, a 10% discouraged share, and refusal with no line. |
| Fusion | **Real** PRD §8 rules (`src/features/fusion/fusion.ts`): floor, decay, 12 h hard zero, no-water retirement. |
| Official status | **Not connected yet** (Dev 2). Default is "official status unavailable": every road is uncertain, so motorbike routes are refused. That's the honest result. The demo switch "official feed reachable, no warnings" is labeled *Simulated*. The app never invents a warning. |
| Crowd reports | 5 **sample** reports on real streets (Bạch Đằng, Hoàng Diệu, Nguyễn Văn Linh, Ông Ích Khiêm, plus one expired on Hùng Vương), labeled "Sample data". Your own reports are saved on the phone only, since there's no shared backend yet. |
| Vision | `server/vision.mjs`: Gemini or OpenAI if a key is set, otherwise a mock flagged "not a real model". The server and the app both enforce the 3-category contract. |
| Speed gate | Real GPS speed after the person agrees to location access; a demo switch simulates 25 km/h. |
| Face/plate blur | **Not in Expo Go.** It needs an on-device ML model, so it waits for a development build. EXIF is stripped and the photo downsized before upload. |

## Demo script (2 minutes)

1. Home: the orange band says official status is unavailable, and the map area is tinted "uncertain". Sample reports show red and orange roads.
2. **Đi đường này?** → pick "Lê Đình Lý" → Motorbike → **Kiểm tra đường** → **refusal**, with no line drawn, the evidence listed and the official instruction repeated (T06, P10).
3. Back to Home → Demo: turn on "official feed reachable" → ask again → a route that avoids Bạch Đằng (wheel) and Hoàng Diệu (ankle) appears, with "This is not a clearance" (P1).
4. Pick "Hoàng Diệu" (sample ankle report) → refusal: "the destination is on Hoàng Diệu…". Switch to Car → a route may appear, because ankle is discouraged rather than a block for cars, and it still isn't called safe.
5. **Báo cáo ngập** → dry-ground checkbox → photo → tap the road on the map → the category must be tapped before "Send" works (T04). Kill the app mid-flow and reopen it: the draft is restored (T08).
6. Demo: "riding at 25 km/h" → the route screen is replaced by "Dừng xe trước khi xem tiếp." (T07).

## Files I own (TEAM.md §1)

`src/features/{map,fusion,routing,report,speed-gate,demo,ui}/`, `src/screens/{Ask,Result,Segment,Report}Screen.tsx`, `src/copy/mapReport.ts`, `server/vision.mjs`, `fixtures/segments/`, `scripts/build-road-fixture.py`.

**Shared files I had to create** (Dev 1: adopt or adjust in your shell PR): `src/domain/types.ts` (PRD §9), `src/config.ts` (PRD §21), `src/copy/forbidden.test.ts` (T02), Jest setup in `package.json`, `tsconfig.json` paths, and the screens wired into `App.tsx`.

## Hand-off points for teammates

- **Dev 2:** call `setOfficialSource({ feedStatus, statements, retrievedAt, simulated: false })` from `src/features/fusion/officialSource.ts` whenever your fetch or cache resolves. Statements with `geometry` are intersected per road; `geometry: null` covers the whole slice (conservative). Set `heavyRain` from Open-Meteo.
- **Designer:** state colors live in `src/features/map/stateStyle.ts` (no green, a neutral calmest state). Move them into `src/theme/` and re-export.
- **Dev 1:** my screens take `{ lang, go }` props, so they drop into any navigator.
