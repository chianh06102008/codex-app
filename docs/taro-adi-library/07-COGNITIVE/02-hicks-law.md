---
id: ADI-07-COGNITIVE-02_HICKS_LAW
title: "Hick–Hyman Law — choices and decision complexity"
pack: 07-COGNITIVE
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [hicks, choices]
---

# Hick–Hyman Law — choices and decision complexity

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use to reason about choice structures and cognitive load, not to claim that fewer buttons always produce a better experience.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-07-COGNITIVE-02_HICKS_LAW-01` | Group choices around familiar user tasks rather than arbitrary feature ownership. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-02_HICKS_LAW-02` | Offer a recommended starting path where a frequent use case exists. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-02_HICKS_LAW-03` | Reveal specialized options only when their context is established. | Visual review + interaction check |
| `ADI-07-COGNITIVE-02_HICKS_LAW-04` | Use search/filter for large option sets instead of endless nested menus. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-02_HICKS_LAW-05` | Prefer descriptive labels to vague category names. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-02_HICKS_LAW-06` | Avoid creating many navigation levels to artificially reduce the first-level count. | Visual review + interaction check |
| `ADI-07-COGNITIVE-02_HICKS_LAW-07` | Assess actual recognition time, mistakes and backtracking rather than menu count alone. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Twenty equal-weight actions in the first view
- Single action hidden under four nested groups
- Empty category names like “Other Tools” used for core tasks

## Acceptance checklist

- [ ] Choice groups have meaningful labels
- [ ] Most common task findable without guesswork
- [ ] Information scent tested on a realistic scenario

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://lawsofux.com/hicks-law/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
