---
id: ADI-07-COGNITIVE-05_WORKING_MEMORY
title: "Working memory and cognitive load"
pack: 07-COGNITIVE
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [cognition, memory]
---

# Working memory and cognitive load

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use when a task requires users to retain information across screens or remember instructions while interacting.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-07-COGNITIVE-05_WORKING_MEMORY-01` | Keep required reference values visible during comparisons. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-05_WORKING_MEMORY-02` | Use review summaries before committing multi-step operations. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-05_WORKING_MEMORY-03` | Provide breadcrumbs/progress for tasks with consequential stages. | Visual review + interaction check |
| `ADI-07-COGNITIVE-05_WORKING_MEMORY-04` | Prefer recognition via previews, labels and recent history over recall of identifiers. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-05_WORKING_MEMORY-05` | Preserve user input across validation errors. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-05_WORKING_MEMORY-06` | Chunk long forms into meaningful sections but avoid needless additional screens. | Visual review + interaction check |
| `ADI-07-COGNITIVE-05_WORKING_MEMORY-07` | Do not expect users to remember temporary system status after it disappears. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Comparing plans by switching pages repeatedly
- Input erased after one error
- Multi-step task with no progress or review

## Acceptance checklist

- [ ] Reference content visible when needed
- [ ] Task resumes after interruption
- [ ] Review screen exposes consequences

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.nngroup.com/articles/recognition-and-recall/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
