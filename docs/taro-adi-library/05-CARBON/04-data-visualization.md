---
id: ADI-05-CARBON-04_DATA_VISUALIZATION
title: "IBM Carbon — data visualization"
pack: 05-CARBON
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [carbon, charts]
---

# IBM Carbon — data visualization

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use for charts, dashboards, monitoring and comparison-heavy interfaces. Carbon’s current site lists many chart families; their existence does not guarantee every type is implemented on every framework.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-05-CARBON-04_DATA_VISUALIZATION-01` | Begin with the analytical question: comparison, time trend, distribution, relationship, part-to-whole or spatial location. | Implementation review + scenario check |
| `ADI-05-CARBON-04_DATA_VISUALIZATION-02` | Prefer common chart types when they express the data without ambiguity. | Implementation review + scenario check |
| `ADI-05-CARBON-04_DATA_VISUALIZATION-03` | Label quantities with units and meaningful axes; do not use decorative unlabeled plots. | Visual review + interaction check |
| `ADI-05-CARBON-04_DATA_VISUALIZATION-04` | Preserve consistent value-to-color mapping across multiple charts in a dashboard. | Implementation review + scenario check |
| `ADI-05-CARBON-04_DATA_VISUALIZATION-05` | For charts with hidden data, offer a tabular or textual alternative. | Implementation review + scenario check |
| `ADI-05-CARBON-04_DATA_VISUALIZATION-06` | Use direct labels where space allows and a keyboard-operable legend otherwise. | Visual review + interaction check |
| `ADI-05-CARBON-04_DATA_VISUALIZATION-07` | Explain missing data and uncertainty rather than interpolating silently. | Implementation review + scenario check |
| `ADI-05-CARBON-04_DATA_VISUALIZATION-08` | Check multiple locales and screen widths for axis/date label collisions. | Implementation review + scenario check |
| `ADI-05-CARBON-04_DATA_VISUALIZATION-09` | Avoid misleading truncated or inconsistent baselines when comparing magnitudes. | Visual review + interaction check |
| `ADI-05-CARBON-04_DATA_VISUALIZATION-10` | Handle hover and keyboard focus consistently for point inspection. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- 3D bars hiding magnitude
- Pie charts with many tiny categories
- Color as the only data encoding
- Chart titles that give no question or insight
- Auto-scaled axes that mislead casual comparison

## Acceptance checklist

- [ ] Chart encodes intended relationship
- [ ] Axis and units verified
- [ ] Accessible alternative exists
- [ ] Keyboard/tooltips tested
- [ ] Chart values match source data

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://www.carbondesignsystem.com/building-blocks/data-visualization/overview
- https://www.carbondesignsystem.com/building-blocks/data-visualization/chart-anatomy
- https://charts.carbondesignsystem.com/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
