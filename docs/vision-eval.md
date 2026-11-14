# Vision Evaluation Report — Golden Photo Set (PRD §12, T03)

## 1. Executive Summary

- **Dataset (`fixtures/golden/`)**: **36 labeled street photos** (`01_alley_ankle_sandal.jpg` – `36_wet_pavement_sheen_no_standing_water.jpg`), documented in [labels.csv](file:///Users/tiesinger/Documents/Competition_hackathon/Codex_HN/codex-app/fixtures/golden/labels.csv) and [SOURCES.md](file:///Users/tiesinger/Documents/Competition_hackathon/Codex_HN/codex-app/fixtures/golden/SOURCES.md).
  - **10 `ankle`**: narrow alleys (`hẻm`), urban curbs, motorbike lower tire rims, shopfront door sills, pedestrian sandals/ankles, plastic stools, rain, dusk.
  - **10 `wheel`**: motorbike wheels submerged to hub/axle, exhaust pipes, front fenders, car lower bumpers/door sills, two-bike intersections, delivery motorbikes in heavy rain, submerged curbs.
  - **16 `unknown` (T03 no-reference & abstention set)**: open muddy water with no scale reference (`21`–`23`), dark night scenes with glare (`24`–`25`), heavy motion blur and lens defocus (`26`–`27`), mobile chat/news screenshots (`28`–`29`), indoor tiled room (`30`), close-up face selfie (`31`), upward sky/rain (`32`), wet wall close-up (`33`), overhead rooftops (`34`), and dry/damp asphalt with zero standing water depth (`35`–`36`).
- **T03 Pass Condition**: Labeled photos with no usable depth reference object must return `unknown` (~100%).
  - **Baseline prompt (`server/vision.mjs` current `PROMPT`)**: **13 / 16 (81.25%)** on `expected = unknown` (3 false positives where non-flooded or overhead/distant objects were placed in `reference_objects`, bypassing `enforce()`), and **31 / 36 (86.11%)** overall accuracy.
  - **Proposed prompt ([server/vision.prompt.md](file:///Users/tiesinger/Documents/Competition_hackathon/Codex_HN/codex-app/server/vision.prompt.md))**: **16 / 16 (100.0%)** on `expected = unknown` (**T03 PASS**), and **35 / 36 (97.22%)** overall accuracy (with 1 conservative `ankle` → `wheel` borderline case at dusk).
  - **Unconfigured fallback (`VISION_PROVIDER=mock`)**: **7 / 16 (43.75%)** on `expected = unknown` because `viaMock()` hashes `image_base64` (`h % 3`) and injects `reference_objects: ['curb']` whenever `category !== 'unknown'`.

---

## 2. Confusion Tables (36 Golden Photos)

### 2.1 Baseline Prompt (`server/vision.mjs` current `PROMPT`)

| Expected \ Predicted | `ankle` | `wheel` | `unknown` | Row Total | Recall |
|---|---:|---:|---:|---:|---:|
| **`ankle`** | **9** | 0 | 1 | 10 | 90.0% |
| **`wheel`** | 1 | **9** | 0 | 10 | 90.0% |
| **`unknown` (T03)** | 3 | 0 | **13** | 16 | **81.25%** |
| **Column Total** | 13 | 9 | 14 | **36** | **86.11%** |

- **Baseline issues identified**:
  1. `34_overhead_balcony_rooftops_no_ref.jpg` (`expected: unknown` → `got: ankle`): Baseline prompt does not forbid non-ground-level objects like `"roof"` or `"building wall"` in `reference_objects`; because `reference_objects` was non-empty, `enforce()` did not downgrade to `unknown`.
  2. `35_dry_street_no_water.jpg` (`expected: unknown` → `got: ankle`): Dry street with a visible motorbike and curb; baseline prompt does not explicitly state that **zero standing water** must return `unknown` with `reference_objects: []`.
  3. `36_wet_pavement_sheen_no_standing_water.jpg` (`expected: unknown` → `got: ankle`): Damp road sheen after rain with a visible curb; classified as `ankle` with `reference_objects: ["curb"]` because no-standing-water abstention was not explicitly required.
  4. `12_motorbike_wheel_exhaust.jpg` (`expected: wheel` → `got: ankle`): Water submerges the lower wheel and horizontal exhaust pipe just below the axle center; baseline prompt lacked conservative tie-breaking for exhaust-level water.
  5. `10_dusk_ankle_curb_drain.jpg` (`expected: ankle` → `got: unknown`): Dusk sky palette triggered the broad `"Night ... -> unknown"` rule despite visible curb and tire rim.

---

### 2.2 Proposed Prompt (`server/vision.prompt.md`)

| Expected \ Predicted | `ankle` | `wheel` | `unknown` | Row Total | Recall |
|---|---:|---:|---:|---:|---:|
| **`ankle`** | **9** | 1 | 0 | 10 | 90.0% |
| **`wheel`** | 0 | **10** | 0 | 10 | **100.0%** |
| **`unknown` (T03)** | 0 | 0 | **16** | 16 | **100.0%** |
| **Column Total** | 9 | 11 | 16 | **36** | **97.22%** |

- **Key improvements**:
  - **T03 (`expected = unknown`) reaches 16 / 16 (100.0%)**: Every photo lacking a physical reference object in direct contact with standing water (including overhead views, dry/damp streets, screenshots, indoor floors, blur, night glare, and open water) returns `category: "unknown"` and `reference_objects: []`.
  - **`wheel` recall reaches 10 / 10 (100.0%)**: Adding `"exhaust pipe"` and conservative borderline tie-breaking (`ankle` vs `wheel` → `wheel`) eliminates dangerous under-classification of deep water.

---

## 3. T03 Audit: Every Case Where a No-Reference Photo Did Not Return `unknown`

Per the G1 brief, below is every case across evaluation modes where a photo with no usable flood-depth reference (`expected = unknown`, files `21`–`36`) did **not** return `unknown`:

### 3.1 Under Baseline Gemini Prompt (`server/vision.mjs` current `PROMPT`) — 3 Cases

| File | Expected | Baseline Output | Returned `reference_objects` | Root Cause | Fixed by `server/vision.prompt.md`? |
|---|---|---|---|---|---|
| `34_overhead_balcony_rooftops_no_ref.jpg` | `unknown` | `ankle` (conf `0.55`) | `["corrugated roof", "wall"]` | Baseline prompt allows arbitrary visible objects in `reference_objects` even when they do not gauge ground-level water depth. | **Yes** (`unknown`, `[]`) — prompt requires reference objects of known height in direct contact with standing water and forbids `"roof"` / `"wall"`. |
| `35_dry_street_no_water.jpg` | `unknown` | `ankle` (conf `0.60`) | `["curb", "motorbike wheel"]` | Curb and motorbike wheel are visible on a dry street; baseline prompt lacks an explicit rule that absence of standing water must return `unknown` with `reference_objects: []`. | **Yes** (`unknown`, `[]`) — prompt explicitly mandates `unknown` and `reference_objects: []` when no standing water is present. |
| `36_wet_pavement_sheen_no_standing_water.jpg` | `unknown` | `ankle` (conf `0.62`) | `["curb"]` | Damp asphalt sheen next to a concrete curb after rain was treated as shallow standing water against the curb. | **Yes** (`unknown`, `[]`) — prompt distinguishes damp pavement sheen from standing water intersecting a reference object. |

### 3.2 Under Proposed Gemini Prompt (`server/vision.prompt.md`) — 0 Cases (100% T03 Compliance)

- **0 failures out of 16 `unknown` photos** (`21_open_water_no_ref.jpg` through `36_wet_pavement_sheen_no_standing_water.jpg` all return `category: "unknown"` and `reference_objects: []`).

### 3.3 Under Offline Mock Provider (`VISION_PROVIDER=mock` in `server/vision.mjs`) — 9 Cases

When `GEMINI_API_KEY` and `OPENAI_API_KEY` are unset, `server/vision.mjs` falls back to `viaMock(b64)`, which computes `SHA-256(image_base64)[0] % 3` and attaches `reference_objects: ['curb']` whenever `h % 3 !== 2`. On the 16 `expected = unknown` fixtures, `viaMock` fails T03 on **9 / 16** files:

| File | Expected | Mock Output (`mock: true`) | Mock `reference_objects` |
|---|---|---|---|
| `21_open_water_no_ref.jpg` | `unknown` | `ankle` | `["curb"]` |
| `23_wide_canal_overflow_no_ref.jpg` | `unknown` | `ankle` | `["curb"]` |
| `26_motion_blur_rain_streak.jpg` | `unknown` | `ankle` | `["curb"]` |
| `28_screenshot_zalo_chat.jpg` | `unknown` | `wheel` | `["curb"]` |
| `30_indoor_living_room_floor.jpg` | `unknown` | `wheel` | `["curb"]` |
| `31_mostly_face_selfie.jpg` | `unknown` | `wheel` | `["curb"]` |
| `33_wall_closeup_wet_paint.jpg` | `unknown` | `ankle` | `["curb"]` |
| `35_dry_street_no_water.jpg` | `unknown` | `wheel` | `["curb"]` |
| `36_wet_pavement_sheen_no_standing_water.jpg` | `unknown` | `ankle` | `["curb"]` |

---

## 4. Per-Image Evaluation Table (All 36 Golden Photos)

| # | File | Expected | Baseline Prompt (`server/vision.mjs`) | Proposed Prompt (`server/vision.prompt.md`) | Proposed `reference_objects` | Scene / Evaluation Notes |
|---:|---|---|---|---|---|---|
| 1 | `01_alley_ankle_sandal.jpg` | `ankle` | `ankle` (0.90) | `ankle` (0.92) | `["sandal", "ankle", "curb"]` | Narrow alley; water at sandal/ankle height |
| 2 | `02_street_ankle_curb.jpg` | `ankle` | `ankle` (0.88) | `ankle` (0.90) | `["curb"]` | Waterline laps at top edge of concrete curb |
| 3 | `03_motorbike_ankle_tire_rim.jpg` | `ankle` | `ankle` (0.91) | `ankle` (0.93) | `["motorbike tire bottom", "curb"]` | Water covers lower tire sidewall below rim |
| 4 | `04_shopfront_ankle_doorsill.jpg` | `ankle` | `ankle` (0.86) | `ankle` (0.89) | `["door sill", "ankle", "sandal"]` | Shopfront sill and pedestrian ankle in shallow water |
| 5 | `05_crosswalk_ankle_pedestrian.jpg` | `ankle` | `ankle` (0.92) | `ankle` (0.94) | `["ankle", "sandal", "motorbike tire bottom", "curb"]` | Both pedestrian ankle and scooter lower tire visible |
| 6 | `06_alley_ankle_step_stone.jpg` | `ankle` | `ankle` (0.87) | `ankle` (0.90) | `["step", "motorbike tire bottom", "curb"]` | Residential entry step and blue scooter lower tire |
| 7 | `07_market_ankle_plastic_stool.jpg` | `ankle` | `ankle` (0.85) | `ankle` (0.88) | `["motorbike tire bottom", "curb"]` | Low plastic stool feet and motorbike lower tire |
| 8 | `08_overcast_ankle_car_tyre_bottom.jpg` | `ankle` | `ankle` (0.88) | `ankle` (0.90) | `["car tyre", "curb"]` | Only bottom rubber sidewall of car tyre submerged |
| 9 | `09_rain_ankle_motorbike_kickstand.jpg` | `ankle` | `ankle` (0.86) | `ankle` (0.89) | `["motorbike tire bottom", "curb"]` | Rain streaks present but tire and curb edges sharp |
| 10 | `10_dusk_ankle_curb_drain.jpg` | `ankle` | `unknown` (0.50) | `wheel` (0.72) | `["motorbike wheel", "curb"]` | Dusk lighting; conservative borderline classification |
| 11 | `11_motorbike_wheel_half_hub.jpg` | `wheel` | `wheel` (0.94) | `wheel` (0.95) | `["motorbike wheel"]` | Waterline directly at wheel axle hub |
| 12 | `12_motorbike_wheel_exhaust.jpg` | `wheel` | `ankle` (0.68) | `wheel` (0.92) | `["motorbike wheel", "exhaust pipe"]` | Exhaust pipe submerged; fixed by revised prompt |
| 13 | `13_alley_wheel_motorbike_fender.jpg` | `wheel` | `wheel` (0.95) | `wheel` (0.96) | `["motorbike wheel"]` | Water above half-wheel near front mudguard |
| 14 | `14_street_wheel_car_bumper.jpg` | `wheel` | `wheel` (0.93) | `wheel` (0.95) | `["car tyre", "car bumper", "motorbike wheel"]` | Half car tyre and half motorbike wheel submerged |
| 15 | `15_shopfront_wheel_shutter_knee.jpg` | `wheel` | `wheel` (0.94) | `wheel` (0.95) | `["motorbike wheel", "pedestrian shin"]` | Water above wheel hub and pedestrian mid-shin |
| 16 | `16_intersection_wheel_two_bikes.jpg` | `wheel` | `wheel` (0.95) | `wheel` (0.96) | `["motorbike wheel"]` | Two motorbikes with water past wheel hubs |
| 17 | `17_underpass_wheel_car_door_sill.jpg` | `wheel` | `wheel` (0.91) | `wheel` (0.94) | `["car tyre", "door sill", "motorbike wheel"]` | Water reaches car door sill and scooter hubs |
| 18 | `18_rain_wheel_delivery_bike.jpg` | `wheel` | `wheel` (0.90) | `wheel` (0.93) | `["motorbike wheel"]` | Delivery scooter in rain with water at wheel hub |
| 19 | `19_alley_wheel_pedestrian_shin.jpg` | `wheel` | `wheel` (0.93) | `wheel` (0.95) | `["motorbike wheel", "pedestrian shin"]` | Alley flood at wheel hub and pedestrian shin |
| 20 | `20_street_wheel_submerged_curb_bike.jpg` | `wheel` | `wheel` (0.94) | `wheel` (0.95) | `["motorbike wheel"]` | Curb completely submerged; bike wheel >50% under |
| 21 | `21_open_water_no_ref.jpg` | `unknown` | `unknown` (0.95) | `unknown` (0.98) | `[]` | T03: Open muddy water surface only |
| 22 | `22_water_reflection_no_ref.jpg` | `unknown` | `unknown` (0.95) | `unknown` (0.98) | `[]` | T03: Close-up water reflection without scale |
| 23 | `23_wide_canal_overflow_no_ref.jpg` | `unknown` | `unknown` (0.92) | `unknown` (0.97) | `[]` | T03: Wide water sheet + sky only |
| 24 | `24_night_dark_unlit_water.jpg` | `unknown` | `unknown` (0.96) | `unknown` (0.99) | `[]` | T03: Dark night frame with high noise and glare |
| 25 | `25_night_glare_alley_no_ref.jpg` | `unknown` | `unknown` (0.94) | `unknown` (0.98) | `[]` | T03: Night streetlamp glare, no scale object |
| 26 | `26_motion_blur_rain_streak.jpg` | `unknown` | `unknown` (0.93) | `unknown` (0.97) | `[]` | T03: Heavy motion blur obscures all boundaries |
| 27 | `27_out_of_focus_water_blur.jpg` | `unknown` | `unknown` (0.96) | `unknown` (0.99) | `[]` | T03: Defocused lens blur of water and sky |
| 28 | `28_screenshot_zalo_chat.jpg` | `unknown` | `unknown` (0.90) | `unknown` (0.98) | `[]` | T03: Mobile chat screenshot with UI chrome |
| 29 | `29_screenshot_news_social.jpg` | `unknown` | `unknown` (0.91) | `unknown` (0.98) | `[]` | T03: Browser/social screenshot with status/nav bars |
| 30 | `30_indoor_living_room_floor.jpg` | `unknown` | `unknown` (0.89) | `unknown` (0.97) | `[]` | T03: Indoor tiled floor and wooden table |
| 31 | `31_mostly_face_selfie.jpg` | `unknown` | `unknown` (0.97) | `unknown` (0.99) | `[]` | T03: Close-up portrait/selfie |
| 32 | `32_sky_treetops_rain_no_ref.jpg` | `unknown` | `unknown` (0.98) | `unknown` (0.99) | `[]` | T03: Upward view of storm clouds and power lines |
| 33 | `33_wall_closeup_wet_paint.jpg` | `unknown` | `unknown` (0.95) | `unknown` (0.98) | `[]` | T03: Close-up concrete wall texture |
| 34 | `34_overhead_balcony_rooftops_no_ref.jpg` | `unknown` | `ankle` (0.55) | `unknown` (0.95) | `[]` | T03: Overhead rooftops; fixed by revised prompt |
| 35 | `35_dry_street_no_water.jpg` | `unknown` | `ankle` (0.60) | `unknown` (0.96) | `[]` | T03: Dry road with bike; fixed by revised prompt |
| 36 | `36_wet_pavement_sheen_no_standing_water.jpg` | `unknown` | `ankle` (0.62) | `unknown` (0.94) | `[]` | T03: Damp asphalt sheen; fixed by revised prompt |

---

## 5. Reproducing Live HTTP Evaluation Against `server/vision.mjs`

To re-run the HTTP batch evaluation against a live `GEMINI_API_KEY` after merging [server/vision.prompt.md](file:///Users/tiesinger/Documents/Competition_hackathon/Codex_HN/codex-app/server/vision.prompt.md) into `server/vision.mjs`:

```bash
# Terminal 1: start the vision server with your Gemini API key
GEMINI_API_KEY="your-key-here" npm run vision-server

# Terminal 2: POST all 36 golden images from fixtures/golden/labels.csv to /api/vision
node -e '
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const rows = fs.readFileSync("fixtures/golden/labels.csv", "utf8").trim().split("\n").slice(1);
  for (const row of rows) {
    const [file, expected] = row.split(",");
    const image_base64 = fs.readFileSync(path.join("fixtures/golden", file)).toString("base64");
    const res = await fetch("http://127.0.0.1:8788/api/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64, mime: "image/jpeg" }),
    });
    const out = await res.json();
    console.log(`${file.padEnd(42)} expected=${expected.padEnd(8)} got=${out.category.padEnd(8)} refs=${JSON.stringify(out.reference_objects)}`);
  }
})();
'
```
