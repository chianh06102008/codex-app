---
id: ADI-05-CARBON-05_CONTENT
title: "IBM Carbon — UI copy and feedback"
pack: 05-CARBON
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [carbon, content]
---

# IBM Carbon — UI copy and feedback

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Create concise, task-oriented content for enterprise software without copying IBM corporate style material.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-05-CARBON-05_CONTENT-01` | Use predictable nouns for records and verb phrases for commands. | Implementation review + scenario check |
| `ADI-05-CARBON-05_CONTENT-02` | Tell users what failed, which object was involved and how to recover. | Implementation review + scenario check |
| `ADI-05-CARBON-05_CONTENT-03` | Differentiate informational status, warnings and destructive outcomes in wording and UI behavior. | Visual review + interaction check |
| `ADI-05-CARBON-05_CONTENT-04` | Avoid unexplained domain acronyms in first-run experiences. | Implementation review + scenario check |
| `ADI-05-CARBON-05_CONTENT-05` | Use context-rich empty states that describe why a list is empty. | Implementation review + scenario check |
| `ADI-05-CARBON-05_CONTENT-06` | Distinguish generated, suggested, pending and confirmed outcomes. | Visual review + interaction check |
| `ADI-05-CARBON-05_CONTENT-07` | Keep button text short without replacing clarity with vague words like “Apply”. | Implementation review + scenario check |
| `ADI-05-CARBON-05_CONTENT-08` | Use consistent terminology across navigation, breadcrumbs, forms and documentation. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Acronym-dense onboarding
- Vague alert “Action failed”
- One concept given three names across views
- Success toast for an operation still queued

## Acceptance checklist

- [ ] Object and action clear in error copy
- [ ] Status terms standardized
- [ ] Generated suggestions labeled
- [ ] Localized text lengths evaluated

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.carbondesignsystem.com/building-blocks/foundations/content
- https://www.carbondesignsystem.com/building-blocks/core/components/overview/components

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
