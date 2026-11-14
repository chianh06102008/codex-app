---
id: ADI-09-DESIGN-SCHOOLS-03_MODERNISM
title: "Modernist restraint — function and clarity"
pack: 09-DESIGN-SCHOOLS
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [modernism, minimalism]
---

# Modernist restraint — function and clarity

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for clean, contemporary products that need a disciplined visual system rather than decorative density.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-09-DESIGN-SCHOOLS-03_MODERNISM-01` | Reduce each screen to necessary hierarchy and controls. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-03_MODERNISM-02` | Use repeated type, alignment and spacing roles. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-03_MODERNISM-03` | Reveal advanced functions through context rather than gratuitous simplification. | Visual review + interaction check |
| `ADI-09-DESIGN-SCHOOLS-03_MODERNISM-04` | Avoid motion and effects without a purpose. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-03_MODERNISM-05` | Preserve important domain data even when it makes a composition less sparse. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-03_MODERNISM-06` | Use visual contrast to highlight one action per decision cluster. | Visual review + interaction check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Minimalism that hides critical actions
- Decorative nothingness around tiny forms
- Unsupported claim that one specific look is “modernist”

## Acceptance checklist

- [ ] All necessary tasks remain discoverable
- [ ] Density matches task
- [ ] Effects have rationale

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.britannica.com/art/modernism-art

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
