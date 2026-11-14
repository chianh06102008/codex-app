---
id: ADI-02-APPLE-05_INPUTS
title: "Apple HIG — input methods"
pack: 02-APPLE
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [apple, inputs]
---

# Apple HIG — input methods

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use when a product supports touch, keyboard, pointer, game controller, remote, voice, or spatial interactions.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-02-APPLE-05_INPUTS-01` | Distinguish direct touch targets from precision pointer targets; support both where the platform can use both. | Implementation review + scenario check |
| `ADI-02-APPLE-05_INPUTS-02` | Offer visible alternatives to gesture-only actions. | Implementation review + scenario check |
| `ADI-02-APPLE-05_INPUTS-03` | Keep focus order consistent with the logical reading and task order. | Visual review + interaction check |
| `ADI-02-APPLE-05_INPUTS-04` | Provide keyboard access for frequent tasks and visible shortcut discovery where appropriate. | Implementation review + scenario check |
| `ADI-02-APPLE-05_INPUTS-05` | Do not hijack standard platform text-editing shortcuts. | Implementation review + scenario check |
| `ADI-02-APPLE-05_INPUTS-06` | Ensure form labels remain connected to fields and do not disappear when entered text is present. | Visual review + interaction check |
| `ADI-02-APPLE-05_INPUTS-07` | Design a meaningful focus indicator for keyboard and remote navigation. | Implementation review + scenario check |
| `ADI-02-APPLE-05_INPUTS-08` | Test input-method transitions midway through tasks without losing selection or data. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Gesture-only deletion
- Invisible focus for keyboard
- Click handlers without button semantics
- Keyboard focus trapped behind a closed overlay

## Acceptance checklist

- [ ] Main actions operable without gestures
- [ ] Tab order matches task order
- [ ] Shortcut collisions reviewed
- [ ] Input transition does not lose user data

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://developer.apple.com/design/human-interface-guidelines/inputs
- https://developer.apple.com/design/human-interface-guidelines/accessibility

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
