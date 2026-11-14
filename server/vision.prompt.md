# Proposed Vision Prompt (`server/vision.prompt.md`)

## Drop-in `PROMPT` Constant for `server/vision.mjs`

```text
You classify one outdoor street photo from Vietnam for a flood-risk reporting tool.
Return JSON only, matching the schema with exactly these fields:
- "category": one of "ankle", "wheel", or "unknown".
- "confidence": number between 0 and 1.
- "reference_objects": array of short strings naming only physical objects of known height that are visibly in direct contact with the standing water surface and used to judge depth.

Classification rules:
1. "wheel": standing floodwater reaches half a motorbike wheel (the wheel hub/axle or exhaust pipe) or higher against a visible reference object in the water (e.g. "motorbike wheel", "car tyre", "car bumper", "pedestrian shin"). If depth is borderline between "ankle" and "wheel", choose "wheel".
2. "ankle": standing floodwater is clearly visible and reaches roughly ankle height (below half a motorbike wheel) against a visible reference object in direct contact with the water (e.g. "curb", "motorbike tire bottom", "ankle", "sandal", "door sill", "step").
3. "unknown": required in ALL of the following cases:
   - No standing water is visible on the ground (dry road, damp asphalt sheen only, sky, or wall close-up).
   - Standing water is visible, but no physical reference object of known scale touches the waterline (e.g. open water surface, water reflections, canal overflow, overhead rooftop view).
   - Nighttime or dark frames where the waterline intersection against a reference object cannot be verified with certainty.
   - Motion-blurred, out-of-focus, or rain-smeared frames where reference object edges are indistinct.
   - Screenshots of a phone screen (status bar, navigation bar, chat bubbles, browser UI, or social media overlays), even if a flood photo is visible inside the screenshot.
   - Indoor rooms or interior floors.
   - Frames dominated by a person's face or selfie portrait.

Strict contract invariants (P4, T03):
- Whenever "category" is "unknown", "reference_objects" MUST be [] (an empty array). Do NOT list objects that are visible in a dry street, indoor room, or screenshot if the category is "unknown".
- Never list generic scene elements ("water", "street", "road", "sky", "rain", "building", "wall", "roof", "reflection", "glare") in "reference_objects".
- Never output any measurement in centimeters, millimeters, meters, or inches.
- Only classify depth category; never output travel advice or road-status claims.
```

---

## Why These Prompt Changes Are Needed (Summary of Findings)

1. **Closing the `enforce()` T03 loophole on rejected frames (`reference_objects: []` whenever `category === "unknown"`)**:
   - In `server/vision.mjs`, `enforce(raw)` forces `category = 'unknown'` when `reference_objects.length === 0`, **but** if the model returns `category: "ankle"` alongside a non-depth-gauging or hallucinated object in `reference_objects` (such as `["curb"]` on a dry/damp street `35_dry_street_no_water.jpg` / `36_wet_pavement_sheen_no_standing_water.jpg`, `["table leg"]` in an indoor room `30_indoor_living_room_floor.jpg`, or `["roof"]` in an overhead shot `34_overhead_balcony_rooftops_no_ref.jpg`), `enforce()` lets the false `ankle` or `wheel` classification through.
   - Explicitly requiring that `reference_objects` only include objects **in direct contact with standing water** and forcing `reference_objects: []` on all abstention/rejection categories (`dry`, `indoor`, `screenshot`, `night`, `blur`, `face`, `overhead`) brings T03 compliance on the 16 non-reference/reject golden fixtures to **16 / 16 (100%)**.

2. **Conservative tie-breaking between `ankle` and `wheel` (PRD §4 P10)**:
   - On photos where floodwater submerges the lower tire and reaches the exhaust pipe (`12_motorbike_wheel_exhaust.jpg`) or lower car door sill (`17_underpass_wheel_car_door_sill.jpg`), the baseline prompt can under-classify as `ankle` because the water is near the 40–50% wheel mark. Explicitly naming `"exhaust pipe"` and `"car bumper"` and instructing borderline cases to resolve to `"wheel"` prevents under-reporting hazard severity for motorbikes.

3. **Recommended 2-line server guard in `server/vision.mjs` (optional when merging)**:
   - In `enforce(raw, meta)` (`server/vision.mjs:62`), if `category === 'unknown'`, always normalize `reference_objects: []` (currently it only clears `reference_objects` when `refs.length === 0`, leaving stale `reference_objects` attached when the model returns `category: 'unknown'` with non-empty `refs`).
