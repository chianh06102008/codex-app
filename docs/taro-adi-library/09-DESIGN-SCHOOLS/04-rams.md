---
id: ADI-09-DESIGN-SCHOOLS-04_RAMS
title: "Dieter Rams — ten-principle-inspired review"
pack: 09-DESIGN-SCHOOLS
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [rams, critique]
---

# Dieter Rams — ten-principle-inspired review

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use as a critical design lens: purposeful, understandable, unobtrusive, durable, and considered. Do not reproduce proprietary essays or claim a formal compliance standard.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-09-DESIGN-SCHOOLS-04_RAMS-01` | Ask whether each ornament or interaction adds task value. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-04_RAMS-02` | Reduce irreversible surprises and misleading affordances. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-04_RAMS-03` | Prefer clear operation to fashionable novelty. | Visual review + interaction check |
| `ADI-09-DESIGN-SCHOOLS-04_RAMS-04` | Review details: spacing, alignment, copy, focus, transitions and edge states. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-04_RAMS-05` | Consider longevity through consistency and adaptable components. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-04_RAMS-06` | Avoid interfaces that promise more capability than the product actually has. | Visual review + interaction check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Pretend AI capability communicated by glowing gradients
- Aesthetic polish masking broken workflows
- Multiple inconsistent micro-interactions

## Acceptance checklist

- [ ] Product affordances are truthful
- [ ] Details reviewed under stress states
- [ ] Core experience remains usable without decoration

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.vitsoe.com/us/about/good-design

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
