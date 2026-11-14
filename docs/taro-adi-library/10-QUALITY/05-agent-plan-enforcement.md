# Plan → implement → audit → report

This is a proposed enforcement contract for Taro. It is not wired to the runtime by this package.

## Before implementation

- Identify file targets and actual present functions/components from repository inspection.
- Create a small, testable build plan with dependencies.
- Select relevant ADI documents, preserving publisher/provenance metadata.
- Define expected states and test strategy. If source code is unavailable, do not invent exact paths.

## During implementation

- Update the task log when actions begin and finish.
- Call the actual supported tools, not presumed tools.
- Spawn design/implementation/review subagents only when runtime truly supports them and task parallelism justifies it.
- Keep project code and tokens authoritative over borrowed aesthetics.
- Track any deviations from the chosen rule IDs.

## After implementation

- Run typecheck, lint and tests present in the repository.
- Build and inspect rendered UI where executable tooling is available.
- Create or update Review-mode comments with actual locations and validation.
- Provide a per-work-package completion table linked to changed files.
- Explicitly report untested paths, missing tools or unknown behavior.

## Quality gates

- **Gate A:** user task and context specified.
- **Gate B:** implementation matches existing runtime architecture.
- **Gate C:** primary interaction and edge states tested.
- **Gate D:** selected visual/system rules reviewed and defects addressed.
- **Gate E:** final report contains verifiable evidence and no unsupported compliance claim.
