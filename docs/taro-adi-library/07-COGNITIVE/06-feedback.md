---
id: ADI-07-COGNITIVE-06_FEEDBACK
title: "Feedback loops and perceived control"
pack: 07-COGNITIVE
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [feedback, async]
---

# Feedback loops and perceived control

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for slow network calls, agent execution, saving, importing and other asynchronous interactions.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-07-COGNITIVE-06_FEEDBACK-01` | Show an immediate acknowledgment when an operation begins. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-06_FEEDBACK-02` | Distinguish “queued”, “running”, “completed”, “failed” and “cancelled”. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-06_FEEDBACK-03` | Show meaningful progress only when it can be supported with real data. | Visual review + interaction check |
| `ADI-07-COGNITIVE-06_FEEDBACK-04` | Provide a safe cancellation route where the operation supports cancellation. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-06_FEEDBACK-05` | Keep the final result visible long enough to be understood. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-06_FEEDBACK-06` | Do not claim completion before a server or execution environment confirms it. | Visual review + interaction check |
| `ADI-07-COGNITIVE-06_FEEDBACK-07` | Surface recoverable details and retry paths when an operation fails. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- A spinner means success, waiting and failure interchangeably
- Fake percentage that advances without backend evidence
- User cancels but work continues unnoticed

## Acceptance checklist

- [ ] Every async state is distinct
- [ ] Cancellation behavior tested
- [ ] No fabricated progress values

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.nngroup.com/articles/visibility-system-status/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
