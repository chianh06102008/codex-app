---
id: ADI-02-APPLE-01_PLATFORMS
title: "Apple HIG — platform adaptation"
pack: 02-APPLE
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [apple, platform, native]
---

# Apple HIG — platform adaptation

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Apply only when the user requests Apple-native interaction or an Apple-platform application. A cross-platform website should not be silently restyled as an iOS app; its navigation, controls, and pointer behaviors have different affordances.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-02-APPLE-01_PLATFORMS-01` | Choose the target among iOS, iPadOS, macOS, watchOS, tvOS, and visionOS before choosing navigation primitives. | Implementation review + scenario check |
| `ADI-02-APPLE-01_PLATFORMS-02` | On iPhone, prioritize a focused content path; on iPad and Mac, take advantage of width for persistent supporting context where appropriate. | Implementation review + scenario check |
| `ADI-02-APPLE-01_PLATFORMS-03` | For macOS, retain conventional windows, menus, context menus, keyboard commands, and clear selection behavior. | Visual review + interaction check |
| `ADI-02-APPLE-01_PLATFORMS-04` | Treat large content-size settings, window resizing, safe areas, split views, and localization as layout inputs, not afterthoughts. | Implementation review + scenario check |
| `ADI-02-APPLE-01_PLATFORMS-05` | Preserve operating-system expectations for back navigation and dismissing temporary surfaces. | Implementation review + scenario check |
| `ADI-02-APPLE-01_PLATFORMS-06` | Never imitate hardware cutouts, system chrome, or system-level alerts in a way that confuses product content with OS controls. | Visual review + interaction check |
| `ADI-02-APPLE-01_PLATFORMS-07` | Select native controls unless the task genuinely needs custom behavior; explain any custom substitutes. | Implementation review + scenario check |
| `ADI-02-APPLE-01_PLATFORMS-08` | Test pointer, touch, keyboard, focus, and assistive access where supported by the selected Apple platform. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Phone-only mockups stretched into wide desktop views
- Touch-only affordances in a Mac workflow
- Blindly transplanting mobile tab bars into desktop navigation

## Acceptance checklist

- [ ] Correct platform and input modality recorded
- [ ] Responsive layout maintains function at compact and expanded windows
- [ ] Back/dismiss conventions verified
- [ ] System safe areas respected
- [ ] No untested custom system mimicry

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://developer.apple.com/design/human-interface-guidelines/
- https://developer.apple.com/design/human-interface-guidelines/layout
- https://developer.apple.com/design/human-interface-guidelines/design-principles/

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
