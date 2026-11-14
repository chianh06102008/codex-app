---
id: ADI-09-DESIGN-SCHOOLS-05_CRAP
title: "CRAP / CARP — contrast, repetition, alignment, proximity"
pack: 09-DESIGN-SCHOOLS
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [crap, composition]
---

# CRAP / CARP — contrast, repetition, alignment, proximity

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use as a lightweight editorial QA lens. The mnemonic is a teaching heuristic, not a regulatory design standard.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-09-DESIGN-SCHOOLS-05_CRAP-01` | Contrast: visually distinguish materially different functions. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-05_CRAP-02` | Repetition: use stable treatments for equivalent objects. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-05_CRAP-03` | Alignment: connect content on coherent visual axes. | Visual review + interaction check |
| `ADI-09-DESIGN-SCHOOLS-05_CRAP-04` | Proximity: group related items tightly and separate unrelated sections. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-05_CRAP-05` | Balance the four principles rather than maximizing any one. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-05_CRAP-06` | Verify visual groupings align with semantic DOM relationships. | Visual review + interaction check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Equal contrast given to every text item
- Random gutters and button variants
- Grouping visible only to sighted users

## Acceptance checklist

- [ ] Contrast establishes priority
- [ ] Repetition reduces guesswork
- [ ] Alignment and proximity checked at responsive widths

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.nngroup.com/articles/visual-design/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
