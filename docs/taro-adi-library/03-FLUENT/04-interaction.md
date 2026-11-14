---
id: ADI-03-FLUENT-04_INTERACTION
title: "Microsoft Fluent 2 — productivity interaction"
pack: 03-FLUENT
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [fluent, interaction]
---

# Microsoft Fluent 2 — productivity interaction

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Apply to dense software for file handling, coding, analytics, document management and business tasks.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-03-FLUENT-04_INTERACTION-01` | Arrange command surfaces near the objects or selection they operate on. | Implementation review + scenario check |
| `ADI-03-FLUENT-04_INTERACTION-02` | Keep the user’s context while moving between details and the master list. | Implementation review + scenario check |
| `ADI-03-FLUENT-04_INTERACTION-03` | Offer direct actions for frequent tasks; reserve overflow for lower-frequency actions. | Visual review + interaction check |
| `ADI-03-FLUENT-04_INTERACTION-04` | Clearly express active versus merely hovered versus keyboard-focused rows. | Implementation review + scenario check |
| `ADI-03-FLUENT-04_INTERACTION-05` | For asynchronous work, show progress, cancellation when feasible, and informative terminal states. | Implementation review + scenario check |
| `ADI-03-FLUENT-04_INTERACTION-06` | Protect unsaved edits during navigation and operations that replace a working set. | Visual review + interaction check |
| `ADI-03-FLUENT-04_INTERACTION-07` | Provide efficient keyboard routes for repetitive tasks, including selection and command execution. | Implementation review + scenario check |
| `ADI-03-FLUENT-04_INTERACTION-08` | Keep notification volume proportional to consequence; avoid toast storms. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Commands far away from their targets
- Status colors with no text
- Long-running button that appears inert
- Transient toasts used for failures requiring repair

## Acceptance checklist

- [ ] Primary workflow completed without hidden menus
- [ ] Selection remains clear after multi-action tasks
- [ ] Async actions signal progress and outcome
- [ ] Keyboard route documented

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://fluent2.microsoft.design/
- https://fluent2.microsoft.design/components

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
