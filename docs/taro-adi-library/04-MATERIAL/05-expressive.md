---
id: ADI-04-MATERIAL-05_EXPRESSIVE
title: "Material 3 Expressive — separate optional layer"
pack: 04-MATERIAL
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [material, expressive]
---

# Material 3 Expressive — separate optional layer

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Material 3 Expressive is an evolution within M3, not an automatic blanket upgrade. Activate only when the user requests a playful or expressive Android direction or the product context justifies it. Keep this layer version-separated from baseline M3.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-04-MATERIAL-05_EXPRESSIVE-01` | Document whether the project targets base M3 or an expressive variant, with an explicit implementation version. | Implementation review + scenario check |
| `ADI-04-MATERIAL-05_EXPRESSIVE-02` | Use expressive typography, shape and color to clarify content grouping and brand personality. | Implementation review + scenario check |
| `ADI-04-MATERIAL-05_EXPRESSIVE-03` | Use motion to show cause, continuity or completion; never add motion without information value. | Visual review + interaction check |
| `ADI-04-MATERIAL-05_EXPRESSIVE-04` | Keep the main task flow calm in high-consequence or data-dense contexts. | Implementation review + scenario check |
| `ADI-04-MATERIAL-05_EXPRESSIVE-05` | Ensure expressive transitions respect reduced-motion settings. | Implementation review + scenario check |
| `ADI-04-MATERIAL-05_EXPRESSIVE-06` | Apply distinctiveness selectively to dominant actions or hero areas, not to every repeated control. | Visual review + interaction check |
| `ADI-04-MATERIAL-05_EXPRESSIVE-07` | Measure whether expressive changes improve discoverability and perceived clarity in a realistic task. | Implementation review + scenario check |
| `ADI-04-MATERIAL-05_EXPRESSIVE-08` | Preserve core accessibility and input expectations even when styles change. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Every component made oversized and animated
- Varying type and shapes solely for novelty
- Ignoring the current Material 3 release version
- Reduced-motion mode showing identical full animation

## Acceptance checklist

- [ ] Expressive variant explicitly recorded
- [ ] No key task obscured by decoration
- [ ] Reduced-motion alternative works
- [ ] Version compatibility checked

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://m3.material.io/
- https://developer.android.com/develop/ui/compose/designsystems/material3
- https://developer.android.com/jetpack/androidx/releases/compose-material3

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
