# Review-mode comment contract

A review comment is an **actionable, source-labeled UI defect report**, not a generic aesthetic critique. These instructions should be implemented in Taro's runtime; the reference ZIP cannot activate Review mode on its own.

## Required fields

```json
{
  "review_id": "example-review-001",
  "target": {"file": "src/components/SessionCard.tsx", "line_start": 54, "line_end": 64},
  "surface": {"route": "/sessions", "viewport": "1366x768", "element": "session-row-open"},
  "severity": "major",
  "status": "open",
  "rule_ids": ["ADI-08-COMPOSITION-03_SPACING_DENSITY-03"],
  "finding": "Rows truncate the last action at narrow widths",
  "impact": "User cannot open overflow actions without resizing the window",
  "proposed_change": "Move secondary actions into a keyboard-accessible overflow menu at this breakpoint",
  "evidence": {"type": "screenshot-and-dom", "artifact": "attach-actual-evidence-here"},
  "verification": {"step": "resize to 720px; keyboard activate menu", "expected": "all actions reachable", "result": "not-run"}
}
```

## Comment lifecycle

`new` → `triaged` → `accepted` / `rejected-with-reason` → `fix-in-progress` → `resolved` → `verified`.

- An agent must not silently dismiss a user comment because it differs from a publisher convention.
- If a comment is aesthetic-only, label as **suggestion** and show an alternative rather than blocking.
- If a comment relies on an ISO standard, clarify that any rule here is an independent heuristic and cannot certify conformity.
- A `resolved` comment requires changed code; a `verified` comment requires an actual retest.
- Preserve target mapping when code lines move; fall back to component/element ID if line anchor is stale.

## Example human-readable comment

**Major · Session history row · 720px** — The menu button moves outside the visible card boundary when the title wraps to two lines. This blocks one path to a session action. Use the row's flex minimum sizing and a fixed-size trailing action container, then check keyboard activation and long titles. **Status:** open; **Validation:** not run.
