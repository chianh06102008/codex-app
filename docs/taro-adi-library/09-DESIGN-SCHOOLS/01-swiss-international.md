---
id: ADI-09-DESIGN-SCHOOLS-01_SWISS_INTERNATIONAL
title: "Swiss / International Typographic Style"
pack: 09-DESIGN-SCHOOLS
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [swiss, editorial]
---

# Swiss / International Typographic Style

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use as an optional editorial direction when rigorous hierarchy, grids and typography are central to the requested aesthetic. This is a design-history lens, not a certification standard.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-09-DESIGN-SCHOOLS-01_SWISS_INTERNATIONAL-01` | Organize content on a coherent modular grid. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-01_SWISS_INTERNATIONAL-02` | Use typographic scale and alignment to lead the eye. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-01_SWISS_INTERNATIONAL-03` | Prefer functional asymmetry to artificial centering when scanning benefits. | Visual review + interaction check |
| `ADI-09-DESIGN-SCHOOLS-01_SWISS_INTERNATIONAL-04` | Treat photography and illustration as content, not filler. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-01_SWISS_INTERNATIONAL-05` | Make spacing deliberate and repeated. | Implementation review + scenario check |
| `ADI-09-DESIGN-SCHOOLS-01_SWISS_INTERNATIONAL-06` | Preserve clarity over decorative branding. | Visual review + interaction check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Centered everything regardless of reading path
- Grid ignored across related sections
- Whitespace so extreme it hides key tasks

## Acceptance checklist

- [ ] Grid anchors clear
- [ ] Information remains readable
- [ ] Brand elements do not compete with core content

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.britannica.com/art/International-Typographic-Style

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
