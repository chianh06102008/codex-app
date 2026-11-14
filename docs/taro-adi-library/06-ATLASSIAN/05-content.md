---
id: ADI-06-ATLASSIAN-05_CONTENT
title: "Atlassian ADS — collaborative content"
pack: 06-ATLASSIAN
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [atlassian, content]
---

# Atlassian ADS — collaborative content

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use clear, actionable wording for project planning, work-tracking, notifications and review experiences.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-06-ATLASSIAN-05_CONTENT-01` | Use object-first language in task titles and activity streams. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-05_CONTENT-02` | Write status changes as observable events instead of opaque system messages. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-05_CONTENT-03` | Separate human comments, AI-generated suggestions and automated status transitions. | Visual review + interaction check |
| `ADI-06-ATLASSIAN-05_CONTENT-04` | Let reviewers understand precisely what changed and what they are being asked to decide. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-05_CONTENT-05` | Prefer time references with locale-appropriate absolute time on demand. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-05_CONTENT-06` | Describe permission restrictions with a clear, legitimate request path. | Visual review + interaction check |
| `ADI-06-ATLASSIAN-05_CONTENT-07` | Use understandable taxonomy for issue type, status, priority, label, team and assignee. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-05_CONTENT-08` | Prevent accidentally sending incomplete draft comments by supporting editing and confirmation when needed. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- “Updated” without identifying the field
- Attributing AI suggestions to team members
- Ambiguous permissions “No access”
- Misleading activity stream order

## Acceptance checklist

- [ ] Messages identify actor/action/object
- [ ] AI versus human authorship clear
- [ ] Review comments retain edit history when relevant
- [ ] Permission errors are actionable

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://atlassian.design/foundations
- https://atlassian.design/license

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
