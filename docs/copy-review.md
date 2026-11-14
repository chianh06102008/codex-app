# Vietnamese copy review (PRD §18) — map, routing, report

Scope: `src/copy/mapReport.ts`. The §18 sentences stay as written, except for one approved tone change ("map" → "bản đồ"). The forbidden-copy test (T02) passes after these edits.

| Key | Before | After | Why |
|---|---|---|---|
| feedDown | …Đừng coi **map** trống là hết cảnh báo. | …Đừng coi **bản đồ** trống là hết cảnh báo. | "map" is English slang; §18 allows tone edits that keep the meaning. Matches the Home band. |
| resultRoute | Có lựa chọn tránh các đoạn FloodScout không tin. | Có lựa chọn tránh được các đoạn đường đáng ngờ. | Reads naturally; doesn't personify the app. Still not a clearance (the calmest sentence follows). |
| floor | Mức sàn chính thức | Cảnh báo chính thức áp dụng | "Mức sàn" is PRD jargon; ordinary readers like Mai won't get it. |
| cat_ankle | Mắt cá chân | Ngang mắt cá chân | Describes water height, not a body part. |
| weight | Độ mới | Độ mới của báo cáo | Unclear on its own next to a progress bar. |
| humanSaid | Người báo xác nhận | Người gửi chọn | "Xác nhận" sounds like verification; the person only picked a category. |
| fact_feed_unavailable | Không có tình trạng chính thức… | Chưa lấy được tình trạng chính thức… | "Không có" can read as "there is no warning". "Chưa lấy được" says we couldn't fetch it (P2). |
| redacted | Đã xoá dữ liệu EXIF… | Đã xoá thông tin vị trí, thiết bị trong ảnh… | "EXIF" is technical; say what was removed. |
| waterVisible | Có thấy nước trong ảnh | Ảnh có thấy nước | Shorter, so it fits beside the switch at 360 px. |
| modelMock | Đề xuất mẫu, không phải AI thật. | Đề xuất mẫu để demo, không phải AI thật. | Makes the demo-only nature explicit. |

**Checked and kept:** the state labels (§8), refusal, warning in force, unmapped, moving, model abstains, before camera, emergency, and the CTA "Đi đường này?" / "Kiểm tra đường". "Không nên đi" contains "nên đi", but only as a negation, and the copy test allows that exact phrase.

**Length at 360 px / 130% text:** the longest button labels are "Rút lại báo cáo của tôi" and "Chia sẻ: mình chưa đi", which fit on one line in a full-width button. Category tiles wrap to two lines by design.
