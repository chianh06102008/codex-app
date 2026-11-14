---
id: ADI-07-COGNITIVE-03_JAKOBS_LAW
title: "Jakob’s Law — transfer of expectations"
pack: 07-COGNITIVE
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [jakob, mental-models]
---

# Jakob’s Law — transfer of expectations

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for familiarity, transfer learning and minimizing unexplained novelty; it does not prohibit differentiation where differentiation creates measurable value.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-07-COGNITIVE-03_JAKOBS_LAW-01` | Begin with expected navigation patterns for the platform and product category. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-03_JAKOBS_LAW-02` | Use recognizable commands for Save, Undo, Search and Back. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-03_JAKOBS_LAW-03` | Reserve custom interactions for genuine task advantages. | Visual review + interaction check |
| `ADI-07-COGNITIVE-03_JAKOBS_LAW-04` | Explain unfamiliar concepts at the place of use. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-03_JAKOBS_LAW-05` | Keep labels stable across screens and project history. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-03_JAKOBS_LAW-06` | When breaking convention, plan an evidence test demonstrating reduced friction. | Visual review + interaction check |
| `ADI-07-COGNITIVE-03_JAKOBS_LAW-07` | Keep familiar shortcut and accessibility behaviors even inside custom visual designs. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Custom icon invented for Save
- Back button performs a destructive reset
- Different names for the same object across views

## Acceptance checklist

- [ ] Common actions require no tutorial
- [ ] Custom patterns have rationale
- [ ] Navigation outcome matches expectation

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://lawsofux.com/jakobs-law/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
