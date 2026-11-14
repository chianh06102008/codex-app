# Importing this library into Taro

This archive is a **knowledge pack**, not a patch to Taro's agent runtime. A working integration must be added to the local project by its developer and tested against actual runtime behavior.

## Recommended runtime layers

1. **Registry:** read `manifest.json` and frontmatter to load only titles, tags, paths and source types into memory.
2. **Retriever:** select a bounded set of Markdown chapters using task context; apply legal and source restrictions.
3. **Planner:** attach chosen rule IDs to work packages, affected code paths and tests.
4. **Implementer:** translate rules into actual components/tokens and state handling; avoid adding unsupported UI capabilities.
5. **Reviewer:** compare screen/function against selected criteria; create anchored, actionable Review-mode comments.
6. **Verifier:** run build/lint/typecheck/unit/e2e where supported and mark each criterion pass/fail/unverified.
7. **Reporter:** output exact changed files, checks run, rule coverage, and unresolved issues.

## Context-efficiency guardrails

- First retrieval: registry metadata only.
- Second retrieval: 2–5 directly applicable chapters plus 1–3 cross-cutting quality chapters.
- Chunk by document headings if needed; do not concatenate all files into every turn.
- Cache retrieved content with content SHA-256 and invalidate upon file update.
- Keep references to `id`, `path`, `heading`, `source URL` and `content_kind` in task summaries.
- Preserve important user constraints, design decisions and verified results across compaction.

## Repository placement

A reasonable destination in a Tauri/React application is `<repo>/resources/adi/` or `<repo>/src/agent/knowledge/adi/`; choose only after inspecting the actual project structure. The ZIP intentionally avoids inventing Taro source files or claiming that an endpoint/subagent is already present.

## Suggested integration tests

1. Ask for a Material Android form; confirm Material is selected and Apple is not.
2. Ask for a generic desktop coding tool; confirm publisher packs are not imposed without reason.
3. Ask for “ISO 9241 certification”; confirm the agent refuses to claim it from this library.
4. Ask for a dense analytics screen; confirm data-viz and information-density chapters are retrieved.
5. Ask the agent to generate an actual review comment; confirm it attaches target element, evidence, rule ID and suggested correction.
6. Insert a broken reference and verify the agent reports `unverified`, not a fabricated citation.

## Versioning

Treat this ZIP as `taro-adi-reference-2026-11-14`. Each future update should provide a changelog, rule IDs, current source metadata and a licensing recheck.
