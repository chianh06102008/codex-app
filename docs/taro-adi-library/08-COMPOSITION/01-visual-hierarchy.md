---
id: ADI-08-COMPOSITION-01_VISUAL_HIERARCHY
title: "Visual hierarchy — attention ordering"
pack: 08-COMPOSITION
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [composition, hierarchy]
---

# Visual hierarchy — attention ordering

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Prioritize content by task and consequence, not by decoration or a generic hero-section template.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-08-COMPOSITION-01_VISUAL_HIERARCHY-01` | Write a one-sentence objective for the screen. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-01_VISUAL_HIERARCHY-02` | Identify its primary action, most important context and next secondary action. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-01_VISUAL_HIERARCHY-03` | Use scale, placement, weight, contrast and grouping to establish a reading path. | Visual review + interaction check |
| `ADI-08-COMPOSITION-01_VISUAL_HIERARCHY-04` | Avoid making status badges as visually loud as primary actions. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-01_VISUAL_HIERARCHY-05` | Promote information required to make a decision, not simply the largest number. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-01_VISUAL_HIERARCHY-06` | Test first-glance comprehension without relying on an explanation by the designer. | Visual review + interaction check |
| `ADI-08-COMPOSITION-01_VISUAL_HIERARCHY-07` | Preserve hierarchy when content is localized or zoomed. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Every card competes with the page title
- Primary CTA visually identical to tertiary actions
- Decorative gradient takes more attention than the decision

## Acceptance checklist

- [ ] Most important task identifiable quickly
- [ ] Only one dominant visual entry point per decision group
- [ ] Hierarchy works in narrow view

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://developer.apple.com/design/human-interface-guidelines/design-principles/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
