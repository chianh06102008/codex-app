# FloodScout VN — Product Requirements

**Draft 1.0 · 10 November 2026**
**Status:** For build and safety review. Not a launch approval.
**Form:** Phone only. Mobile web, installable as a PWA. Android Chrome is the reference. No desktop product.
**Pilot:** One district-scale slice. Da Nang recommended. Can Tho is the second city, not the first.
**This document supersedes the concept note.** Where they disagree, this document wins.

FloodScout helps a person who is **stopped, on a phone**, decide whether to travel. It fuses official warnings, rainfall context, road-snapped crowd reports, and a penalized road graph. It may suggest a detour only when that detour avoids segments it has reason to distrust. If it cannot, it says so and points at the official instruction.

It does not forecast water to the centimeter. It does not certify a journey. It never calls a road safe.

## 0. How to read this if you are implementing it

Safety rules in §4 are release blockers. A screen that violates one is unfinished, including in a demo.

For a 60–72 hour build, implement §4, §7, §8 (MVP rows), §11, §12, §13, §18, and §21. Later sections exist so the weekend build does not paint the product into a corner.

| If you are… | Do this |
|---|---|
| Building the demo | Implement the MVP column only, but keep the data model able to express V1 fields. |
| Designing screens | Four states only. No green “go”. Warning cannot be hidden. |
| Integrating data | Do not assume an API that §14 marks unconfirmed. |
| Reviewing a PR | Fail it for forbidden copy, a polyline through a hard block, or a photo flow that skips confirmation. |

## 1. Product

People in Vietnamese cities already have weather apps and an official warning system. They do not have an honest phone answer to: this road, right now, for a motorbike, with the official warning still in force.

NCHMF (National Center for Hydro-Meteorological Forecasting) publishes heavy-rain, flood, flash-flood, and landslide warnings. VNDMS (Vietnam Disaster Monitoring System, vndms.dmc.gov.vn) maps rain, river levels, reservoirs, and storms. Those products are authoritative and coarse relative to one hẻm. Residents already photograph flooded streets. FloodScout turns those photos into short-lived road-segment evidence and refuses to let that evidence talk over a government warning.

World Bank context, not a mandate and not a feed:

- Can Tho Urban Development and Resilience, P152851, about US$250 million, approved 2016.
- Da Nang Sustainable City Development, P123384, about US$272 million, approved 2013, including drainage and flood protection.

The decision happens outside, often in rain, usually before a motorbike trip, on a mid-range Android phone, on a network that gets worse as the weather does. A desktop dashboard is not a version of this product. A wide screen shows the same single column, centered. It does not gain panels.

### Corrections to the concept note

| Concept note | Build this instead |
|---|---|
| Google Weather alerts as an NCHMF source | As of this draft, the Google Weather API is a preview. Public docs do not confirm Vietnam alert coverage or NCHMF as a named source. Official text comes from nchmf.gov.vn, luquetsatlo.nchmf.gov.vn, and vndms.dmc.gov.vn. Google Weather or Flood Hub may appear only as a labeled, non-authoritative layer. |
| Phone elevation as a flood input | Handset altitude and barometer are not flood-depth sensors. Use Copernicus DEM GLO-30 at the snapped road coordinate as a weak prior only. Never show a personal flood elevation. |
| Ankle / wheel / unknown | Keep that three-way model output. Ankle describes a photograph. It is not permission to cross. Moving water at ankle depth knocks people off motorbikes. The category may penalize a segment. It may not clear one. |
| Implied national coverage | Architecture can travel. First release is one urban slice plus the official warnings that intersect it. |

## 2. Problem and job

Flood disruption in Vietnam is not one hazard.

- Da Nang and the central coast: cloudbursts, urban drainage failure, flash floods and landslides in steep catchments.
- Can Tho and the Mekong Delta: river flood, heavy rain, and tide.
- Ho Chi Minh City: tidal inundation plus a dense, partly unmapped alley network, and many people who will try to ride through it.

A province-colored “flood layer” does not answer a 400-meter trip. Official systems are the right authority and the wrong zoom level. A commune warning can be true while one street inside it is dry, and a dry-looking street can be about to become a drain. Zalo photos fill the gap. They are timely, unsigned, easy to fake, and dangerous when read as an all-clear. Delivery riders are paid to keep moving, so any product that ranks routes by travel time will be used as permission.

**Job, in order:**

1. The official instruction for this place, in plain language, with source and clock time.
2. Whether FloodScout will suggest the specific roads to a specific place.
3. If not: wait, or follow an evacuation or shelter instruction if one was published.

The job is not “navigate through the flood.”

**Success is not** a completed trip through water, a precise depth, a smaller ETA, or a map that looks calm because nobody has reported yet. A quiet map during a warning is a failed interface.

## 3. Users

Design against the person who most wants the product to say yes.

| Person | What the product must do |
|---|---|
| Hùng, 24, delivery rider | Paid per trip. Will take a “faster” route through water if ETA is the headline. Never offer that comparison. If the only faster path touches a blocked or heavily penalized segment, the answer is to stay, not a number of minutes. |
| Lan, 31, motorbike commuter | Decides at the door, in rain glare, one phone. Official line and a don’t-go-or-cautious-alternative on her usual route in two taps. No feed. |
| Mai, 58, at home | Wants to know if her alley is inside a warning. Will not file a report. Large type. Do not ask her to walk to the water to check. Do not make “ride over there” the easy response for her family. |
| Khoa, ward staff | Will reject the product the first time it contradicts a bulletin. Official text keeps its meaning, with a link. Crowd dots cannot paint his commune green. |
| Alex, visitor | English is complete on the core loop. During a warning, tell him to follow hotel and official instructions rather than explore alternatives. |

Accounts, when they exist, are for ages 16 and older. No child profile. No collection of a child’s location. A parent uses their own phone.

## 4. Safety invariants

These are testable. Put them in code and in CI, not only in a README.

**P1. Never call a road safe.** No label, color, icon, share card, or spoken line means safe, clear, passable, “OK to cross,” or “an toàn” as a claim. The calmest state is “no adverse evidence recently,” and the same view says this is not a clearance. Do not use green as a go color.

**P2. Official warnings are a floor.** Crowd reports, dry photos, stale photos, and missing photos may raise risk. None may lower it beneath the current official warning. If the official feed cannot be reached, do not infer that no warning exists.

**P3. Refusal is success.** If every reasonable route touches a segment the product will not use, say it will not suggest a way. Do not fall back to the fastest path. Do not draw a grey polyline through the block “for information.” A greyed-out dangerous route is still a route.

**P4. Categories, never false precision.** Vision returns `ankle`, `wheel`, or `unknown` only. No centimeters. No extra measurement field. Unknown is required when a reference object is missing or the model times out.

**P5. Evidence expires.** Routing weight is zero after 12 hours. The photo may remain on a timeline after its weight is gone.

**P6. Do not send people toward the water.** No “go verify,” no wading for a better picture, no points, ranks, or bounties. Photos from dry ground or not at all.

**P7. Stopped, or not at all.** Above 15 km/h, replace route detail and the camera with a full-screen pull-over gate. Turn-by-turn while riding is out of every phase, not a later enhancement.

**P8. Clock and source on every official statement.** Issuer, issued time, validity, retrieval time, link to the original. Paraphrase sits under the original, never instead of it, and never softens it.

**P9. Phone-only.** If it does not work at 360 CSS pixels, in daylight, with a wet thumb, on a flaky network, it is not a feature yet.

**P10. Degrade by refusing.** A failed dependency makes the product more conservative. It must not become a cheerful map with an empty warning banner.

## 5. Goals, non-goals, measures

### Goals

- During a known warning, official instruction is the first substantive content, source and time included, in two taps or fewer from a cold start.
- A destination question returns either a cautious alternative that passes the safety budget, or a refusal, with evidence named.
- A person who is safely stopped can attach a road-snapped photo that becomes one of the three categories.
- During an active warning, crowd evidence cannot produce a calmer answer than the warning alone.

### Non-goals

- Replacing NCHMF, VNDMS, provincial disaster offices, or 113 / 114 / 115.
- Rescue dispatch, a shelter registry of our own, or implying that a report notifies rescuers.
- City-wide hydrodynamics, centimeter depth, personal flood elevation.
- Social features: follows, likes, public profiles, bounties, a flood photo feed.
- Always-on location, movement history, selling location.
- Certifying roads for logistics, insurance, or emergency vehicles.

### Measures

Do not adopt a metric that rewards trips through flooded streets. Measure the screen, not where the person went afterward.

| Measure | Definition | Intent |
|---|---|---|
| Instruction first | Share of sessions during a known warning where the official instruction is the first substantive content | At or near 100% |
| Refusal honesty | Share of route requests refused or diverted when a block lies on the obvious path | Track it. Do not set a target that pressures the team to route anyway |
| Copy lint | Count of forbidden strings on route, share, and push surfaces | Zero, in tests |
| Unknown discipline | Labeled images with no usable reference object return `unknown` | Effectively all of them |
| Two-tap instruction | Moderated task from launch | Succeeds for Lan and for Mai at large text |
| Report life | A report older than 12 hours has routing weight 0 | Always |

## 6. Phone requirements

Reference device: a mid-range Android phone several years old (budget Samsung, Oppo, or Xiaomi), Chrome, viewport about 360–400 CSS pixels. iPhone SE width (375) must work. iOS Safari must complete the core loop (warning, map, report, route or refusal) even if push is weaker. Distribution is an installable PWA so a storm does not wait on store review. A native Android wrapper is V1, for push, and is not a second UI.

### Layout and touch

- No horizontal scrolling at 360 CSS px or at 130% system font size.
- Body text ≥ 16px. Warning text ≥ 18px. Daylight theme is the default. WCAG 2.2 AA on warning and route screens. Color is never the only signal.
- Touch targets ≥ 48×48 px, spaced apart. Primary action in the bottom thumb zone. Zoom buttons exist; pinch is optional.
- One primary action per screen. Layers live in a bottom sheet. The official warning layer cannot be switched off while a warning is in force.
- Camera shutter is a large bottom control. A report draft survives a call, an app switch, or a killed process.
- Warning banner is an alert region for screen readers. Route refusal is announced. Icon buttons have accessible names in both languages.

### Location, battery, motion

- Permission is while-in-use only. Never request always-on. GPS off when backgrounded.
- Coarse location is enough to pick which warning to show. Fine location only when filing a report or asking for a route.
- If accuracy radius > 50 m, do not snap a report until the person confirms the segment on the map.
- Speed > 15 km/h: full-screen gate, copy in §18. No result, no camera.

### Budgets

| Budget | Target |
|---|---|
| PWA shell | About 1 MB or less, cached |
| Warning text on slow 3G | Cached shell shows the last warning, or an explicit unavailable state, within about 8 s. Never spin into an empty calm map |
| Map on ordinary 4G | Pilot-district vector map usable within about 3 s after the shell |
| Photo | ≤ ~500 KB after compression. Faces and plates blurred on device before upload |
| Vision | Server-side in the MVP. If the server does not answer, the person can still submit water-present with category `unknown` |
| Languages | Vietnamese default. English is a full translation of the core loop, not a mix in one sentence. Choice persists |

## 7. Screens

Single column. Map or sheet. One main action. UI copy is Vietnamese first; English strings in §18.

| ID | Screen | Behavior |
|---|---|---|
| S1 Home | Map of the immediate area | Top band is official status, always, including when status is unavailable. Bottom sheet peeks the one-line instruction. Primary action: ask about a destination (`Đi đường này?`). |
| S2 Warning | Full instruction | Issuer, issued time, valid period, retrieved time, link. Evacuation or shelter text from the bulletin sits above any route control. |
| S3 Ask | Destination | Origin defaults to current fix. Mode defaults to motorbike. Walking and car exist. The button asks a question. It does not say Start. |
| S4 Result | Refusal or route | Headline is the risk statement. At most two options, ranked by how little discouraged road they use, not by minutes. Duration is secondary and omitted when it would invite a race. Evidence lists the segments that changed the answer. |
| S5 Segment | Why this road | Official floor, reports with ages, model category vs human confirmation, freshness. No comment thread. |
| S6 Report | Camera flow | Required dry-ground acknowledgement, then camera, then map confirm of the snapped segment, then an explicit tap on ankle / wheel / unknown. Cannot publish without that tap. |
| S7 Places | Optional labels | Home, work, one family address. Labels, not a live tracker. V1: also watch targets. No “route to this person.” |
| S8 Settings | Consent and display | Language, text size, data saver, consent, delete-my-reports, plain retention statement. Explain permissions before the system dialog, in Vietnamese. |

### Flow: leave or stay

Open the app. Read the official band. If it says not to travel, the route action starts collapsed under that sentence. If the person still asks for a destination, run the graph. Offer a route only when it avoids every hard block and stays inside the penalty budget. Otherwise show refusal, repeat the official instruction, and draw no line through blocked roads.

### Flow: report

The first line is the dry-ground rule (§18). Then camera. Strip unneeded EXIF. Blur faces and plates on device. Snap to the nearest OSM way. Person confirms the highlight and can move it. Model may propose a category. Person must tap one. Disagreement is stored and is not used to retrain during an incident. If the model is down, the only depth choice is `unknown`, plus a separate flag that water is visible. If offline, queue the report and show that it is not published yet.

### Flow: family

Saved places show warning state for that point. V2 check-in is a deliberate message: I am here, I am not traveling. Not a live share. The receiving screen has no action that routes toward the pinned person.

## 8. Segment states

Exactly four. There is no fifth.

| State | Key | Routing |
|---|---|---|
| Tránh | `avoid` | Hard block. No offered route may traverse it. Not drawn as a suggested line. |
| Không nên đi | `discouraged` | Penalty. A route may include it only under the budget in §11. Headline must not quote a time saving. |
| Chưa rõ | `uncertain` | Missing, stale, conflicting, or official feed down. Treated as discouraged for walking and motorbike. Never rendered as a quiet road. |
| Chưa thấy dấu hiệu bất lợi | `no_adverse_evidence` | Not a clearance. Neutral color, not green. Full sentence in §18 is required in the same view. |

English labels: Avoid, Strongly discouraged, Uncertain, No adverse evidence recently. Do not translate the calmest state as “Clear.”

### What sets state

| Evidence | Effect | Limit |
|---|---|---|
| Evacuation or do-not-travel instruction | `avoid` | Photos cannot lift it |
| Flash-flood or landslide warning on the segment | `avoid` | Same |
| Confirmed `wheel`, or `unknown` with water visible, still fresh | `avoid` for walk and motorbike | Cannot later clear the segment by itself |
| Confirmed `ankle`, fresh | `discouraged` for all modes | Not a green light for cars |
| Debris or landslide obstruction report | `avoid` | Separate from depth |
| Fresh no-water report, feed healthy, no official floor | May retire a crowd penalty | Never retires a floor. Never sets a clearance |
| Low DEM plus heavy rain context | `discouraged` | Labeled as context, not a measurement |
| Report older than 12 hours | Weight 0 | May remain on the timeline as expired |
| Any evidence | Must not apply a positive “safe” bonus | There is no negative-risk weight |

If two official instructions overlap, the stricter one is the floor.

When the official feed is unavailable: status band says official status is unavailable; segments in the user’s current district are at least `uncertain`. Do not keep an all-clear. The last warning may stay on screen past retrieval freshness if that is the more conservative artifact, marked last-known and not refreshed.

### Decay

- While heavy rain continues, crowd weight halves in well under an hour (start at 45 minutes).
- If rain context has eased and there is no official floor, weight may live a few hours (start at 3 hours half-life).
- 12 hours is a hard zero either way.
- Retract is zero immediately.
- Two independent no-water reports may retire a crowd penalty early only when the floor is absent and rain context is quiet. The segment goes to `uncertain` until the penalty is actually gone and nothing else is in force. It does not jump to `no_adverse_evidence` while uncertainty remains.

## 9. Domain model

Implement these entities. Names can change; fields cannot silently disappear.

### OfficialStatement

```
id
source_url
retrieved_at
issuer
hazard_type            # heavy_rain | flood | flash_flood | landslide | storm | other
area_names[]           # as published; do not drop one
geometry               # nullable polygon; null if only names were parsed
valid_from
valid_until            # nullable
instruction_text       # original language
instruction_text_vi    # if source was not Vietnamese
instruction_text_en
severity               # as published; do not downgrade
do_not_travel          # bool, true if instruction says not to go out / evacuate
pinned_by              # null or staff id
parse_status           # ok | partial | failed
```

A failed parse still stores `source_url` and `retrieved_at`. The UI shows the link and does not invent a summary.

### Segment

```
id                     # OSM way id, or way id + range if split
osm_way_id
geometry
name                   # nullable
admin_ids[]            # commune etc. when known
dem_sample_m           # nullable, Copernicus, not handset
```

### Report

```
id
created_at
server_received_at
segment_id
lat, lon               # confirmed snap, not a raw track
accuracy_m
model_category         # ankle | wheel | unknown | null
model_confidence       # 0–1 or null
model_reference_objects[]
human_category         # ankle | wheel | unknown   # this is what fusion uses
water_visible          # bool
obstruction            # none | debris | landslide
vehicle_context        # nullable: foot | motorbike | car   # V1
no_water               # bool, V1; mutually exclusive with a depth claim
reporter_trust         # low for anonymous MVP
perceptual_hash
status                 # draft | queued | published | retracted | expired
retracted_at
```

No field for centimeters anywhere in this object or in the vision HTTP response. Reject responses that add one.

### SegmentState (derived, not hand-edited except via moderation unpublish)

```
segment_id
state                  # avoid | discouraged | uncertain | no_adverse_evidence
floor                  # none | warning | do_not_travel
floor_statement_id
reasons[]              # { kind, report_id or statement_id, at }
computed_at
```

Moderation may unpublish a report. Moderation cannot publish a clearance and cannot lower a floor.

### RouteResult

```
kind                   # route | refusal
statements[]           # official statements shown with the result
options[]              # 0, 1, or 2
  geometry
  segments[]
  state_counts
  explanation_facts[]  # structured; prose is rendered from these only
  duration_s           # nullable; omit in UI when it would invite a race
unmapped_caveat        # always true in MVP
```

## 10. Feature catalog

Phases: **MVP** (60–72 h, one district, real safety rules), **V1** (pilot with real users after safety review), **V2** (second city and deeper context), **Partner** (only with a government or operator agreement).

### 10.1 Official status

| ID | Feature | Behavior | Phase |
|---|---|---|---|
| F01 | Area status band | First element on S1. Strongest current official instruction intersecting the view or the user’s commune, with issuer and time. | MVP |
| F02 | Warning sheet | Full bulletin substance, validity, retrieved time, link, routing consequence. Evacuation text outranks the route button. | MVP |
| F03 | Do-not-travel emphasis | When the bulletin says not to go out, route controls start collapsed under that sentence. | MVP |
| F04 | Degraded official state | Retrieval failure or stale page: “Official status unavailable.” Do not show an empty success. Tighten routing. | MVP |
| F05 | Freshness on every layer | Each layer shows last-known-good time. A layer without a time is not shown as current. | MVP |
| F06 | Commune search | By place name or commune, so someone can check an administrative warning without standing in the alley. | MVP |
| F07 | River alarm levels | Where VNDMS or a provincial page publishes báo động levels, show them on the relevant waterway. They raise the floor for adjacent low segments only under a reviewed rule, not by visual guesswork. | V1 |
| F08 | Flash-flood and landslide polygons | From luquetsatlo.nchmf.gov.vn when access actually works. Coverage is a hard block. If blocked, do not fake the layer. | V1 |
| F09 | Reservoir and discharge notices | Only when an official page publishes them. Never infer a release from a water level. | Partner |
| F10 | Shelter points | Only from an official list, with that list’s date. Do not crowdsource shelters. | Partner |

### 10.2 Map and context

| ID | Feature | Behavior | Phase |
|---|---|---|---|
| F11 | Pilot vector map | Streets and mapped alleys. Offline-capable for the pilot district. OSM attribution. Missing alleys are stated in the route result. | MVP |
| F12 | Report markers | Clustered, age-faded. Tap opens the segment, not the photo. Photo is a second tap. | MVP |
| F13 | Rain context | Open forecast (Open-Meteo or equivalent). May raise penalties. Labeled as a model. Not a warning. | MVP |
| F14 | Layer sheet | Bottom sheet. Official warning layer has no off switch during an active warning. | MVP |
| F15 | Denser rain or radar | Where a lawful feed exists. Context only. | V1 |
| F16 | Storm track | Seasonal, visually subordinate. Must not push the warning sentence off the first screen. | V1 |
| F17 | Saved places | A few labels on this phone. Destinations, later watch targets. Not a trail. | V1 |
| F18 | DEM low-spot prior | Copernicus DEM GLO-30 at the road. With heavy rain, may discourage. Never clears. Never shown as water depth. | V1 |
| F19 | Tide and compound flood | Required before routing in Can Tho, HCMC, or any tidal city. Da Nang MVP does not pretend to include it. | V2 |
| F20 | Seasonal memory | Aggregated past seasons, with a year. A prior, not a live claim. No individual tracks. | V2 |
| F21 | District offline pack | Optional download of pilot roads and last warnings. | V1 |

### 10.3 Reports

| ID | Feature | Behavior | Phase |
|---|---|---|---|
| F22 | Photo report | From a stop on dry ground. Evidence, not a post. | MVP |
| F23 | Dry-ground gate | Flow cannot start until the acknowledgement is tapped. Friction is intentional. | MVP |
| F24 | Three-way category | Model: `ankle` \| `wheel` \| `unknown`. Human must confirm. | MVP |
| F25 | Segment snap | Nearest OSM way, person confirms, highlight is easy to move. Poor GPS forces confirmation. | MVP |
| F26 | On-device redaction | Blur faces and plates before upload. Strip unneeded EXIF. Keep time and confirmed location. | MVP |
| F27 | Offline queue | Confirmed report waits on device. UI shows it is not published. | MVP |
| F28 | Duplicate rejection | Perceptual hash plus a short rate limit. | MVP |
| F29 | Decay | §8. Hard zero at 12 hours. | MVP |
| F30 | No-water report | Sees no standing water from dry ground. Expires quickly. Cannot override a floor. UI must not call it safe. | V1 |
| F31 | Receded update | Same reporter only. Decays their report. Does not speak for the commune. | V1 |
| F32 | Debris or landslide block | Separate from depth. Can hard-block. | V1 |
| F33 | Vehicle context | Optional tag. Context, not a measured depth. | V1 |
| F34 | Retract | Own report only. Weight zero immediately. Audit record remains. | V1 |
| F35 | Trust weight | Independent agreement and agreement with rain can raise weight. New or anonymous weighs less. Nothing weighs enough to lower a floor. | V1 |
| F36 | Segment timeline | Chronological, expired items visibly expired. | V1 |
| F37 | Verified org reporter | Ward office or fleet under agreement. Higher starting weight. Public sees organization name only. | Partner |
| F38 | Zalo card | First line is official status or the refusal. Never a green road. | V2 |

### 10.4 Routing

| ID | Feature | Behavior | Phase |
|---|---|---|---|
| F39 | Ask for a way | Origin, destination. Motorbike default. Walk and car available. Result is a suggestion under the rules, or a refusal. | MVP |
| F40 | Penalty graph | Self-hosted engine on an OSM extract. Hard blocks are hard. A consumer directions API that only “avoids polygons” as a hint is not enough. | MVP |
| F41 | At most two options | Ranked by discouraged-road share, not minutes. Do not show the faster route if it is the wetter one. | MVP |
| F42 | Explanation | Names segments, evidence type, and age. Generated sentences may only use those fields. | MVP |
| F43 | Refusal | Every candidate hits a hard block, or discouraged length exceeds the budget. Say so. Link the bulletin. Draw no path. | MVP |
| F44 | Speed gate | > 15 km/h. No result, no camera. | MVP |
| F45 | Unmapped-road caveat | Mandatory sentence. Suggestion uses mapped roads only and may miss alleys. | MVP |
| F46 | Replace result live | A new block before the person leaves S4 replaces a route, including turning it into a refusal. | V1 |
| F47 | Truck or bus mode | Still cannot traverse hard blocks. Still not called passable. Ankle water stays discouraged. | V1 |
| F48 | Share the decision | “I am not coming,” not a route pictured as recommended. Deep link opens the warning first. | V1 |
| F49 | Time-varying penalty | Rain in later hours may discourage segments they would reach later. Labeled forecast context. | V2 |
| F50 | Return trap | If the way back would be blocked, say leaving may strand them. Do not route through the block. | V2 |
| F51 | Relative low spots | On a suggested route, mark mapped low spots as uncertain context. Not a depth profile. | V2 |
| F52 | Depart later | Same question for a later hour. Still cannot be a clearance. Floor still dominates. | V2 |

### 10.5 Models

| ID | Feature | Behavior | Phase |
|---|---|---|---|
| F53 | Bulletin retrieval | Fetch official pages into `OfficialStatement`. On parse failure, keep the link and do not invent a summary. | MVP |
| F54 | No softening | May translate and shorten. May not turn “do not go out” into “be careful,” and may not drop a place from the area. | MVP |
| F55 | Vision schema | Category, confidence, reference objects, refusal reason. Drop responses that add a measurement. | MVP |
| F56 | Fusion | Floor plus unexpired reports plus context penalties → one of four states. Floor wins. | MVP |
| F57 | Grounded explanation | Generator input is evidence ids only. If it cannot cite one, it does not speak. | MVP |
| F58 | No incident training | Log disagreements. Do not update weights online while a warning is active. Model changes ship between incidents, on a reviewed set. | MVP |
| F59 | Grounded Q&A | “What is in force in this commune?” quotes the bulletin and refuses to go past it. Refuses “is it safe.” | V2 |

### 10.6 Alerts and other people

| ID | Feature | Behavior | Phase |
|---|---|---|---|
| F60 | Watch a place | Notify when official status for a saved place worsens. A few places, not a moving GPS fence. | V1 |
| F61 | Push on upgrade | One notification when severity rises. Not a rain commentary. Critical alerts, if ever, are opt-in and only for the bulletin’s own highest level. | V1 |
| F62 | Family check-in | Deliberate ping. No continuous share. No “go to them.” | V2 |

### 10.7 Phone platform

| ID | Feature | Behavior | Phase |
|---|---|---|---|
| F63 | Installable PWA | Home-screen icon, cached shell, Android Chrome. Note Safari install limits in tests. | MVP |
| F64 | Vietnamese and English | Complete core loop. Default vi. Persisted. | MVP |
| F65 | Daylight theme | Default. Night theme is later and must still meet contrast. | MVP |
| F66 | Text size and reader | System font scale to at least 130%. Warning and refusal exposed to the screen reader. | MVP |
| F67 | Data saver | Vector and warnings only. No satellite. No autoplay. Compressed photos. | MVP |
| F68 | Draft survival | Local persistence through process death. | MVP |
| F69 | While-in-use location | No always-on. GPS off in background. | MVP |
| F70 | Low-battery policy | Stop GPS refresh, say so, keep the last warning readable. | V1 |
| F71 | Native Android wrapper | Same UI, better push. Not a second product. | V1 |
| F72 | iOS core-loop parity | Warning, map, report, route or refusal on Safari. Do not block the pilot on iOS push. | V1 |
| F73 | Haptics | Distinct vibration for a severe official upgrade only. Never a haptic that means go. | V2 |

### 10.8 Account, privacy, operations

| ID | Feature | Behavior | Phase |
|---|---|---|---|
| F74 | Consent | Separate explicit consent for precise location and for photos, before either is taken. Purpose in ordinary Vietnamese. Withdrawable. | MVP |
| F75 | Session reports | MVP may accept a report without an account, low trust, local id. Tell the person it weighs less. | MVP |
| F76 | Retention rules | Show the rule in MVP even if enforcement is partly manual. Photos are short-lived. Segment id, category, and time may outlive the image. | MVP |
| F77 | Phone OTP | Retract, delete, higher trust. 16+. | V1 |
| F78 | Delete my reports | Deletes the photo and zeros routing weight. A minimal abuse-audit record may remain, and the notice says so. | V1 |
| F79 | In-country photo storage | Vietnam-region provider before a public pilot. | V1 |
| F80 | Cross-border notice | If vision or retrieval runs outside Vietnam, say so at consent, not only in a policy link. | MVP |
| F81 | Ingest console | Staff can pin a bulletin the agent failed to parse, with URL and time. Every pin is attributed. | V1 |
| F82 | Moderation queue | Unpublish a report. Cannot publish a clearance. Cannot lower a floor. | V1 |
| F83 | Area kill switch | Turn routing off for an area. Official instructions stay up. Logged. | V1 |
| F84 | Audit log | Overrides, unpublishes, kill switch, parse failures. Longer life than photos. | V1 |
| F85 | City safety review | Do not enable routing in a new city until the graph, sources, and copy deck are reviewed for that city. Tide cities include the tide decision. | V1 |
| F86 | Fleet feed | Verified reports under contract. FloodScout does not become their dispatcher and does not rank jobs by a wet ETA. | Partner |
| F87 | Ward hotspot view | Aggregated segment states for a commune. No reporter identities. No trails. | Partner |
| F88 | Outbound risk feed | Same four states and the same floor rule. No “safe roads” endpoint. | V2 |

## 11. Routing rules

1. Build candidates on the pilot OSM extract with a self-hosted engine (Valhalla, GraphHopper, or OSRM with a real custom cost — the requirement is the penalty, not the brand).
2. Drop any candidate that traverses an `avoid` edge.
3. Refuse if any fresh `ankle` or water-`unknown` segment remains on a motorbike or walking route. This is the starting budget: one such segment is enough. Tune only toward stricter, not looser, unless a written safety review says otherwise.
4. Also refuse if discouraged length exceeds a small share of the trip. Start strict. Record the constant in config, default conservative.
5. If nothing survives, `RouteResult.kind = refusal`. Do not attach a fallback polyline.
6. Travel time may break ties between routes that already passed the budget. It is not the objective.
7. Always set `unmapped_caveat`.
8. The retrieval agent does not answer routing questions. Routing reads geometry intersection with statements, not the prose.

Map tiles: vector, pilot extract, able to cache (PMTiles or equivalent is fine). Do not depend on Google for the safety-critical path. Satellite is never required.

## 12. Vision contract

Purpose: stop obviously different photos collapsing into one bucket. Not: sound precise.

Reference objects are whatever is actually in the frame (curb, wheel, ankle and sandal, door sill). If none are usable, category is `unknown` even when water is obvious. Night, blur, screenshots, indoor frames, and frames that are mostly a face return `unknown` or are refused.

Store model proposal and human confirmation separately. Fusion uses the human category. Evaluation uses the gap. Golden set of Vietnamese street photos (motorbikes, alleys, bad light) gates any model change. Acceptance: no reference object means `unknown` on that set.

Server-side in the MVP because the reference phone cannot be assumed to run a heavy model, and a wrong confident answer is worse than a slow one. Timeout → client offers only `unknown` plus water-visible.

On-device: blur and EXIF strip. Server rejects uploads that skipped redaction when it can tell. Do not put the raw file on the public timeline.

No online learning during an incident.

## 13. Retrieval contract

No confirmed public API for NCHMF bulletins or VNDMS as of this draft. MVP retrieves public bulletin pages. Flash-flood and landslide pages only where fetch is permitted and stable. Do not scrape the private protocol of the official Thời tiết Việt Nam KTTV app. That app is a reference for what official mobile warning looks like, not a backend.

Pipeline:

1. Fetch URL.
2. Extract into `OfficialStatement`. Missing fields stay null.
3. If parse fails, `parse_status = failed`, show the link, no generated summary.
4. Staff pin (V1, and a manual JSON fixture is acceptable in the MVP if a live parse fails during the build) writes the same schema plus `pinned_by`.
5. Summaries and translations are generated only from the schema. A missing field is described as missing.
6. Original link is above the fold on S2.

Honest demo rule: if the live page cannot be retrieved, pin a real bulletin with its real URL and time. Do not invent a warning. Do not imply a feed you do not have.

## 14. Data sources

| Source | Role | Access as of this draft |
|---|---|---|
| NCHMF bulletins, nchmf.gov.vn | Authoritative text. Can set a floor. | Public pages. No public API found. Store the URL. |
| luquetsatlo.nchmf.gov.vn | Authoritative where obtained | Real-time flash-flood and landslide system. Some views appear to need login. Confirm before depending on it. |
| VNDMS, vndms.dmc.gov.vn | Authoritative observations | Public map: rain, rivers, reservoirs, storms. No open API assumed. |
| Thời tiết Việt Nam KTTV app | Not a dependency | Do not build on its private protocol. |
| Google Weather API | Optional context only | Preview. Vietnam alert coverage and NCHMF attribution not confirmed. Must not set the floor. |
| Google Flood Hub | Optional context only | Mekong and Vietnam appear in public views. Not a standing high-resolution inundation forecast for the Vietnamese delta, and not a tidal model. Never authoritative here. |
| Open-Meteo or equivalent | Rain context | Practical for MVP. Label as a model. |
| OpenStreetMap | Road graph | ODbL. Alleys incomplete. Attribute. Self-host the routing extract. |
| Copernicus DEM GLO-30 | Low-spot prior | Attribution. Not a water surface. V1. |
| FABDEM | Better prior, maybe | License may not allow this product. Do not ship until the license is read. |
| Handset GPS | Locate and snap | Sensitive personal data. While-in-use, consented. |
| Handset barometer or GNSS height | Do not use | Not a depth sensor. |
| Crowd photos | Raise risk only | Short-lived, human-confirmed, under the floor. |

“Authoritative” means it may set a floor. “Context” means it may only add penalty.

## 15. Privacy

Product requirements, not a legal opinion. Before any pilot with people outside the team, counsel confirms obligations under Decree 13/2023/ND-CP and the Law on Personal Data Protection (in force 1 January 2026). Treat location from location services as sensitive personal data.

- Separate consent for precise location and for photos. Purpose: show official warnings and attach a report to a road. Do not bundle “improve the service.”
- Fix at the moment of a report or a route question. Do not keep a track. Saved places are labels the person chose.
- Photos: target 7 days in V1, shorter if counsel says so, then keep category, segment, time, and trust only. User can delete sooner.
- Say at consent if a model host is outside Vietnam. Prefer a Vietnam-region photo store before a public pilot.
- No sale of location, no advertising use, no reporter directory.
- Accounts 16+. No child profile.
- S2 shows 113, 114, and 115, plus any hotline printed on the bulletin. Do not hardcode a guessed national disaster number. FloodScout does not dispatch.
- A hackathon demo uses seeded or team-captured photos, labeled as a demonstration, and does not quietly collect bystanders.
- A public pilot needs a named operator, a contact, and a way to unpublish.

## 16. MVP cut

**Place:** one district-scale slice of Da Nang, unless the team is physically elsewhere — then the slice moves and city-specific claims do not. Da Nang first because urban inundation and nearby flash-flood terrain both occur, the graph is more inspectable than HCMC, and a tide model is not required to tell the truth. Can Tho second, and only with an explicit tide decision. HCMC is the largest version of the user problem and the easiest place to be falsely precise. It waits.

**In:**

- S1–S6 and S8 (S7 can be a single typed destination; saved places are V1)
- F01–F06, F11–F14, F22–F29, F39–F45, F53–F58, F63–F69, F74–F76, F80
- One real NCHMF bulletin page, plus a pinned fixture if parsing fails
- OSM vector map of the slice
- Rain context labeled as a model
- Self-hosted penalized routing
- Vietnamese and English on that loop
- PWA shell, consent, copy lint

**Out of MVP:** accounts, push, tide, Zalo, fleets, turn-by-turn, a second city, on-device vision, barometer, green states, social features.

Nationwide coverage is not a phase. It would be a sequence of city reviews (F85).

### Acceptance tests

| ID | Pass condition |
|---|---|
| T01 | Network off after one successful fetch: launch shows the last warning with its time, or official-status-unavailable. Not a calm empty state. |
| T02 | Route, share, and notification copy contains none of the forbidden strings in §18, either language. The allowed negation sentence is the only exception. |
| T03 | Golden set: no usable reference object → `unknown`. |
| T04 | Cannot publish without an explicit category tap. Vision timeout still allows `unknown`. |
| T05 | A fresh no-water report inside an official warning does not change the floor and does not unlock a route. |
| T06 | When every candidate hits a hard block: refusal, bulletin instruction on screen, no polyline through the block. |
| T07 | Speed > 15 km/h replaces route detail and camera with the pull-over gate. |
| T08 | Killing the process mid-report keeps the draft. |
| T09 | At 360 CSS px and 130% font: no sideways scroll; primary action in the lower thumb zone. |
| T10 | Both languages complete the core loop. Default Vietnamese. |
| T11 | Every official statement on screen has issuer, time, and a link. |
| T12 | A report at 12 hours + 1 minute has routing weight 0. |
| T13 | Uploaded bytes are the redacted image, not the raw camera file. |
| T14 | Official warning layer has no off switch while a warning is in force. |

## 17. After MVP

**V1:** same rules, real users in the pilot city. Accounts, deletion, in-country photo storage, push on warning upgrades, moderation, kill switch, ingest console, offline district pack, city safety review before routing stays on.

**V2:** Can Tho only together with the tide decision. Return-trap, seasonal memory, grounded question box, Zalo cards that still cannot say safe.

**Partner rows** wait on a written agreement.

## 18. Copy deck

Requirements. A Vietnamese editor may adjust tone. Meaning may not. Forbidden strings are banned on route results, share cards, push, and empty states, including as substrings of cheerful sentences.

| Moment | Vietnamese | English |
|---|---|---|
| Calmest state | Chưa thấy dấu hiệu bất lợi gần đây. Đây không phải xác nhận an toàn. | No adverse evidence recently. This is not a clearance. |
| Refusal | FloodScout không gợi ý đường nào. Hãy ở lại và làm theo hướng dẫn chính thức. | FloodScout will not suggest a way. Stay, and follow the official instruction. |
| Warning in force | Cảnh báo chính thức đang có hiệu lực. Ảnh người dân không thể hạ mức này. | An official warning is in force. Crowd reports cannot lower it. |
| Feed down | Không lấy được tình trạng chính thức. Đừng coi map trống là hết cảnh báo. | Official status is unavailable. An empty map is not an all-clear. |
| Before the camera | Chỉ chụp từ chỗ khô ráo. Đừng đi vào nước để chụp. | Photograph only from dry ground. Do not enter the water to take a picture. |
| Moving | Dừng xe trước khi xem tiếp. | Pull over before continuing. |
| Model abstains | Không đủ căn cứ để ước lượng. Ghi là chưa rõ. | Not enough to estimate. Marked as unknown. |
| Unmapped roads | Chỉ dùng đường có trên bản đồ. Hẻm có thể không có trong gợi ý. | This only uses mapped roads. Alleys may be missing. |
| Share a refusal | Mình chưa đi. Cảnh báo hoặc đoạn đường chưa rõ vẫn còn. | I am not coming. A warning or an uncertain road still stands. |
| Ask CTA | Đi đường này? | Check a way there? |
| Emergency | 113 · 114 · 115. FloodScout không phải đơn vị cứu hộ. | 113 · 114 · 115. FloodScout is not a rescue service. |

**Forbidden on product surfaces:** safe, clear, passable, OK to cross, all clear, safe route, faster through, nên đi, đi được, an toàn, đường an toàn, and hết ngập used as a clearance. Also any green label that means go.

Exception: “an toàn” may appear only inside the negation “không phải xác nhận an toàn”. The test allows that sentence and fails the bare claim.

## 19. Rejected

Reopening one requires a written safety review naming which principle in §4 it breaks and how the break is contained. “Just for the demo” is not a container. A demo that says safe will be screenshotted.

| ID | Rejected | Why |
|---|---|---|
| R01 | Any safe, clear, or passable label | Read as permission, especially by someone paid to keep moving. |
| R02 | Centimeter depth or “X cm, you can pass” | The model cannot support it. A number looks more authoritative than a warning. |
| R03 | Barometer or handset altitude as depth or safety | Sensor error is larger than the decision. |
| R04 | Always-on tracking | Not needed. Sensitive. Easy to misuse. |
| R05 | Routing through an evacuation or do-not-travel area, including an “anyway” button, a faded polyline, or an ETA | Still a route. |
| R06 | “Someone nearby, please go check” | Sends people toward the water. |
| R07 | Points, ranks, bounties, photo contests | Rewards the behavior P6 forbids. |
| R08 | Public reporter identity or home | Turns a hazard report into a personal exposure. |
| R09 | A social flood feed | Optimizes for vivid images. |
| R10 | Selling or brokering location | Incompatible with the consent being asked for. |
| R11 | Desktop-first product or a separate desktop feature set | The decision is on a phone. An internal console is not the product. |
| R12 | Pretending to be the official warning or a rescue line | Link issuers. Show 113 / 114 / 115. Do not dispatch. |
| R13 | Turn-by-turn while riding | A crash hazard the product would be adding. |
| R14 | Online learning during a warning | A bad hour of photos must not retune the model before the next hour. |
| R15 | A route drawn above a hidden warning | If the warning is collapsed, minimized, or one tap deeper than the polyline, review fails. |
| R16 | Green as a go color on the calmest state | Green is read as permission even when the caption hedges. |

## 20. Risks

| Risk | How it shows up | Containment |
|---|---|---|
| Someone rides into water because the app seemed calm | Calmest state, missing layer, or stale photo read as permission | Four states, no green go, floor, decay, refusal, copy lint, warning that cannot be hidden |
| Used in motion | Result screen works at speed, or turn-by-turn | Speed gate. No riding navigation in any phase |
| Official source is wrong or late | We repeat a bad bulletin, or paper over a late one with photos | Cite it. Do not outrank it. We are not the correction mechanism for the state |
| Fake or thrill photos | Map becomes a dare | Dry-ground gate, no rewards, rate limits, blur, low weight, retract, moderation. No nearby-verify prompt |
| Alley missing from the map | Suggested road looks like the only road | Mandatory caveat. Do not claim full urban coverage |
| Tide city with a rain-only model | Can Tho or HCMC looks solved | Those cities stay out of routing until the tide decision is explicit |
| Demo becomes the story | A build says “safe route” once, on video | Forbidden strings fail the build. Seeded data is labeled. §4 applies to the demo |
| Personal data sprawl | Tracks and raw photos kept “for the model” | No tracks. Short photo life. No training during an incident. Named operator before a public pilot |

## 21. Build order for an agent

Do not start with the vision model. Start with the floor and the refusal.

1. PWA shell, Vietnamese/English switch, daylight tokens, 360 px layout, S1 status band with a fixture `OfficialStatement`.
2. Copy module that exports only the §18 strings, plus a lint test (T02).
3. Map of one district extract. Warning layer cannot be toggled off (T14).
4. Fusion function: fixtures in, `SegmentState` out. Unit-test T05 and T12 before any UI polish.
5. Self-hosted router with hard blocks. T06. No polyline on refusal.
6. Speed gate (T07) and offline last-warning (T01).
7. Report draft persistence (T08), on-device blur (T13), snap and confirm, category tap (T04).
8. Wire retrieval to one real bulletin URL. If parse fails, ship the pin fixture and show the real URL.
9. Vision last. Timeout path must already work.
10. Only then consider V1 rows.

### Config constants (starting values, not magic in components)

```
SPEED_GATE_KMH = 15
GPS_CONFIRM_ABOVE_M = 50
REPORT_HARD_ZERO_HOURS = 12
DECAY_HALFLIFE_RAIN_MIN = 45
DECAY_HALFLIFE_QUIET_MIN = 180
MAX_ROUTE_OPTIONS = 2
MOTOBIKE_ANKLE_SEGMENTS_ALLOWED = 0
PHOTO_MAX_BYTES = 500_000
```

### Vietnam-specific vs reusable

Vietnam-specific: NCHMF and VNDMS as the floor, báo động levels, motorbike as the default vehicle, hẻm and an incomplete alley graph, tide before any delta city, Zalo as the share target, Vietnamese first, mid-range Android as the reference, personal-data rules in §15.

Reusable, and not to be weakened for a second country: four states, floor that photos cannot lower, three vision categories, decay, refusal as a result, speed gate, copy lint, degrade-by-refusing. A port replaces the authoritative feed and the vehicle default. It does not replace §4.

## 22. Open questions

- Can luquetsatlo and VNDMS be retrieved stably and lawfully, or is the MVP a bulletin page plus a pin? Build the pin either way.
- Who operates a pilot beyond the team, and which Vietnam-region host stores photos?
- Can snapped report locations be shown at full precision, or must public markers be coarsened to the segment while fusion still uses the segment id? Default until counsel says otherwise: public map shows the segment, not a rooftop-accurate dot.
- Which router can the team actually penalize in a weekend?
- Is there a real fleet or ward partner, or do Partner rows stay on paper?
- Which single Da Nang district has both a readable warning history and a graph someone can inspect by eye? Pick it before drawing polygons.

## 23. Sources checked 10 November 2026

Re-verify before wiring a feed.

- NCHMF bulletins on [nchmf.gov.vn](https://nchmf.gov.vn), and the flash-flood and landslide system at [luquetsatlo.nchmf.gov.vn](https://luquetsatlo.nchmf.gov.vn).
- VNDMS, [vndms.dmc.gov.vn](https://vndms.dmc.gov.vn).
- World Bank [P152851](https://projects.worldbank.org/en/projects-operations/project-detail/P152851) (Can Tho Urban Development and Resilience) and [P123384](https://projects.worldbank.org/en/projects-operations/project-detail/P123384) (Da Nang Sustainable City Development).
- [Google Weather API](https://developers.google.com/maps/documentation/weather) (preview). Vietnam public-alert coverage and any NCHMF attribution were not established.
- [Google Flood Hub](https://sites.research.google/floodforecasting/). Riverine, not tidal, and not a substitute for NCHMF.
- Decree 13/2023/ND-CP and the Law on Personal Data Protection effective 1 January 2026. Product implications only.

A build matches this document only if a reviewer can point at a screen and fail it for calling a road safe, hiding a warning, or asking someone to move closer to the water.