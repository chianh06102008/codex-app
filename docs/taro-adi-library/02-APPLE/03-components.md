---
id: ADI-02-APPLE-03_COMPONENTS
title: "Apple HIG — components"
pack: 02-APPLE
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [apple, components]
---

# Apple HIG — components

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Choose standard components with consistent semantics. This chapter is a selection framework, not a verbatim inventory of Apple components.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-02-APPLE-03_COMPONENTS-01` | Use a button for an immediate action and a link for navigation; do not use a clickable text span without semantics. | Implementation review + scenario check |
| `ADI-02-APPLE-03_COMPONENTS-02` | Prefer action sheets/menus for contextual choices and a dialog only for consequential interruption. | Implementation review + scenario check |
| `ADI-02-APPLE-03_COMPONENTS-03` | Allow cancellation and escape from noncommittal overlays; destructive actions require intelligible labels. | Visual review + interaction check |
| `ADI-02-APPLE-03_COMPONENTS-04` | Use tabs for stable sibling destinations and segmented controls for local content alternatives. | Implementation review + scenario check |
| `ADI-02-APPLE-03_COMPONENTS-05` | Use searchable selectors for long option lists; avoid forcing users to scroll arbitrary popup inventories. | Implementation review + scenario check |
| `ADI-02-APPLE-03_COMPONENTS-06` | For notifications, state what happened and what action remains; do not interrupt for low-priority progress. | Visual review + interaction check |
| `ADI-02-APPLE-03_COMPONENTS-07` | Keep controls consistent in hit area, padding, icon alignment, and state feedback within the same view. | Implementation review + scenario check |
| `ADI-02-APPLE-03_COMPONENTS-08` | Honor full control lifecycles: focus, selected, hover where applicable, loading, disabled and errors. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Using dialogs for routine hints
- Icons without accessible names
- Tiny menu hit areas
- Mixing three visual button languages on one page

## Acceptance checklist

- [ ] Every control has an explicit task purpose
- [ ] Each overlay has close/cancel path
- [ ] Every component state is represented
- [ ] Controls remain identifiable with labels hidden by localization truncation

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://developer.apple.com/design/human-interface-guidelines/components
- https://developer.apple.com/design/human-interface-guidelines/patterns

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
