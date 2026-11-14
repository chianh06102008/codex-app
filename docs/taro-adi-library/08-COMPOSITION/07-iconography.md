---
id: ADI-08-COMPOSITION-07_ICONOGRAPHY
title: "Iconography and control language"
pack: 08-COMPOSITION
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [icons, controls]
---

# Iconography and control language

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for clarity in toolbars, navigation and dense data views. Reject random generative or stylistically mixed icons.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-08-COMPOSITION-07_ICONOGRAPHY-01` | Choose one icon family or a justified, tightly bounded combination. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-07_ICONOGRAPHY-02` | Prefer known metaphors; pair ambiguous symbols with text. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-07_ICONOGRAPHY-03` | Match stroke weight, bounding box, optical size and alignment. | Visual review + interaction check |
| `ADI-08-COMPOSITION-07_ICONOGRAPHY-04` | Do not treat icons as mandatory adornments for every heading. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-07_ICONOGRAPHY-05` | Provide accessible names for icon-only controls. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-07_ICONOGRAPHY-06` | Use text for complex domain concepts that have no shared visual metaphor. | Visual review + interaction check |
| `ADI-08-COMPOSITION-07_ICONOGRAPHY-07` | Avoid invented glowing/sparkle/robot symbols for generic AI actions. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Three icon packs in one sidebar
- Mystery icons only recognizable after clicking
- Icon added to every menu item without purpose

## Acceptance checklist

- [ ] Icon semantics understandable
- [ ] One visual family adopted
- [ ] Icon-only actions have accessible names

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://developer.apple.com/design/human-interface-guidelines/
- https://fluent2.microsoft.design/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
