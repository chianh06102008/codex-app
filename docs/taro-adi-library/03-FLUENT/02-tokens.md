---
id: ADI-03-FLUENT-02_TOKENS
title: "Microsoft Fluent 2 — design tokens"
pack: 03-FLUENT
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [fluent, tokens]
---

# Microsoft Fluent 2 — design tokens

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Build a scalable token layer rather than copying static numeric values from screenshots. The official Fluent 2 architecture distinguishes global values and semantically named aliases.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-03-FLUENT-02_TOKENS-01` | Separate raw palette/size values from role-based aliases consumed by components. | Implementation review + scenario check |
| `ADI-03-FLUENT-02_TOKENS-02` | Use semantic names describing usage rather than appearance, such as surface.canvas or text.muted. | Implementation review + scenario check |
| `ADI-03-FLUENT-02_TOKENS-03` | Define token mappings per light/dark/high-contrast theme without changing the component API. | Visual review + interaction check |
| `ADI-03-FLUENT-02_TOKENS-04` | Avoid literal colors in component code except for carefully isolated external assets. | Implementation review + scenario check |
| `ADI-03-FLUENT-02_TOKENS-05` | Create intentional roles for spacing, typography, radii, strokes, motion and shadow. | Implementation review + scenario check |
| `ADI-03-FLUENT-02_TOKENS-06` | Keep interaction states tokenized; never invent hover colors independently per button. | Visual review + interaction check |
| `ADI-03-FLUENT-02_TOKENS-07` | Document fallback behavior when a token is unavailable in the chosen implementation. | Implementation review + scenario check |
| `ADI-03-FLUENT-02_TOKENS-08` | Add a CI check that flags unknown token references or raw theme colors outside exemptions. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Hardcoded #hex values spread across JSX
- Alias tokens that encode the wrong semantic role
- Theme switching that changes control hierarchy
- Duplicated same-value variables without meaning

## Acceptance checklist

- [ ] Global and semantic layers exist
- [ ] All major components use aliases
- [ ] Light/dark/high-contrast mappings provided
- [ ] Unknown tokens produce a review warning

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://fluent2.microsoft.design/design-tokens
- https://github.com/microsoft/fluentui

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
