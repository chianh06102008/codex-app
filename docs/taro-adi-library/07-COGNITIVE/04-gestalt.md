---
id: ADI-07-COGNITIVE-04_GESTALT
title: "Gestalt principles — perceptual grouping"
pack: 07-COGNITIVE
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [gestalt, grouping]
---

# Gestalt principles — perceptual grouping

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use proximity, similarity, continuity, common region, closure and figure–ground to clarify relationships among UI elements.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-07-COGNITIVE-04_GESTALT-01` | Place items that function together nearer each other than to unrelated items. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-04_GESTALT-02` | Use consistent treatments for repeated objects of the same type. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-04_GESTALT-03` | Align controls and values to create readable paths through a panel. | Visual review + interaction check |
| `ADI-07-COGNITIVE-04_GESTALT-04` | Use visible containers only when grouping cannot be conveyed more simply. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-04_GESTALT-05` | Ensure foreground content stands apart from decorative backgrounds. | Implementation review + scenario check |
| `ADI-07-COGNITIVE-04_GESTALT-06` | Separate neighboring groups with whitespace before adding another border. | Visual review + interaction check |
| `ADI-07-COGNITIVE-04_GESTALT-07` | Do not rely solely on visual similarity when accessible semantic grouping is required. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Three unrelated controls crowded into one row
- Identical cards show radically different actions
- Containers nested five levels deep with no information benefit

## Acceptance checklist

- [ ] First-glance groups match task model
- [ ] Related labels stay with controls
- [ ] Screen reader structure agrees with visual hierarchy

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://lawsofux.com/law-of-proximity/
- https://lawsofux.com/law-of-common-region/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
