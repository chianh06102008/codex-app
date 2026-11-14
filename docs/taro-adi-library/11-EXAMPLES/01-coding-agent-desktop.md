# Example — restrained desktop coding-agent app

## Brief

- Product: session-based coding agent with project creation and recent sessions.
- Stack assumption: React/TypeScript/Tauri desktop, project-provided design tokens.
- Direction: compact, modern, restrained, without ornamental AI iconography.

## Retrieval

1. `08-COMPOSITION/01-visual-hierarchy.md`
2. `08-COMPOSITION/03-spacing-density.md`
3. `08-COMPOSITION/07-iconography.md`
4. `07-COGNITIVE/06-feedback.md`
5. `10-QUALITY/02-screen-review.md`

## Proposed structure

- Primary command bar: new/open project, recent entry point, global search if supported.
- Project cards: useful metadata and concise action; avoid ornamental empty cards.
- Session list: timestamp, project, task summary, status, recovery actions.
- Agent execution view: distinguish queued/running/complete/failed; show verified action log.
- Review mode: enable anchored comments with evidence and exact element/line mapping.

## Risks and tests

- Check narrow window and long repository paths.
- Verify keyboard focus for all row actions and menus.
- Ensure background agent work does not show false completion.
- Capture actual screenshots after implementation before any claim of “designer-grade.”
