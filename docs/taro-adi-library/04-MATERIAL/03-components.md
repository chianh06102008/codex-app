---
id: ADI-04-MATERIAL-03_COMPONENTS
title: "Material Design 3 — components"
pack: 04-MATERIAL
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [material, components]
---

# Material Design 3 — components

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Choose functional component classes for action, selection, navigation, input and feedback. Some widgets and defaults differ by library and release.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-04-MATERIAL-03_COMPONENTS-01` | Assign emphasis to actions based on frequency and consequence, not aesthetic variety. | Implementation review + scenario check |
| `ADI-04-MATERIAL-03_COMPONENTS-02` | Use bottom or side navigation for stable top-level destinations depending on layout conditions. | Implementation review + scenario check |
| `ADI-04-MATERIAL-03_COMPONENTS-03` | Use chips for short selections/filters, not long explanations. | Visual review + interaction check |
| `ADI-04-MATERIAL-03_COMPONENTS-04` | Choose a modal only when the user must resolve it before proceeding. | Implementation review + scenario check |
| `ADI-04-MATERIAL-03_COMPONENTS-05` | Provide a clear selected treatment and keyboard accessibility for tabs and segments. | Implementation review + scenario check |
| `ADI-04-MATERIAL-03_COMPONENTS-06` | Keep transient status messages concise and supplement critical errors with durable information. | Visual review + interaction check |
| `ADI-04-MATERIAL-03_COMPONENTS-07` | Use input decorations such as labels/help/error messages without sacrificing content legibility. | Implementation review + scenario check |
| `ADI-04-MATERIAL-03_COMPONENTS-08` | Test the current implementation component API rather than copying older Material 2 examples. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Floating action button for low-priority bulk operations
- Bottom navigation with dozens of destinations
- Snackbars for permanent validation errors
- Material 2 behavior unintentionally mixed into M3

## Acceptance checklist

- [ ] Component hierarchy matches task priority
- [ ] Navigation structure fits number of destinations
- [ ] Forms have full error states
- [ ] Component API verified against current release

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://m3.material.io/components
- https://developer.android.com/develop/ui/compose/designsystems/material3

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
