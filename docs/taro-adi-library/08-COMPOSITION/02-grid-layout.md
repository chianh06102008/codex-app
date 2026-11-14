---
id: ADI-08-COMPOSITION-02_GRID_LAYOUT
title: "Grids, alignment and responsive structure"
pack: 08-COMPOSITION
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [grid, layout]
---

# Grids, alignment and responsive structure

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for desktop multi-panel apps, dashboard grids and fluid responsive layouts.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-08-COMPOSITION-02_GRID_LAYOUT-01` | Choose a consistent content container strategy before drawing individual cards. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-02_GRID_LAYOUT-02` | Align headings, content edges and action rows to shared anchors. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-02_GRID_LAYOUT-03` | Design explicit breakpoints or adaptive transitions based on minimum component needs. | Visual review + interaction check |
| `ADI-08-COMPOSITION-02_GRID_LAYOUT-04` | Keep reading order coherent when a grid collapses. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-02_GRID_LAYOUT-05` | Avoid arbitrary empty columns that create poor scanning. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-02_GRID_LAYOUT-06` | Ensure sidebar and content pane proportions reflect task needs. | Visual review + interaction check |
| `ADI-08-COMPOSITION-02_GRID_LAYOUT-07` | Use intrinsic sizing and wrapping instead of pixel-perfect screenshot imitation. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Columns collapse into unusable slivers
- Reading order reverses unexpectedly
- Every card has different horizontal inset

## Acceptance checklist

- [ ] Shared alignment anchors present
- [ ] No horizontal overflow at supported widths
- [ ] Reading order valid after reflow

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://atlassian.design/foundations
- https://www.carbondesignsystem.com/getting-started/designing/overview

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
