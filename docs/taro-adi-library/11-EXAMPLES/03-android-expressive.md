# Example — expressive Android consumer app

## Selection

- Base: `04-MATERIAL/01-foundations.md`, `02-tokens.md`, `03-components.md`.
- Adaptivity: `04-MATERIAL/04-adaptive.md`.
- Optional expressive layer: `04-MATERIAL/05-expressive.md`, only after checking product tone.
- Always test `10-QUALITY/01-accessibility-gate.md`.

## Decision record example

Expressive title shape is acceptable as brand expression in a welcome view; the high-frequency transactional form remains stable and easy to scan. The expanded tablet view uses more context rather than enlarging every mobile card. Transition timing will honor reduced-motion settings and current component library support.

## Actual verification needed

Check current Compose Material 3 release, APIs, device sizes, dynamic color behavior, font scaling and focus handling. This guidance is not a substitute for version-specific library docs.
