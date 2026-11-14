---
id: ADI-06-ATLASSIAN-04_WORK_PATTERNS
title: "Atlassian ADS — work-management patterns"
pack: 06-ATLASSIAN
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [atlassian, patterns]
---

# Atlassian ADS — work-management patterns

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for projects, boards, work items, issue tracking, review queues, comments and team collaboration.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-06-ATLASSIAN-04_WORK_PATTERNS-01` | Keep work item identity and state visible while editing descriptions or commenting. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-04_WORK_PATTERNS-02` | Show the difference between personal assignment, team ownership, and workflow status. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-04_WORK_PATTERNS-03` | Provide a usable overview-to-detail path and a fast return with preserved filter context. | Visual review + interaction check |
| `ADI-06-ATLASSIAN-04_WORK_PATTERNS-04` | Make updates attributable and timestamped when collaboration requires accountability. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-04_WORK_PATTERNS-05` | Provide clear empty and no-results states after filtering. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-04_WORK_PATTERNS-06` | Differentiate draft comments from posted comments and unsent changes. | Visual review + interaction check |
| `ADI-06-ATLASSIAN-04_WORK_PATTERNS-07` | Handle concurrent edits with visible conflict resolution rather than silently overwriting. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-04_WORK_PATTERNS-08` | Keep bulk changes reviewable before commit and traceable afterward. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Loss of context after opening a work item
- Unknown provenance of a status change
- Silent overwrite of colleague edits
- Comments posted without clear state

## Acceptance checklist

- [ ] Overview-detail navigation preserves context
- [ ] Comment state visible
- [ ] Concurrency behavior planned
- [ ] History or auditability considered

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://atlassian.design/get-started/about-atlassian-design-system
- https://atlassian.design/components

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
