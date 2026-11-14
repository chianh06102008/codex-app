---
id: ADI-08-COMPOSITION-06_MOTION
title: "Motion, transitions and reduced motion"
pack: 08-COMPOSITION
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [motion, transitions]
---

# Motion, transitions and reduced motion

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use animation to explain spatial relationships or confirm changes, not to make simple tools feel “AI-powered”.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-08-COMPOSITION-06_MOTION-01` | Define the information the animation conveys before designing it. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-06_MOTION-02` | Animate transitions at the level of the affected object rather than the entire page when possible. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-06_MOTION-03` | Limit concurrent motion to prevent competition for attention. | Visual review + interaction check |
| `ADI-08-COMPOSITION-06_MOTION-04` | Provide reduced-motion behavior and avoid essential state encoded only through animation. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-06_MOTION-05` | Keep loading indicators honest about operation state. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-06_MOTION-06` | Avoid unexpected layout shifts caused by late-arriving animation wrappers. | Visual review + interaction check |
| `ADI-08-COMPOSITION-06_MOTION-07` | Ensure transitions do not steal focus or interrupt text entry. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Unnecessary particle effects in coding tools
- Every card animates on hover
- Transition hides completed form state

## Acceptance checklist

- [ ] Motion purpose documented
- [ ] Reduced-motion mode verified
- [ ] No essential information lost when animations are disabled

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://fluent2.microsoft.design/
- https://developer.android.com/develop/ui/compose/designsystems/material3

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
