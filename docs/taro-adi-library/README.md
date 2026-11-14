# Taro Adaptive Design Intelligence (ADI) — reference library

**Edition:** 2026-11-14 | **Format:** portable Markdown reference packs | **Status:** independent design implementation guidance, not publisher documentation or agent-runtime integration.

## What this archive contains

A retrieval-oriented library of independently written UI/UX rules for Taro: **three ISO topic companions** (without ISO publication content), **five publisher design-system packs**, cognition and composition references, optional design-school lenses, an evidence and licensing policy, and implement/review quality gates. Sources are linked rather than mirrored.

**Important:** This is intentionally **not** the complete text of ISO standards, Apple HIG, Fluent 2, Material Design 3, Carbon or Atlassian ADS. Copyright and site-specific licenses do not automatically permit copying them into an AI knowledge base; an entire open-source code repository is likewise not reprinted here. The goal is extensive, actionable, reusable guidance that Taro can consult lawfully and transparently.

## Library map

```text
00-GOVERNANCE/   licensing, source index, retrieval, schema, integration
01-ISO/          three independent companions (edition- and range-labeled)
02-APPLE/        platforms, foundations, components, patterns, input
03-FLUENT/       foundations, tokens, components, interaction, content
04-MATERIAL/     base M3, tokens, components, adaptive, Expressive
05-CARBON/       foundations, components, enterprise patterns, charts, copy
06-ATLASSIAN/    foundations, tokens, components, work patterns, content
07-COGNITIVE/    Fitts, Hick, Jakob, Gestalt, memory, feedback
08-COMPOSITION/  hierarchy, grid, spacing, typography, color, motion, icons
09-DESIGN-SCHOOLS/ Swiss, Bauhaus, modernism, Rams, CRAP/CARP
10-QUALITY/      accessibility, screen review, comments, planning, rubric
11-EXAMPLES/     task-specific retrieval examples
manifest.json    metadata index for lazy loading
```

## Use it

1. Read `00-GOVERNANCE/LICENSING.md` and `00-GOVERNANCE/AGENT-RETRIEVAL.md`.
2. Inspect `manifest.json` and only retrieve the documents relevant to the current user task.
3. Record the selected document/rule IDs in the build plan before modifying code.
4. Implement using the *actual* project tokens and components; do not override user preferences just because a publisher pack exists.
5. Run real build and UI checks. Use `10-QUALITY/03-review-mode-comments.md` for actionable review feedback.
6. Report what was actually implemented, verified and left unresolved.

## Avoid model-context bloat

Do not paste the whole library into a system prompt. Index file titles/tags first, then retrieve **2–5 primary** chapters and **1–3** cross-cutting ones; keep selected rule IDs and citations in the task state. Read `00-GOVERNANCE/IMPORT-GUIDE.md`.

## Source integrity

- Every publisher chapter is original editorial prose with relevant source links, not reproduced official wording.
- Every ISO companion explicitly rejects claims of standards conformance.
- No publisher imagery, icons, Figma kits, token tables or typography assets are bundled.
- Open-source implementations and their licenses are linked in `00-GOVERNANCE/LICENSING.md`; confirm notices before copying or depending on code.
- Source references and policy review date: 2026-11-14.

## Taro runtime disclaimer

This archive **does not claim** to be installed, connected to tools, spawning subagents, automatically writing Tasks, or automatically adding Review-mode comments. Those behaviors require the actual Taro codebase and integration tests. The package provides a concrete contract for implementing them.
