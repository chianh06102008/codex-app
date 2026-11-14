---
id: ADI-06-ATLASSIAN-03_COMPONENTS
title: "Atlassian ADS — components"
pack: 06-ATLASSIAN
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [atlassian, components]
---

# Atlassian ADS — components

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Apply task-focused components to menus, forms, navigation, issue views and collaboration. This is not an official Atlaskit component API inventory.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-06-ATLASSIAN-03_COMPONENTS-01` | Treat work item rows and cards as inspectable objects, with clear selection and open actions. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-03_COMPONENTS-02` | Place row-specific actions near row context while preserving keyboard discoverability. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-03_COMPONENTS-03` | Choose form controls based on input type and error-correction needs. | Visual review + interaction check |
| `ADI-06-ATLASSIAN-03_COMPONENTS-04` | Use dialogs for decisions requiring immediate attention; use panels for contextual details. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-03_COMPONENTS-05` | Present status fields as readable text plus optional symbolic treatment. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-03_COMPONENTS-06` | Keep tooltips supplemental and never the only place for essential instructions. | Visual review + interaction check |
| `ADI-06-ATLASSIAN-03_COMPONENTS-07` | Expose edit state, save state and failed-save state separately. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-03_COMPONENTS-08` | Verify actual package version and license for each component dependency. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Anonymous icons for critical issue actions
- Non-editable looking editable values
- Every status rendered as a colored dot
- A perpetual spinner with no failure path

## Acceptance checklist

- [ ] Work item controls have understandable names
- [ ] Selection and focus states distinct
- [ ] Edit/save/failure states exist
- [ ] Component dependency licensed and versioned

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://atlassian.design/components
- https://atlassian.design/license

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
