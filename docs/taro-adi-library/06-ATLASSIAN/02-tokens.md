---
id: ADI-06-ATLASSIAN-02_TOKENS
title: "Atlassian ADS — tokens and visual roles"
pack: 06-ATLASSIAN
content_kind: independent-implementation-guidance
status: operational-draft
source_text_included: false
requires_current_source_verification: true
tags: [atlassian, tokens]
---

# Atlassian ADS — tokens and visual roles

> **Provenance:** Original editorial guidance created for Taro ADI. This is not the official design-system publication and no original text, imagery, token tables, or code from the publisher is reproduced. Follow current authoritative documentation before claiming publisher conformity.

## Purpose and when to activate

Use a local, original semantic-token interface compatible with selected work-management UI needs; do not redistribute Atlassian token source or assets unless an explicit applicable license permits it.

## Actionable ADI rules

| Rule | Required design behavior | Evidence |
|---|---|---|
| `ADI-06-ATLASSIAN-02_TOKENS-01` | Represent canvas, surface, raised surface, text, border, action and status as semantic roles. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-02_TOKENS-02` | Keep status roles meaningful independently of a theme’s raw hue. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-02_TOKENS-03` | Test token mapping across interaction states and high-contrast appearance. | Visual review + interaction check |
| `ADI-06-ATLASSIAN-02_TOKENS-04` | Use a single spacing scale to express grouped versus separate work content. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-02_TOKENS-05` | Maintain consistent density and type treatment for metadata, field values and descriptions. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-02_TOKENS-06` | Verify actual Atlassian package licenses before installing or bundling tokens. | Visual review + interaction check |
| `ADI-06-ATLASSIAN-02_TOKENS-07` | Keep brand-specific logo and illustration assets out of a general-purpose ADI redistributable pack. | Implementation review + scenario check |
| `ADI-06-ATLASSIAN-02_TOKENS-08` | When exact ADS values are needed, direct the engineer to the official linked resources in their own environment. | Implementation review + scenario check |

## Decision procedure

1. Write the target platform, user task, content density, and the currently selected system pack in the task record.
2. Identify the highest-frequency task and the most costly failure; keep the former immediately discoverable and make the latter reversible or preventable.
3. Choose a component and a set of semantic tokens already present in the implementation. If introducing a new primitive, explain why existing ones fail.
4. Produce an initial build with all specified states: default, focus, disabled when relevant, loading, empty, error, success, and high-content or long-text stress.
5. Audit the screen at minimum and maximum supported sizes, with keyboard navigation and increased text size. Capture any exceptions and record the reason.
6. Compare final behavior against the rules and checks below; convert failing checks into concrete remediation tasks before declaring completion.

## Failure patterns and trade-offs

- Repackaging publisher token tables
- Calling guessed values “official”
- Background and foreground roles mismatched
- Work item priority using unstable colors

## Acceptance checklist

- [ ] Semantic mappings documented
- [ ] No copied protected assets bundled
- [ ] Exact package licensing checked before dependency use
- [ ] Contrast tested

## Example ADI review language

- **Finding:** Describe the failing element and its observable behavior; avoid aesthetic-only criticism.
- **Impact:** Explain which task is slowed, hidden, obstructed, or made error-prone.
- **Proposed change:** Cite the matching ADI rule ID and supply a concrete UI or code change.
- **Validation:** Name the screen, viewport, assistive-technology/keyboard condition, and expected result.

## Canonical references

- https://atlassian.design/foundations
- https://atlassian.design/license

The URLs are links to publisher material, not permission to copy it. Any implementation claims must be checked against the live source and the versioned SDK or component package. See [Licensing](../00-GOVERNANCE/LICENSING.md) for reuse conditions.
