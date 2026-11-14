---
id: ADI-05-CARBON-01_FOUNDATIONS
title: "IBM Carbon — foundations"
pack: 05-CARBON
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [carbon, foundations]
---

# IBM Carbon — foundations

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for structured business software, internal tools, analytics dashboards and complex multi-panel interfaces where consistency and content density matter.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-05-CARBON-01_FOUNDATIONS-01` | Choose a stable spacing system and apply it to nested layouts instead of incidental margins. | Implementation review + scenario check |
| `ADI-05-CARBON-01_FOUNDATIONS-02` | Use typography tokens for a predictable relationship among headings, labels, values, descriptions and metadata. | Implementation review + scenario check |
| `ADI-05-CARBON-01_FOUNDATIONS-03` | Prefer semantic color tokens suitable for multiple themes and contrast requirements. | Visual review + interaction check |
| `ADI-05-CARBON-01_FOUNDATIONS-04` | Use grid alignment to make multiple cards and data blocks visually comparable. | Implementation review + scenario check |
| `ADI-05-CARBON-01_FOUNDATIONS-05` | Choose icons only when they have familiar meanings or accompanying text. | Implementation review + scenario check |
| `ADI-05-CARBON-01_FOUNDATIONS-06` | Favor meaningful boundaries and whitespace instead of excessive raised cards. | Visual review + interaction check |
| `ADI-05-CARBON-01_FOUNDATIONS-07` | Define productive motion for state changes and limit expressive motion to special-purpose feedback. | Implementation review + scenario check |
| `ADI-05-CARBON-01_FOUNDATIONS-08` | Test long business names, dense tables and localized text without destructive truncation. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Cards floating inside cards without grouping purpose
- One-off spacing values everywhere
- Typography inconsistency across sibling panels
- Unreadable light-muted labels

## Acceptance checklist

- [ ] Grid and spacing scale applied
- [ ] Type roles consistent
- [ ] Themes and contrast checked
- [ ] Dense content survives truncation test

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.carbondesignsystem.com/building-blocks/core
- https://www.carbondesignsystem.com/getting-started/designing/overview

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
