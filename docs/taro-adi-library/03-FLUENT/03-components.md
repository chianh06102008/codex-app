---
id: ADI-03-FLUENT-03_COMPONENTS
title: "Microsoft Fluent 2 — component selection"
pack: 03-FLUENT
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [fluent, components]
---

# Microsoft Fluent 2 — component selection

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use Fluent components as a coherent family for menus, buttons, forms, dialogs, lists, tables, status and layered surfaces.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-03-FLUENT-03_COMPONENTS-01` | Select components based on user intent before matching the appearance in a screenshot. | Implementation review + scenario check |
| `ADI-03-FLUENT-03_COMPONENTS-02` | Use one primary action per local decision cluster and secondary treatments for alternatives. | Implementation review + scenario check |
| `ADI-03-FLUENT-03_COMPONENTS-03` | Keep command bars, split buttons and overflow menus consistent in action grouping. | Visual review + interaction check |
| `ADI-03-FLUENT-03_COMPONENTS-04` | Use a dialog for a focused decision; prefer a side panel for information users must compare with the background. | Implementation review + scenario check |
| `ADI-03-FLUENT-03_COMPONENTS-05` | For data tables, make sort, selection, keyboard focus and empty states explicit. | Implementation review + scenario check |
| `ADI-03-FLUENT-03_COMPONENTS-06` | When a form is invalid, connect field-level error text to the relevant field. | Visual review + interaction check |
| `ADI-03-FLUENT-03_COMPONENTS-07` | Use badges for bounded status information, not as decoration on ordinary headings. | Implementation review + scenario check |
| `ADI-03-FLUENT-03_COMPONENTS-08` | Ensure disabled-state affordances do not hide the reason when users need it. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Action bars with all actions styled primary
- Tooltips carrying essential information
- Modal dialogs for passive reference
- Inconsistent keyboard interaction across similar rows

## Acceptance checklist

- [ ] Component role justified
- [ ] Selected/hover/focus states visible
- [ ] Dialogs close and restore focus
- [ ] Tables maintain keyboard usability

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://fluent2.microsoft.design/components
- https://react.fluentui.dev/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
