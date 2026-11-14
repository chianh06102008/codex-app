---
id: ADI-09-DESIGN-SCHOOLS-02_BAUHAUS
title: "Bauhaus — form and function"
pack: 09-DESIGN-SCHOOLS
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [bauhaus, function]
---

# Bauhaus — form and function

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use as an interpretive design-history lens for functional forms, structural simplicity and purposeful geometry, not as a universal UI specification.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-09-DESIGN-SCHOOLS-02_BAUHAUS-01` | Make interaction purpose determine component form. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-02_BAUHAUS-02` | Use geometric primitives consistently and sparingly. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-02_BAUHAUS-03` | Prefer direct organization over ornamental complexity. | Visual review + interaction check |
| `ADI-09-DESIGN-SCHOOLS-02_BAUHAUS-04` | Keep functional labels visible when geometry alone is ambiguous. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-02_BAUHAUS-05` | Ensure form remains workable with real text and data. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-02_BAUHAUS-06` | Treat a historical aesthetic as inspiration, not a license to ignore accessibility. | Visual review + interaction check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Geometric novelty obscures controls
- Colored shapes with no task purpose
- Historic styling chosen over usability

## Acceptance checklist

- [ ] Forms serve a documented task
- [ ] Semantics intact
- [ ] Accessible contrast and input preserved

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.bauhaus.de/en/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
