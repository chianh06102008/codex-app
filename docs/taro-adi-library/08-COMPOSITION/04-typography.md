---
id: ADI-08-COMPOSITION-04_TYPOGRAPHY
title: "Typography systems and editorial clarity"
pack: 08-COMPOSITION
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [typography, type]
---

# Typography systems and editorial clarity

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use to establish a durable typographic hierarchy in content-rich software.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-08-COMPOSITION-04_TYPOGRAPHY-01` | Use a small set of text styles with assigned semantic purposes. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-04_TYPOGRAPHY-02` | Choose readable line length for prose and tighter layouts for tables and labels. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-04_TYPOGRAPHY-03` | Respect font metrics, numerals and mixed-language fallbacks. | Visual review + interaction check |
| `ADI-08-COMPOSITION-04_TYPOGRAPHY-04` | Use monospaced text only when alignment of code or numerical structures requires it. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-04_TYPOGRAPHY-05` | Avoid excessive uppercase and tracking for long text. | Implementation review + scenario check |
| `ADI-08-COMPOSITION-04_TYPOGRAPHY-06` | Keep headings visually distinct without relying entirely on size. | Visual review + interaction check |
| `ADI-08-COMPOSITION-04_TYPOGRAPHY-07` | Test zoomed text, multi-line labels and truncation of identifiers. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Three unrelated font families in a utility tool
- Code presented in proportional text that destroys alignment
- Tiny faint body text
- One-line button labels clipped at localization

## Acceptance checklist

- [ ] Text role scale documented
- [ ] Mixed-language content checked
- [ ] Zoom and long labels supported

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://developer.apple.com/design/human-interface-guidelines/typography
- https://fluent2.microsoft.design/typography

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
