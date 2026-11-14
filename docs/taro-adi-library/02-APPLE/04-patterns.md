---
id: ADI-02-APPLE-04_PATTERNS
title: "Apple HIG — interaction patterns"
pack: 02-APPLE
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [apple, patterns]
---

# Apple HIG — interaction patterns

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Guide onboarding, account entry, search, editing, feedback and settings without creating novelty for routine actions.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-02-APPLE-04_PATTERNS-01` | Make the main workflow usable before asking for optional setup or permissions when product constraints allow. | Implementation review + scenario check |
| `ADI-02-APPLE-04_PATTERNS-02` | Use progressive disclosure to reveal advanced configuration after the core path is understood. | Implementation review + scenario check |
| `ADI-02-APPLE-04_PATTERNS-03` | Persist unfinished work or warn before losing meaningful changes. | Visual review + interaction check |
| `ADI-02-APPLE-04_PATTERNS-04` | Place feedback near the affected control and identify whether the error is recoverable. | Implementation review + scenario check |
| `ADI-02-APPLE-04_PATTERNS-05` | Provide an obvious undo route for reversible actions and clear confirmation for irreversible ones. | Implementation review + scenario check |
| `ADI-02-APPLE-04_PATTERNS-06` | Keep search and filtering distinct: search locates content, filters constrain an existing set. | Visual review + interaction check |
| `ADI-02-APPLE-04_PATTERNS-07` | Preserve the user’s current selection and scroll context after returning from details. | Implementation review + scenario check |
| `ADI-02-APPLE-04_PATTERNS-08` | Treat empty states as opportunities to explain the next valid action, not decorative illustrations. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Blocking setup tours before task execution
- Non-specific toast saying only “Error”
- Resetting all selections after navigation
- Unexplained empty canvases

## Acceptance checklist

- [ ] Core route works on first visit
- [ ] Recoverable errors state action
- [ ] Navigation retains task context
- [ ] Empty/loading/error states are designed

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://developer.apple.com/design/human-interface-guidelines/patterns
- https://developer.apple.com/design/human-interface-guidelines/writing

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
