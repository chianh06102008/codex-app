---
id: ADI-05-CARBON-02_COMPONENTS
title: "IBM Carbon — components"
pack: 05-CARBON
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [carbon, components]
---

# IBM Carbon — components

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Prefer the system’s coherent component family for enterprise tools, especially data tables, structured forms and UI shells.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-05-CARBON-02_COMPONENTS-01` | Use a UI shell with predictable global, contextual and local navigation boundaries. | Implementation review + scenario check |
| `ADI-05-CARBON-02_COMPONENTS-02` | Assign buttons a single action role in each group; reserve destructive styling for destructive effects. | Implementation review + scenario check |
| `ADI-05-CARBON-02_COMPONENTS-03` | For data tables, design selection, sorting, filtering, pagination and bulk actions as one interaction model. | Visual review + interaction check |
| `ADI-05-CARBON-02_COMPONENTS-04` | Use notifications with a clear severity, object context and next step. | Implementation review + scenario check |
| `ADI-05-CARBON-02_COMPONENTS-05` | Distinguish tabs for peer views from accordions for disclosure within a view. | Implementation review + scenario check |
| `ADI-05-CARBON-02_COMPONENTS-06` | Expose table empty, loading, partial-success and error states. | Visual review + interaction check |
| `ADI-05-CARBON-02_COMPONENTS-07` | Keep filtering and search discoverable near the table they affect. | Implementation review + scenario check |
| `ADI-05-CARBON-02_COMPONENTS-08` | Trace each component to the actual installed Carbon version and supported framework. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Sort controls that change visual order but not data
- No feedback after multi-row actions
- Invisible bulk-selection state
- Component usage copied from retired Carbon v10

## Acceptance checklist

- [ ] Table states tested
- [ ] Bulk actions properly scoped
- [ ] Notifications identify affected objects
- [ ] Component version recorded

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.carbondesignsystem.com/building-blocks/core/components/overview/components
- https://github.com/carbon-design-system/carbon

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
