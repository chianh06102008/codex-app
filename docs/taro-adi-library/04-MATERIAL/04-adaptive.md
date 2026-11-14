---
id: ADI-04-MATERIAL-04_ADAPTIVE
title: "Material Design 3 — adaptive layouts and inputs"
pack: 04-MATERIAL
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [material, adaptive]
---

# Material Design 3 — adaptive layouts and inputs

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Apply when a responsive Android, tablet, foldable or web-based Material product needs adaptive arrangements.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-04-MATERIAL-04_ADAPTIVE-01` | Choose layout structure from available window dimensions rather than screen-product labels. | Implementation review + scenario check |
| `ADI-04-MATERIAL-04_ADAPTIVE-02` | Consider one-pane, list-detail and supporting-pane structures as task-dependent alternatives. | Implementation review + scenario check |
| `ADI-04-MATERIAL-04_ADAPTIVE-03` | Maintain coherent navigation hierarchy as a rail becomes a bottom navigation pattern or the reverse. | Visual review + interaction check |
| `ADI-04-MATERIAL-04_ADAPTIVE-04` | Do not drop features at smaller widths; adapt their presentation and access path. | Implementation review + scenario check |
| `ADI-04-MATERIAL-04_ADAPTIVE-05` | Ensure posture, orientation changes, software keyboard, and text scaling do not obstruct content. | Implementation review + scenario check |
| `ADI-04-MATERIAL-04_ADAPTIVE-06` | Support touch and keyboard/pointer where available without hidden-only interactions. | Visual review + interaction check |
| `ADI-04-MATERIAL-04_ADAPTIVE-07` | Prevent overlays and snackbars from covering the sole path to recovery. | Implementation review + scenario check |
| `ADI-04-MATERIAL-04_ADAPTIVE-08` | Validate content reflow with long strings and right-to-left layouts. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Tablet layout simply stretches phone cards
- Primary actions disappear when rail changes
- Fixed viewport-height forms clipped by keyboard
- Rail labels too small when accessibility text grows

## Acceptance checklist

- [ ] Small and large viewports tested
- [ ] Feature parity across layouts
- [ ] Keyboard and touch interaction verified
- [ ] RTL and localization stress cases completed

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://m3.material.io/foundations/layout/overview
- https://developer.android.com/develop/ui/compose/designsystems/material3

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
