---
id: ADI-03-FLUENT-01_FOUNDATIONS
title: "Microsoft Fluent 2 — foundations"
pack: 03-FLUENT
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [fluent, foundations]
---

# Microsoft Fluent 2 — foundations

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for Microsoft-style productivity software, especially dense desktop workflows, panels and collaborative environments. Treat these as independent ADI application rules, not official verbatim Fluent requirements.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-03-FLUENT-01_FOUNDATIONS-01` | Define semantic color roles for foreground, background, neutral surfaces, brand actions, and feedback statuses. | Implementation review + scenario check |
| `ADI-03-FLUENT-01_FOUNDATIONS-02` | Design text with a stable hierarchy; distinguish page headings, section labels, body content and metadata. | Implementation review + scenario check |
| `ADI-03-FLUENT-01_FOUNDATIONS-03` | Keep interactive surfaces aligned to a consistent corner radius and stroke treatment. | Visual review + interaction check |
| `ADI-03-FLUENT-01_FOUNDATIONS-04` | Use elevation to express layer ownership, not to decorate every card. | Implementation review + scenario check |
| `ADI-03-FLUENT-01_FOUNDATIONS-05` | Minimize unnecessary shadow, gradient and icon treatments in data-dense tools. | Implementation review + scenario check |
| `ADI-03-FLUENT-01_FOUNDATIONS-06` | Choose density based on tasks: compact for repeated expert operations, comfortable for reading and onboarding. | Visual review + interaction check |
| `ADI-03-FLUENT-01_FOUNDATIONS-07` | Create state variants for hover, focus, pressed, selected, invalid and disabled. | Implementation review + scenario check |
| `ADI-03-FLUENT-01_FOUNDATIONS-08` | Maintain parity for light, dark and high-contrast environments. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Random per-screen corner radii
- Low-contrast body labels
- Superfluous drop shadows on nested panels
- A single theme tested only in light mode

## Acceptance checklist

- [ ] Design token roles documented
- [ ] Three levels of text hierarchy perceptible
- [ ] Neutral surfaces have meaningful boundaries
- [ ] High-contrast mode reviewed

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://fluent2.microsoft.design/
- https://fluent2.microsoft.design/color
- https://fluent2.microsoft.design/typography

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
