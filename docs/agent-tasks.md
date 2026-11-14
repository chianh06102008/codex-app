# Tasks for Gemini and ChatGPT (Dev 3 + Dev 4 support)

Each task touches **only the files listed**, so it can run in parallel with work on `feat/map-report` without conflicts. Give the agent the whole block, including the rules. Every task works on its own branch cut from `feat/map-report` and comes back as a PR into `feat/map-report`.

Rules to paste into every task:

> Read docs/PRD.md §4 (safety invariants) and §18 (copy deck) first. Never write "safe", "clear", "passable", "an toàn", "đi được", or "nên đi" as a claim. Never use green as a "go" color. Vision output is only ankle / wheel / unknown, never centimeters. Expo SDK 58; add packages only with `npx expo install`. Run `npx tsc --noEmit` and `npm test` before you finish.

---

## Gemini (best for images and multimodal work)

### G1 — Golden photo set and vision prompt evaluation (PRD §12, T03)
- **Files:** `fixtures/golden/` (new), `server/vision.prompt.md` (new), `docs/vision-eval.md` (new).
- Collect 30–40 street photos you have the right to use (your own, or CC-licensed with source URLs in `fixtures/golden/SOURCES.md`). Mix motorbikes, alleys, night, blur, screenshots, ankle/wheel depth, and **no reference object**.
- Label each with the expected category in `fixtures/golden/labels.csv` (`file,expected,notes`).
- Run `npm run vision-server` with `GEMINI_API_KEY`, POST each image to `/api/vision`, and record the results in `docs/vision-eval.md`: a confusion table, plus every case where a photo with no reference object did **not** return `unknown` (T03 must reach ~100%).
- Propose prompt changes in `server/vision.prompt.md`. Don't edit `server/vision.mjs` directly; I'll merge the prompt.

### G2 — On-device face/plate blur for a development build (T13)
- **Files:** `docs/blur-plan.md` (new) only. This is research, no app code.
- Find an Expo SDK 58-compatible way to detect faces and license plates on device and blur them before upload (it needs a dev build, since it won't run in Expo Go). Compare 2–3 options on license, size and Android mid-range speed, and recommend one with an integration sketch that plugs into `src/features/report/redact.ts`.

---

## ChatGPT (best for code, tests and text review)

### C1 — UI tests for the report flow and speed gate (T04, T07, T08)
- **Files:** `src/screens/__tests__/ReportScreen.test.tsx`, `src/features/speed-gate/__tests__/SpeedGate.test.tsx` (new).
- Install the test helper with `npx expo install @testing-library/react-native` (mention it in the PR).
- T04: the "Send report" button is disabled until a category is tapped, and when vision is unavailable only "Unknown" is enabled.
- T08: mock AsyncStorage with a saved draft at step 3, render, and expect the draft-restored notice and step 3.
- T07: `simulateSpeed(25)` replaces the children with "Dừng xe trước khi xem tiếp."; `simulateSpeed(null)` shows them again.
- Mock `expo-image-picker`, `expo-location` and `react-native-maps`.

### C2 — Vietnamese copy review (PRD §18)
- **Files:** `docs/copy-review.md` (new) only.
- Review every string in `src/copy/mapReport.ts` for natural Vietnamese, the same meaning as the English, and the §18 rules, at large text sizes (does it fit on a 360 px button?).
- Output a table: key, current text, suggested text, reason. Don't edit `mapReport.ts`; I'll apply the changes.

### C3 — Self-hosted router spike (PRD §11.1, stretch)
- **Files:** `server/router/` (new) only.
- Make a `docker-compose.yml` that runs OSRM or GraphHopper on a Da Nang `.osm.pbf` extract with a custom cost that can take per-way penalties, plus a README with the exact commands.
- Endpoint target: `POST /route {from, to, mode, penalties: {wayId: multiplier}, blocked: [wayId]}` → GeoJSON. It must **never** return a path through `blocked`. On-phone routing stays as the fallback, so this is a stretch goal only.
