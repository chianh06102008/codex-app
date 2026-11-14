# Submission form: draft answers

Due **16:30, 14/11/2026 (Vietnam time)**. Fill in the `[brackets]`. Never put passwords or API keys in the form.

## Email / team / product
- Email: `[submitter email]`
- Team name: `[team name]`
- Product name: **FloodScout VN**

## Actual members (name + Luma email)
- `[Dev 1 name — email]` (app shell, design)
- `[Dev 2 name — email]` (official NCHMF warnings, settings)
- `[Designer name — email]`
- `[Your name — email]` (map, road states, route-or-refuse, photo report + AI depth check, speed gate)

## Users, problem, evidence
Who: people in Vietnamese cities who are stopped, holding a phone, and deciding whether to travel during heavy rain: delivery riders, motorbike commuters, older residents checking their own alley, and visitors. The pilot area is Hải Châu, Đà Nẵng.

Problem: official warnings from NCHMF are authoritative but name whole communes. They cannot answer "this road, right now, on a motorbike". Residents fill the gap with flood photos in Zalo groups. Those photos are fast but unsigned, quickly out of date, and dangerous when read as an all-clear. Navigation apps rank routes by travel time, which riders who are paid per trip read as permission to drive through water.

Evidence: NCHMF published flash-flood/landslide bulletin LQSL_984 for Đà Nẵng and Quảng Ngãi communes on 13/11/2026. It is pinned in the repo with its source link (`fixtures/statements/`). Central Vietnam has flood and landslide warnings every rainy season. `[Add any interview or survey you did today. If you have none, say so.]`

## AI feature + live demo on a physical phone
AI feature: a photo-based depth check. A user who is standing on dry ground photographs a flooded street. A vision model (Gemini, through our server) may only answer **ankle / wheel / unknown**. It must name a real reference object (curb, wheel hub, step). Anything else becomes "unknown". Centimeter numbers are rejected on the server and again in the app. The user must then tap the category themselves. The model never publishes on its own. The report snaps to a road segment, fades out over 12 hours, and can make a road "avoid" or "discouraged", but it can never make one "safe".

The routing engine runs on the phone. It finds a path that avoids distrusted road segments, or it **refuses** and points to the official instruction. It never draws a line through a blocked road and never shows a green "safe" road.

Live demo steps (iPhone, Expo Go):
1. Fully close Expo Go (swipe it away), then reopen it and open the FloodScout project. The app restores saved reports and settings from the phone's storage.
2. Home shows the official NCHMF status band with issuer, time and link. Bulletin LQSL_984 appears as **last known / expired**, never as an all-clear.
3. Open the map (Apple Maps). Roads with recent reports show as avoid, discouraged or uncertain. There is no green.
4. Ask for a route to a place, for example "Cầu Rồng". You get either a route that avoids flagged roads, with the reasons explained, or a refusal with the official line and no route line.
5. Tap a flagged road to see why: the report category, its age, and how much weight it has left.
6. Report: confirm you are on dry ground, take a photo (location and EXIF data are stripped on the phone; face and plate blur needs a development build and is not in Expo Go), and the AI suggests ankle/wheel/unknown. Tap a category and publish. The road state changes immediately.
7. Kill the app halfway through a report and reopen it. The draft resumes, and only "unknown" is offered, because the AI call did not survive the restart.
8. Demo panel: simulate driving faster than 15 km/h. A "pull over" screen replaces the route and camera.

## First users / growth
First users: delivery riders and residents in Hải Châu, reached through ward Zalo groups and rider groups (GrabFood, ShopeeFood, Be). Ward staff matter most, because the app never contradicts a bulletin and always links to it. Growth: invite people to the ward's group with a QR code, one district at a time (Đà Nẵng, then Cần Thơ). Each verified photo report makes the map more useful for the next person.

## Built today vs. prior work (third parties and mock data disclosed)
Prior work: the product spec (`docs/PRD.md`, drafted 10/11) and the initial project skeleton (first commit `c2faa5a`, today 12:15).

Built today (14/11, see the git history):
- Expo SDK 58 app shell with the Figma design ported to React Native.
- NCHMF bulletin fetch/parse server and pinned real bulletin.
- Road-segment fusion with 4 states.
- On-device route-or-refuse over a real OpenStreetMap road graph of Hải Châu (926 nodes, 1,147 segments).
- Photo report flow with redaction, draft persistence and the vision server.
- Speed gate.
- Vietnamese/English copy with a forbidden-words test.
- 60 automated tests for the safety rules.

Third-party code, data and services:
- Expo / React Native, react-native-maps, react-native-paper.
- Apple Maps (iOS) and CARTO Positron tiles (Android).
- OpenStreetMap road data (via Overpass) © OpenStreetMap contributors, ODbL.
- Photon geocoder (komoot).
- Open-Meteo rain model.
- NCHMF bulletins (nchmf.gov.vn).
- Google Gemini API for vision.
- Plus Jakarta Sans font.

Mock or sample data (labeled in the app):
- Sample flood reports on 5 roads.
- The "simulate healthy feed" and "simulate heavy rain" demo switches.
- The simulated speed for the speed gate.
- 36 synthetic test photos in `fixtures/golden/` used for the vision evaluation.
- The vision server falls back to a labeled mock when no API key is set.

## Stack, tools, lesson
Stack: TypeScript, Expo SDK 58, React Native, react-native-maps, AsyncStorage, Node.js servers (`server/vision.mjs`, `server/bulletin.mjs`), Node's built-in test runner, Gemini, OpenStreetMap/Overpass, Photon, Open-Meteo.

Where Codex helped: `[describe what your team actually did with Codex, e.g. scaffolding screens, the bulletin parser, writing tests]`. We also used Claude Code (routing, fusion, report flow, safety tests, merges) and Gemini (vision prompt and evaluation).

Lesson: writing the safety rules down as tests first (never "safe", refuse instead of guessing, official warnings set the minimum) caught a real bug. The router could reach a destination that was itself on a flagged road by going through an intersection. A test found it and we fixed it before the demo.

## Product / repo link
`https://github.com/chianh06102008/codex-app` (branch `feat/map-report`). **The repo is private.** Make it public or add the judges, or the link will not open for them.

## Backup video (60–90 s)
Record the iPhone screen (Control Center → Screen Recording) running steps 1–8 above. Upload it to YouTube (unlisted) or Google Drive (anyone with the link) and paste the link.
