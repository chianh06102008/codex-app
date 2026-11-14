# FloodScout VN — Team Guide

Everyone reads this once before writing code. The product spec is [docs/PRD.md](docs/PRD.md); this file only says **who builds what, where, and how we merge it**.

- **Base branch:** `main` (FloodScout). `master` is the old "Hanoi Flood Watch" prototype — do not branch from it or merge into it.
- **Team:** 4 developers + 1 designer = 5 branches.
- **The rule that beats every other rule:** PRD §4 safety invariants and §18 copy. A PR that says "safe", shows a green "go", draws a route through a block, or lets a report publish without a category tap is rejected, even "just for the demo".

---

## 1. Who owns what

| Role | Branch | Owns (only you edit these without asking) | PRD sections |
|---|---|---|---|
| **Dev 1 — Lead / App shell** | `feat/shell` | `App.tsx`, `index.js`, `src/screens/_navigation.tsx`, `src/copy/`, `src/config.ts`, `src/domain/types.ts`, `src/screens/HomeScreen.tsx`, `src/screens/SettingsScreen.tsx`, test setup, `package.json` | §7 S1/S8, §9, §18, §21 steps 1–2 |
| **Dev 2 — Official status & rain** | `feat/official-status` | `src/features/official/`, `src/screens/WarningScreen.tsx`, `server/bulletin.mjs`, `fixtures/statements/` | §9 OfficialStatement, §13, §14, T01, T11, T14 |
| **Dev 3 — Map, fusion & routing** | `feat/map-routing` | `src/features/map/`, `src/features/fusion/`, `src/features/routing/`, `src/screens/AskScreen.tsx`, `ResultScreen.tsx`, `SegmentScreen.tsx`, `server/route.mjs`, `server/maps.mjs` | §8, §11, T05, T06, T12 |
| **Dev 4 — Report, vision & speed gate** | `feat/report-vision` | `src/features/report/`, `src/features/speed-gate/`, `src/screens/ReportScreen.tsx`, `server/vision.mjs` | §7 S6, §12, T03, T04, T07, T08, T13 |
| **Designer** | `design/ui` | `src/theme/`, `assets/`, `docs/design/` | §7, §8 colors, §18, `docs/taro-adi-library/` |

**Shared files** (`package.json`, `src/domain/types.ts`, `src/copy/strings.ts`, `src/config.ts`): change them in a **small, separate PR** and post in the team chat before you merge. Everyone else rebases right after.

### Target folder layout (Dev 1 creates it in the first PR)

```
App.tsx                    # providers + navigation only, no screen code
src/
  screens/                 # one file per screen S1–S8
  copy/strings.ts          # every user-visible string, vi + en (§18)
  copy/forbidden.test.ts   # T02 copy lint
  config.ts                # §21 constants (SPEED_GATE_KMH, REPORT_HARD_ZERO_HOURS, …)
  domain/types.ts          # §9 entities: OfficialStatement, Segment, Report, SegmentState, RouteResult
  theme/                   # designer: colors, type scale, spacing (react-native-paper theme)
  features/<area>/         # logic + components per team
server/                    # Node servers: maps (exists), bulletin, route, vision
fixtures/                  # pinned bulletin JSON, sample segments, sample reports
```

Screens get data **only** through functions in `src/features/*`, so each dev can swap a fixture for a real source without touching another person's screen.

---

## 2. Git workflow (everyone)

### First-time setup

```bash
git clone https://github.com/chianh06102008/codex-app.git
```

```bash
cd codex-app && git checkout main && npm install && npx expo install --fix
```

```bash
cp .env.example .env
```

### Start your branch (once)

```bash
git checkout main && git pull
```

```bash
git checkout -b feat/<your-area>
```

```bash
git push -u origin feat/<your-area>
```

### Every day / after every merge to main

```bash
git fetch origin && git rebase origin/main
```

If the rebase conflicts in a file you don't own, **stop and ask its owner**. Don't pick "mine" blindly.

### Shipping work

1. Commit small and often: `feat(report): dry-ground acknowledgement step`, `fix(fusion): 12h hard zero`, `chore: …`, `design: …`.
2. Before opening a PR, run:
   ```bash
   npx tsc --noEmit
   ```
   ```bash
   npm test
   ```
3. Push, then open a PR **into `main`** (never into `master`, never into another person's branch):
   ```bash
   gh pr create --base main --fill
   ```
4. At least **one teammate approves**. Dev 1 merges with **Squash and merge**.
5. Aim for PRs under ~300 lines that merge at least twice a day. A branch that sits for a day ends in a big conflict.

### Never

- Push directly to `main`.
- Commit `.env`, API keys, or `.p8` files. `.gitignore` already blocks them; keep it that way.
- Force-push someone else's branch.
- Commit `ios/` or `android/`. They're generated.

**Repo owner, one-time:** in GitHub Settings, set the default branch to `main` and add a branch protection rule on `main` (require a PR and one approval).

---

## 3. Coding rules (everyone)

- **Expo SDK 55.** Expo APIs change every SDK, so check `https://docs.expo.dev/versions/v55.0.0/` before using any Expo API. Add packages only with `npx expo install <pkg>` (never `npm install <pkg>`), and announce new packages in chat.
- **TypeScript only** in `src/`. Use types from `src/domain/types.ts`, and don't redefine them locally.
- **No hard-coded UI strings.** Every visible string goes in `src/copy/strings.ts` with both `vi` and `en`. Vietnamese is the default.
- **No hard-coded colors or sizes.** Use `src/theme/`. There is **no green** that means "go".
- **No magic numbers.** Thresholds go in `src/config.ts`.
- **Phone first:** 360 px wide, 130% font size, touch targets ≥ 48 px, primary action in the lower half of the screen.
- **Degrade by refusing (P10):** every `fetch` has a timeout and a failure path that makes the UI *more* cautious ("official status unavailable", category `unknown`, refusal). It never shows an empty calm state.
- **Secrets stay on the server** (`server/*.mjs` reads `.env`). The app only sees `EXPO_PUBLIC_*` URLs.
- **AI coding agents (Codex, Claude, …):** paste PRD §4 and §18 into the prompt, and review every generated string against the forbidden list before you commit.

### PR checklist (paste into every PR)

```
- [ ] No forbidden copy (safe / clear / passable / an toàn / đi được / nên đi …) — T02 test passes
- [ ] No green "go"; only the four states avoid / discouraged / uncertain / no_adverse_evidence
- [ ] Official warning band still visible and cannot be hidden
- [ ] Failure / offline path tested (airplane mode)
- [ ] Works at 360 px + large text, both vi and en
- [ ] tsc + tests pass; screenshots attached for UI changes
```

---

## 4. Instructions per team

### Dev 1 — Lead / App shell (`feat/shell`)

**First 2 hours (blocks everyone else, so do this first):**
1. Split the current `App.tsx` into `src/screens/*` with a small screen switcher in `src/screens/_navigation.tsx`. Keep `react-native-paper`. Don't add a navigation library mid-hackathon unless the team agrees.
2. Create `src/domain/types.ts` with every §9 entity. Create `src/config.ts` with the §21 constants.
3. Move all copy into `src/copy/strings.ts` (§18 table plus existing strings). Delete the old `copy.js` and `App.js` after checking with whoever wrote them (`index.js` already loads `App.tsx`).
4. Set up tests: `npx expo install jest-expo jest @types/jest` and add `"test": "jest"`. Write `forbidden.test.ts` (T02): it scans `strings.ts` for the forbidden list and allows only the exact negation sentence "không phải xác nhận an toàn".
5. Merge this PR quickly and tell everyone to rebase.

**Then:** S1 Home (status band from Dev 2's `getOfficialStatus()`, map slot from Dev 3, "Đi đường này?" button), S8 Settings (language, text size, privacy text), the T09 layout check, merging PRs, and owning the demo script.

### Dev 2 — Official status & rain (`feat/official-status`)

1. **Pin a real bulletin first.** Pick a real NCHMF bulletin for the Da Nang slice and save it as `fixtures/statements/<date>.json` in `OfficialStatement` shape, with its real `source_url` and times. **Never invent a warning** (§13 honest demo rule).
2. `src/features/official/getOfficialStatus()` returns `{ statements, status: 'ok' | 'last_known' | 'unavailable', retrievedAt }`. Start by reading the fixture.
3. Offline cache (T01): save the last successful result on the device. When offline, show it marked "last known", or the "feed down" string. Never show a calm empty state.
4. S2 Warning screen: issuer, issued time, valid period, retrieved time, original link above the fold (T11), and emergency numbers. The paraphrase sits under the original text, never in place of it.
5. `server/bulletin.mjs`: fetch the NCHMF page, parse it into `OfficialStatement`. On parse failure set `parse_status: 'failed'` and keep the link, with no generated summary.
6. Rain context from Open-Meteo, labeled as a model. It may add penalty only and never set the floor.
7. Export `statementsForSegment(segmentId)` / `floorForPoint(lat, lon)` so Dev 3's fusion can read the floor.

### Dev 3 — Map, fusion & routing (`feat/map-routing`)

1. **Fusion first, UI later** (§21 step 4). Write `src/features/fusion/computeSegmentState(segment, statements, reports, now)` → `SegmentState`, a pure function with no UI. Unit-test:
   - T05: a fresh no-water report inside an official warning doesn't lower the floor.
   - T12: a report at 12 h + 1 min has weight 0. Also cover the decay half-lives from `config.ts`.
   - No evidence ever yields a "safe" bonus.
2. Build a fixture road graph for one Da Nang district: segments in `fixtures/segments/`, keyed by OSM way id.
3. Routing (§11): drop candidates that touch `avoid`, refuse if any fresh ankle or water-`unknown` segment is on a motorbike or walking route, and return at most 2 options ranked by discouraged length, not minutes. On refusal return `kind: 'refusal'` with **no geometry at all** (T06). A self-hosted OSRM/GraphHopper is the goal; if it isn't running by mid-hackathon, use a small graph search over the fixture so the rules still apply.
4. Map on S1: draw the four states with the designer's colors. The official warning layer has no off switch (T14). The places search in `server/maps.mjs` already exists, so wire it into S3 Ask.
5. S4 Result: the headline is the risk statement or the refusal string, followed by the evidence list and the "unmapped roads" caveat every time. S5 Segment: why this road (floor, reports with ages, freshness).

### Dev 4 — Report, vision & speed gate (`feat/report-vision`)

1. S6 Report flow, in this order: dry-ground acknowledgement (required) → camera → map confirm of the snapped segment → explicit tap on **ankle / wheel / unknown**. There's no publish button until a category is tapped (T04).
2. Draft persistence (T08): save each step on the device, so killing the app keeps the draft. When offline, mark the report "queued, not published".
3. Privacy (T13): strip EXIF and downscale to ≤ `PHOTO_MAX_BYTES` before upload, and blur faces/plates if time allows. Upload only the processed image.
4. `server/vision.mjs`: send the photo to a vision model (the OpenAI key lives in server `.env`). The response must be exactly `{ category: 'ankle'|'wheel'|'unknown', confidence, reference_objects[] }`. **No centimeters** (P4). Reject any other field. No usable reference object → `unknown` (T03).
5. Timeout path **before** vision (§21 step 9): if the server is slow or down, the user can only pick `unknown` plus a "water visible" flag. Build and demo this path first.
6. Speed gate (T07): using while-in-use location, above `SPEED_GATE_KMH` replace route detail and the camera with a full-screen "Dừng xe trước khi xem tiếp." Explain the permission in Vietnamese before the system dialog.
7. The `Report` object stores `model_category` and `human_category` separately, and fusion uses the human one.

### Designer (`design/ui`)

1. **Tokens first (day 1, morning):** deliver `src/theme/index.ts` with daylight-readable colors, type scale, spacing, and radius, and colors for the **four states**: avoid, discouraged, uncertain, no_adverse_evidence. The calmest state is **neutral, not green**. Check contrast for sunlight and WCAG AA. Devs import only from here.
2. Screens S1–S8 at 360 px in Figma (or your tool), Vietnamese text first, since Vietnamese strings run longer. Share the link in `docs/design/README.md`.
3. Use the design library in `docs/taro-adi-library/` (accessibility gate in `10-QUALITY/`) for your review checklist.
4. App icon and splash go in `assets/`. Coordinate with Dev 1, who wires them into `app.config.js`.
5. **Design review on every UI PR:** you're a required reviewer for screen changes. Fail anything that hides the warning band, uses green for "go", or breaks at large text.
6. Git: same flow as the devs. If you don't use the command line, use GitHub Desktop: branch `design/ui` → commit → "Create Pull Request" into `main`.

---

## 5. Integration plan

| Phase | Goal | Done when |
|---|---|---|
| **0 — Kickoff (2 h)** | Dev 1 shell PR merged; designer tokens v0 merged | Everyone rebased onto the new structure |
| **1 — Floor & refusal** | Pinned bulletin on S1/S2, fusion + tests, refusal result, report flow with `unknown`-only | T01, T02, T05, T06, T11, T12, T14 pass |
| **2 — Real data** | Live bulletin parse (or pin), routing on a real graph, vision server, speed gate | T03, T04, T07, T08, T13 pass |
| **3 — Polish & demo** | Design pass, vi/en complete, 360 px + large text | T09, T10 pass; demo rehearsed twice |

**Feature freeze** is 3 hours before the deadline. After that, only bug fixes merge, and Dev 1 tags the demo build.

**Daily sync (10 min):** what I merged, what I'm merging next, what blocks me, and any shared-file change.
