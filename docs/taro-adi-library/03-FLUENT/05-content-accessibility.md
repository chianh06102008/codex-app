---
id: ADI-03-FLUENT-05_CONTENT_ACCESSIBILITY
title: "Microsoft Fluent 2 — content and accessibility"
pack: 03-FLUENT
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [fluent, content]
---

# Microsoft Fluent 2 — content and accessibility

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Apply inclusive writing and interaction discipline to professional software, including AI-assisted and automated workflows.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-03-FLUENT-05_CONTENT_ACCESSIBILITY-01` | Write buttons as recognizable actions rather than slogans. | Implementation review + scenario check |
| `ADI-03-FLUENT-05_CONTENT_ACCESSIBILITY-02` | Present descriptions before permission requests or irreversible changes. | Implementation review + scenario check |
| `ADI-03-FLUENT-05_CONTENT_ACCESSIBILITY-03` | Expose system state with text and structure in addition to color. | Visual review + interaction check |
| `ADI-03-FLUENT-05_CONTENT_ACCESSIBILITY-04` | Validate accessible names, roles, descriptions and focus management. | Implementation review + scenario check |
| `ADI-03-FLUENT-05_CONTENT_ACCESSIBILITY-05` | Keep output of AI features distinguishable from verified application state. | Implementation review + scenario check |
| `ADI-03-FLUENT-05_CONTENT_ACCESSIBILITY-06` | Add explicit user confirmation before consequential automated edits when required by product policy. | Visual review + interaction check |
| `ADI-03-FLUENT-05_CONTENT_ACCESSIBILITY-07` | Use precise error copy with recoverability and object context. | Implementation review + scenario check |
| `ADI-03-FLUENT-05_CONTENT_ACCESSIBILITY-08` | Check display scaling, reduced motion and text zoom scenarios. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Overly playful enterprise error copy
- AI activity portrayed as completed before confirmation
- Tiny status text without contrast
- Announcing nonessential progress repeatedly

## Acceptance checklist

- [ ] Action labels describe outcomes
- [ ] Critical status is announced accessibly
- [ ] Focus restored after overlays
- [ ] AI output and system facts clearly distinguished

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://fluent2.microsoft.design/accessibility
- https://fluent2.microsoft.design/content-engineering

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
