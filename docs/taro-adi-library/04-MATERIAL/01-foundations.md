---
id: ADI-04-MATERIAL-01_FOUNDATIONS
title: "Material Design 3 — foundations"
pack: 04-MATERIAL
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [material, foundations]
---

# Material Design 3 — foundations

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for Android-centric experiences, adaptive apps, and interfaces whose visual grammar is deliberately Material 3. Do not impose the style on unrelated Apple or enterprise experiences.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-04-MATERIAL-01_FOUNDATIONS-01` | Express the theme through semantic color roles, typography roles and shape roles. | Implementation review + scenario check |
| `ADI-04-MATERIAL-01_FOUNDATIONS-02` | Define surface/background treatments separate from action accent treatments. | Implementation review + scenario check |
| `ADI-04-MATERIAL-01_FOUNDATIONS-03` | Use tonal hierarchy to distinguish surfaces without depending exclusively on heavy shadow. | Visual review + interaction check |
| `ADI-04-MATERIAL-01_FOUNDATIONS-04` | Ensure dynamic color variants do not obscure success, error or selection meaning. | Implementation review + scenario check |
| `ADI-04-MATERIAL-01_FOUNDATIONS-05` | Use typography hierarchy to mark screen title, section title, supporting content and labels. | Implementation review + scenario check |
| `ADI-04-MATERIAL-01_FOUNDATIONS-06` | Build components from consistent shape scale instead of unrelated radii. | Visual review + interaction check |
| `ADI-04-MATERIAL-01_FOUNDATIONS-07` | Coordinate motion, elevation and state treatment so changes signal one coherent interaction model. | Implementation review + scenario check |
| `ADI-04-MATERIAL-01_FOUNDATIONS-08` | Test both compact and expanded widths and avoid assuming one phone aspect ratio. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Overbranding every surface
- Every card rounded differently
- A static single-color theme called dynamic color
- Motion used without purpose

## Acceptance checklist

- [ ] Theme roles defined
- [ ] Major surface relationships are clear
- [ ] Text scales without clipping
- [ ] Compact and expanded layouts reviewed

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://m3.material.io/
- https://developer.android.com/develop/ui/compose/designsystems/material3

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
