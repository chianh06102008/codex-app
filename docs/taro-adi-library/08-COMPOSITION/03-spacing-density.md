---
id: ADI-08-COMPOSITION-03_SPACING_DENSITY
title: "Spacing, rhythm and information density"
pack: 08-COMPOSITION
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [spacing, density]
---

# Spacing, rhythm and information density

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for deciding compact versus comfortable layouts and for preventing the “too much whitespace” problem.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-08-COMPOSITION-03_SPACING_DENSITY-01` | Adopt a limited spacing scale and give each step a purpose. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-03_SPACING_DENSITY-02` | Use smaller gaps within a logical group than between separate groups. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-03_SPACING_DENSITY-03` | Match density to scanning frequency and text complexity. | Visual review + interaction check |
| `ADI-08-COMPOSITION-03_SPACING_DENSITY-04` | Keep rows compact without compromising legibility or target access. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-03_SPACING_DENSITY-05` | Reserve whitespace for major section boundaries and reading comfort. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-03_SPACING_DENSITY-06` | Avoid adding padding to imitate a premium look while hiding useful information. | Visual review + interaction check |
| `ADI-08-COMPOSITION-03_SPACING_DENSITY-07` | Test actual dataset extremes before freezing card or row heights. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Giant 48-pixel gaps between related controls
- Every section is a tall empty card
- Compact density implemented by shrinking text until unreadable

## Acceptance checklist

- [ ] Grouping gaps consistent
- [ ] Primary task visible without excessive scrolling
- [ ] Dense view still keyboard/touch usable

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://fluent2.microsoft.design/design-tokens
- https://atlassian.design/foundations

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
