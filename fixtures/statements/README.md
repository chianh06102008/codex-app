# Official statement fixtures

Real NCHMF bulletins pinned by hand (PRD §13, honest demo rule). Never invent or edit a warning here. Every value must be traceable to the source below.

## 2026-11-13_lqsl-984.json

- Web page: https://www.nchmf.gov.vn/kttv/vi-VN/1/tin-canh-bao-lu-quet-sat-lo-dat-sut-lun-dat-do-mua-lu-hoac-dong-chay-tren-khu-vuc-cac-tinh-thanh-pho-da-nang-va-quang-ngai-post55215.html
- Full bulletin (PDF): https://kttv.gov.vn//upload/thuyvan2/2026/11/13/dbqg_lqsl_20261113_2320.pdf
- Bulletin number: `LQSL_984/23h20/DBQG`, "Hà Nội, ngày 13 tháng 11 năm 2026", "Tin phát lúc: 23h20".
- Retrieved: 2026-11-14 14:01 (+07:00).

How each field was filled:

| Field | Source |
|---|---|
| `issuer` | PDF header: "Trung tâm Dự báo khí tượng thủy văn quốc gia" |
| `valid_from` | PDF issue time, 23h20 on 13/11/2026 |
| `valid_until` | valid_from + 6 hours, from "Trong 06 giờ tới". No end time is printed. |
| `area_names` | PDF section 3, every name, prefixed with the province/city it is listed under |
| `instruction_text` | PDF sections 3–5, verbatim |
| `severity` | PDF section 4: "Cấp 1" |
| `hazard_type` | `flash_flood`. The bulletin also covers landslide and subsidence, but the schema allows one value. |
| `do_not_travel` | `false`. The bulletin contains no instruction to stay home or evacuate. |
| `geometry` | `null`. Only names were published. The risk map is at luquetsatlo.nchmf.gov.vn. |
| `instruction_text_en` | `null`. No translation has been generated yet. |

Not copied into the schema: section 1 (rain observed in the past 6 hours) and section 2 (rain forecast for the next 6 hours: "phổ biến từ 20-40mm, có nơi trên 80mm"). Both are in the PDF.

This bulletin expired at 05:20 on 14/11/2026. Code should show it as expired once past `valid_until`, not as in force.
