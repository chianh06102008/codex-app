---
id: ADI-08-COMPOSITION-05_COLOR
title: "Color, semantics and contrast"
pack: 08-COMPOSITION
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [color, contrast]
---

# Color, semantics and contrast

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for theme systems and data/status encoding independent of publisher aesthetics.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-08-COMPOSITION-05_COLOR-01` | Assign semantic roles before selecting a palette. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-05_COLOR-02` | Use text, shape, icon and position as redundancy for important colored states. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-05_COLOR-03` | Keep accent color reserved for deliberate emphasis. | Visual review + interaction check |
| `ADI-08-COMPOSITION-05_COLOR-04` | Test colors in light, dark and increased-contrast themes. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-05_COLOR-05` | Check interactive, disabled, selected, visited and error states separately. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-05_COLOR-06` | Review data-viz palettes for categorical discrimination and ordered magnitude. | Visual review + interaction check |
| `ADI-08-COMPOSITION-05_COLOR-07` | Avoid using visual noise as a substitute for hierarchy. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- All labels use the brand color
- Success/error conveyed only by red/green
- Background texture harms readability

## Acceptance checklist

- [ ] Semantic tokens exist
- [ ] Color-only meaning avoided
- [ ] Contrast checked using current applicable accessibility requirements

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://developer.apple.com/design/human-interface-guidelines/color
- https://www.w3.org/TR/WCAG22/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
