---
id: ADI-04-MATERIAL-02_TOKENS
title: "Material Design 3 — theme and token architecture"
pack: 04-MATERIAL
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [material, tokens]
---

# Material Design 3 — theme and token architecture

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Support Material roles and semantic tokens across implementations. Concrete values must come from the current chosen package or generated project theme.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-04-MATERIAL-02_TOKENS-01` | Separate primary, secondary, tertiary and neutral color intent at the semantic layer. | Implementation review + scenario check |
| `ADI-04-MATERIAL-02_TOKENS-02` | Provide explicit on-color pairs for readable foreground content on key surfaces. | Implementation review + scenario check |
| `ADI-04-MATERIAL-02_TOKENS-03` | Map component states to theme roles rather than hard-coded fallback colors. | Visual review + interaction check |
| `ADI-04-MATERIAL-02_TOKENS-04` | Define a type scale aligned to functional text hierarchy. | Implementation review + scenario check |
| `ADI-04-MATERIAL-02_TOKENS-05` | Choose a shape scale and apply it consistently to containers and controls. | Implementation review + scenario check |
| `ADI-04-MATERIAL-02_TOKENS-06` | Map adaptive layouts to current window-size guidance rather than device names alone. | Visual review + interaction check |
| `ADI-04-MATERIAL-02_TOKENS-07` | Use exported theme configuration as the authority for app code; do not let Figma and code drift silently. | Implementation review + scenario check |
| `ADI-04-MATERIAL-02_TOKENS-08` | Treat platform-specific motion and elevation parameters as implementation choices requiring tests. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Using `primary` as text color on every surface
- No on-primary or on-surface contrast validation
- Device-string breakpoints only
- Color schemes updated without testing chart palettes

## Acceptance checklist

- [ ] Semantic color pairings audited
- [ ] Light/dark variants exist
- [ ] Type and shape roles mapped
- [ ] Theme implementation and design reference compared

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://m3.material.io/styles/color/overview
- https://developer.android.com/develop/ui/compose/designsystems/material3

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
