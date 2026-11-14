---
id: ADI-02-APPLE-02_FOUNDATIONS
title: "Apple HIG — foundations"
pack: 02-APPLE
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [apple, foundations]
---

# Apple HIG — foundations

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for typography, semantic color, materials, layout, accessibility, and app-level brand decisions for an Apple experience.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-02-APPLE-02_FOUNDATIONS-01` | Use semantic foreground/background colors that adapt to light and dark appearances instead of freezing UI colors. | Implementation review + scenario check |
| `ADI-02-APPLE-02_FOUNDATIONS-02` | Make text hierarchy obvious using role, weight, size, spacing, and content structure—not color alone. | Implementation review + scenario check |
| `ADI-02-APPLE-02_FOUNDATIONS-03` | Build from the current platform typography API and allow user-scaled text; never lock essential labels into fixed-height containers. | Visual review + interaction check |
| `ADI-02-APPLE-02_FOUNDATIONS-04` | Keep primary actions visually distinct and avoid saturating every control with the accent color. | Implementation review + scenario check |
| `ADI-02-APPLE-02_FOUNDATIONS-05` | Use translucency only when text contrast and context remain robust with variable content behind it. | Implementation review + scenario check |
| `ADI-02-APPLE-02_FOUNDATIONS-06` | Observe content margins and safe areas; ensure scrollable content remains reachable with overlays and keyboards open. | Visual review + interaction check |
| `ADI-02-APPLE-02_FOUNDATIONS-07` | Prefer familiar iconography and attach accessible labels when an icon’s meaning may be ambiguous. | Implementation review + scenario check |
| `ADI-02-APPLE-02_FOUNDATIONS-08` | Maintain semantic grouping as text grows or localization lengthens labels. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Hard-coded system colors without variants
- Blurred glass over dense content
- Microscopic secondary text used solely to achieve a fashionable look
- Static text heights and ellipsized essential messages

## Acceptance checklist

- [ ] Light, dark, increased contrast and text scaling checked
- [ ] Primary action is perceivable without relying on hue
- [ ] Content fits with system UI and keyboard visible
- [ ] Icon labels available when needed

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://developer.apple.com/design/human-interface-guidelines/color
- https://developer.apple.com/design/human-interface-guidelines/layout
- https://developer.apple.com/design/human-interface-guidelines/typography
- https://developer.apple.com/design/human-interface-guidelines/accessibility

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
