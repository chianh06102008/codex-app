# Golden Photo Set — Sources & Licensing (`fixtures/golden/`)

## License & Provenance Summary

All **36 JPEG files** (`01_alley_ankle_sandal.jpg` through `36_wet_pavement_sheen_no_standing_water.jpg`) stored in `fixtures/golden/` are **first-party synthetic evaluation fixtures** created specifically for the FloodScout VN repository and released under **CC0 1.0 Universal (Public Domain Dedication)**.

Per PRD §15 ("A hackathon demo uses seeded or team-captured photos, labeled as a demonstration, and does not quietly collect bystanders"), committing deterministic, bystander-free synthetic fixtures ensures:
1. Zero personally identifiable faces or vehicle license plates of real bystanders in the git repository.
2. Deterministic geometry for waterline-to-reference-object intersection (`ankle` vs `wheel` vs `unknown`) and explicit negative test cases for **T03** (no usable reference object, night glare, motion blur, phone screenshots, indoor rooms, close-up faces, and dry pavement).

## Provenance note

These are **synthetic, hand-drawn-style images** generated for this repo (no real people, plates or places). An earlier draft cited Wikimedia Commons photos as composition references; those links did not resolve and were removed. Use this set as a **smoke test** of the contract (categories, `unknown` abstention). It is **not** a substitute for the PRD §12 golden set of real Vietnamese street photos.

## File Manifest (`fixtures/golden/`)

| File | Expected | Condition / Reference Object | License |
|---|---|---|---|
| `01_alley_ankle_sandal.jpg` | `ankle` | Narrow alley; pedestrian sandal & ankle in water | CC0 1.0 (First-party fixture) |
| `02_street_ankle_curb.jpg` | `ankle` | Street sidewalk curb edge at waterline | CC0 1.0 (First-party fixture) |
| `03_motorbike_ankle_tire_rim.jpg` | `ankle` | Motorbike lower tire sidewall / bottom rim | CC0 1.0 (First-party fixture) |
| `04_shopfront_ankle_doorsill.jpg` | `ankle` | Shopfront door sill & pedestrian ankle | CC0 1.0 (First-party fixture) |
| `05_crosswalk_ankle_pedestrian.jpg` | `ankle` | Pedestrian ankle/sandal & parked motorbike tire bottom | CC0 1.0 (First-party fixture) |
| `06_alley_ankle_step_stone.jpg` | `ankle` | Alley entry step stone & motorbike lower tire rim | CC0 1.0 (First-party fixture) |
| `07_market_ankle_plastic_stool.jpg` | `ankle` | Low plastic stool feet & motorbike lower tire rim | CC0 1.0 (First-party fixture) |
| `08_overcast_ankle_car_tyre_bottom.jpg` | `ankle` | Parked car lower tyre sidewall & curb base | CC0 1.0 (First-party fixture) |
| `09_rain_ankle_motorbike_kickstand.jpg` | `ankle` | Motorbike kickstand foot & bottom tire rim in rain | CC0 1.0 (First-party fixture) |
| `10_dusk_ankle_curb_drain.jpg` | `ankle` | Dusk street curb edge & lower motorbike tire rim | CC0 1.0 (First-party fixture) |
| `11_motorbike_wheel_half_hub.jpg` | `wheel` | Water at half motorbike wheel (axle hub) | CC0 1.0 (First-party fixture) |
| `12_motorbike_wheel_exhaust.jpg` | `wheel` | Water submerging motorbike exhaust pipe & wheel hub | CC0 1.0 (First-party fixture) |
| `13_alley_wheel_motorbike_fender.jpg` | `wheel` | Alley water above half-wheel toward front fender | CC0 1.0 (First-party fixture) |
| `14_street_wheel_car_bumper.jpg` | `wheel` | Water at half car tyre / lower bumper & motorbike hub | CC0 1.0 (First-party fixture) |
| `15_shopfront_wheel_shutter_knee.jpg` | `wheel` | Water above motorbike wheel hub & pedestrian mid-shin | CC0 1.0 (First-party fixture) |
| `16_intersection_wheel_two_bikes.jpg` | `wheel` | Two motorbikes with water above wheel hubs | CC0 1.0 (First-party fixture) |
| `17_underpass_wheel_car_door_sill.jpg` | `wheel` | Water at car door sill & above half scooter wheel | CC0 1.0 (First-party fixture) |
| `18_rain_wheel_delivery_bike.jpg` | `wheel` | Delivery motorbike in rain with water at wheel hub | CC0 1.0 (First-party fixture) |
| `19_alley_wheel_pedestrian_shin.jpg` | `wheel` | Alley motorbike wheel hub & pedestrian shin | CC0 1.0 (First-party fixture) |
| `20_street_wheel_submerged_curb_bike.jpg` | `wheel` | Curb submerged; motorbike wheel water above hub | CC0 1.0 (First-party fixture) |
| `21_open_water_no_ref.jpg` | `unknown` | No reference object (muddy water surface only) | CC0 1.0 (First-party fixture) |
| `22_water_reflection_no_ref.jpg` | `unknown` | No reference object (close-up water reflection) | CC0 1.0 (First-party fixture) |
| `23_wide_canal_overflow_no_ref.jpg` | `unknown` | No reference object (wide water sheet + sky only) | CC0 1.0 (First-party fixture) |
| `24_night_dark_unlit_water.jpg` | `unknown` | Night / dark unlit water with glare; no reference object | CC0 1.0 (First-party fixture) |
| `25_night_glare_alley_no_ref.jpg` | `unknown` | Night glare in alley; no discernible reference object | CC0 1.0 (First-party fixture) |
| `26_motion_blur_rain_streak.jpg` | `unknown` | Heavy motion blur & rain streaks; no sharp reference | CC0 1.0 (First-party fixture) |
| `27_out_of_focus_water_blur.jpg` | `unknown` | Severely defocused / fogged lens water frame | CC0 1.0 (First-party fixture) |
| `28_screenshot_zalo_chat.jpg` | `unknown` | Mobile chat screenshot with UI status/navigation bars | CC0 1.0 (First-party fixture) |
| `29_screenshot_news_social.jpg` | `unknown` | Mobile social/browser screenshot with UI chrome | CC0 1.0 (First-party fixture) |
| `30_indoor_living_room_floor.jpg` | `unknown` | Indoor room with ceramic tile floor & table | CC0 1.0 (First-party fixture) |
| `31_mostly_face_selfie.jpg` | `unknown` | Portrait/selfie where a face fills most of the frame | CC0 1.0 (First-party fixture) |
| `32_sky_treetops_rain_no_ref.jpg` | `unknown` | Camera aimed upward at storm sky & power lines | CC0 1.0 (First-party fixture) |
| `33_wall_closeup_wet_paint.jpg` | `unknown` | Close-up of concrete wall texture; no ground/waterline | CC0 1.0 (First-party fixture) |
| `34_overhead_balcony_rooftops_no_ref.jpg` | `unknown` | High-angle rooftops & water strip without scale reference | CC0 1.0 (First-party fixture) |
| `35_dry_street_no_water.jpg` | `unknown` | Dry asphalt street with motorbike; no standing water | CC0 1.0 (First-party fixture) |
| `36_wet_pavement_sheen_no_standing_water.jpg` | `unknown` | Damp road sheen after rain; zero standing water depth | CC0 1.0 (First-party fixture) |
