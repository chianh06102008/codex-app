---
id: ADI-07-COGNITIVE-01_FITTS_LAW
title: "Fitts’s Law — movement and target acquisition"
pack: 07-COGNITIVE
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [fitts, interaction]
---

# Fitts’s Law — movement and target acquisition

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Useful for frequent pointer/touch actions and the placement of primary controls. Its mathematical form describes typical movement difficulty as a function of distance and target width, but the actual coefficients depend on the user and device.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-07-COGNITIVE-01_FITTS_LAW-01` | Place frequent actions close to the task context. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-01_FITTS_LAW-02` | Increase effective target dimensions for commonly repeated actions, including accessible hit areas beyond the icon if practical. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-01_FITTS_LAW-03` | Do not place destructive actions where a hurried pointer movement can easily activate them. | Visual review + interaction check |
| `ADI-07-COGNITIVE-01_FITTS_LAW-04` | Keep neighboring targets separated enough to reduce accidental activation. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-01_FITTS_LAW-05` | Prefer stable positions for repeated actions; avoid jumping toolbars. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-01_FITTS_LAW-06` | Do not use an enormous target to bypass the need for descriptive labeling. | Visual review + interaction check |
| `ADI-07-COGNITIVE-01_FITTS_LAW-07` | Check both pointer and touch use; small desktop icons may need larger mobile hit areas. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- A 12-pixel icon is the only touch surface
- A critical button moves after progress loads
- A destructive button touches an adjacent frequent button

## Acceptance checklist

- [ ] Frequent actions have feasible acquisition targets
- [ ] No accidental activation in repeated-use test
- [ ] Targets accessible by keyboard and touch

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.nngroup.com/articles/fitts-law/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
