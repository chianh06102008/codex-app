---
id: ADI-06-ATLASSIAN-01_FOUNDATIONS
title: "Atlassian ADS — foundations"
pack: 06-ATLASSIAN
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [atlassian, foundations]
---

# Atlassian ADS — foundations

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use when designing Atlassian-integrated or work-management applications. Attribution and separate source constraints apply; this file contains only original operational advice.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-06-ATLASSIAN-01_FOUNDATIONS-01` | Build an intentional hierarchy of navigation, task metadata and work-content areas. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-01_FOUNDATIONS-02` | Use semantic surface and text roles; do not copy or mint unpublished Atlassian token values. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-01_FOUNDATIONS-03` | Keep spacing and typography scales consistent across work item cards, tables and panels. | Visual review + interaction check |
| `ADI-06-ATLASSIAN-01_FOUNDATIONS-04` | Prioritize legibility in dense collaboration interfaces over brand ornamentation. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-01_FOUNDATIONS-05` | Choose restrained borders and elevation to make nested information sections distinguishable. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-01_FOUNDATIONS-06` | Provide meaningful state icons and labels for status, assignee and priority fields. | Visual review + interaction check |
| `ADI-06-ATLASSIAN-01_FOUNDATIONS-07` | Ensure controls for creation, editing, filtering and comments are keyboard reachable. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-01_FOUNDATIONS-08` | Preserve user-defined theme, contrast and text size needs. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Copying Atlassian brand assets into unrelated products
- Squeezing many columns into an unreadable card
- Status indicated by hue alone
- Hardcoded unofficial ADS tokens presented as authoritative

## Acceptance checklist

- [ ] Hierarchy supports work-item scan
- [ ] Tokens use project-owned roles
- [ ] Collaborative statuses include text
- [ ] Accessibility behaviors validated

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://atlassian.design/foundations
- https://atlassian.design/license

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
