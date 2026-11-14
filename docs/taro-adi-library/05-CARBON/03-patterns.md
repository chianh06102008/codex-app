---
id: ADI-05-CARBON-03_PATTERNS
title: "IBM Carbon — enterprise task patterns"
pack: 05-CARBON
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [carbon, patterns]
---

# IBM Carbon — enterprise task patterns

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Apply to high-density workflows involving data entry, review, approvals, search, configuration and collaboration.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-05-CARBON-03_PATTERNS-01` | Begin with a task model identifying frequent operations, expert shortcuts and high-cost errors. | Implementation review + scenario check |
| `ADI-05-CARBON-03_PATTERNS-02` | Provide progressive disclosure for advanced configuration without burying main tasks. | Implementation review + scenario check |
| `ADI-05-CARBON-03_PATTERNS-03` | Keep multi-step sequences oriented with progress and a clear return path. | Visual review + interaction check |
| `ADI-05-CARBON-03_PATTERNS-04` | Preserve filters, selections and sort context after inspecting a detail screen. | Implementation review + scenario check |
| `ADI-05-CARBON-03_PATTERNS-05` | For bulk operations, show scope before execution and results afterward. | Implementation review + scenario check |
| `ADI-05-CARBON-03_PATTERNS-06` | Tie validation messages to fields or rows rather than a vague page-level banner. | Visual review + interaction check |
| `ADI-05-CARBON-03_PATTERNS-07` | Support partial failure with explicit per-object status when operations affect many items. | Implementation review + scenario check |
| `ADI-05-CARBON-03_PATTERNS-08` | Design review flows where decisions, comments and status are visible to teammates. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Resetting filters after editing
- Unlabeled wizard steps
- Bulk actions with unknown target scope
- No partial-success report

## Acceptance checklist

- [ ] Task-critical paths documented
- [ ] User context preserved
- [ ] Bulk action outcome itemized
- [ ] Review state understandable to a second user

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.carbondesignsystem.com/patterns
- https://www.carbondesignsystem.com/building-blocks/core/components/overview/components

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
