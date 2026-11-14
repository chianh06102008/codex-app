# Taro ADI retrieval and selection contract

## Goal

Keep design knowledge out of the full-time system prompt. Select a small number of relevant Markdown chapters, enforce them through the task plan and review stages, and attach evidence to final work. These are **instructions for future Taro integration**; this ZIP does not modify Taro's code or guarantee that its agent currently follows them.

## Precedence (highest first)

1. Law, intellectual-property, platform policy, safe use, existing project constraints and user accessibility needs.
2. Explicit user request and existing project design-system/tokens.
3. Platform conventions (native Apple, Android, Microsoft-style web, etc.) and current component library.
4. Accessibility and functional usability review criteria.
5. Selected publisher design-system pack plus domain-specific cognitive rules.
6. Optional aesthetic direction or historical school.
7. Generic beautification advice (lowest priority).

## Deterministic selection strategy

1. Infer **target** (`web`, `desktop`, `ios`, `android`, `cross-platform`), **task class** (`dashboard`, `coding-tool`, `forms`, `consumer-app`, `work-management`, `data-viz`), **existing stack**, and **aesthetic intent**. Missing facts become assumptions in the plan.
2. If an existing source design system is installed, prefer that pack. If not, choose at most one **primary** publisher pack, based on user intent:
   - Apple-native → `02-APPLE`.
   - Microsoft productivity → `03-FLUENT`.
   - Android / Material → `04-MATERIAL`, with expressive **separately opted into**.
   - Enterprise analytics / charting → `05-CARBON`.
   - Atlassian-integrated work management → `06-ATLASSIAN` *only with license-aware integration*.
   - General React/web without explicit publisher → **no publisher imitation**; use the general composition and cognition packs.
3. Retrieve 2–5 files from that primary pack plus 1–3 cross-cutting files directly relevant to the task. Do not load the library wholesale.
4. Treat `01-ISO` as **independent companion heuristics**, never as licensed ISO text or as formal ISO conformance. Retrieve only if task relevance warrants.
5. Retrieve the appropriate `10-QUALITY` protocol as a final gate.
6. Resolve conflicts by explicit user/project constraints first, then by task success and accessibility; record every override.

## Required artifacts for each UI build

- `task-plan`: tasks, dependencies, target files, chosen pack IDs, component choices, validation stages.
- `design-decision-record`: why a layout was chosen, alternatives rejected and user constraints.
- `implementation`: the actual changed code plus state handling and tokens.
- `review`: screenshot/DOM/keyboard checks and linked rule IDs, including comment-mode findings.
- `delivery`: changed paths, test results and remaining limitations; no unsupported “everything works” claim.

## Invocation example

```text
Request: Design a compact desktop coding-agent session page in React.
Target: desktop web/Tauri; existing tokens: project CSS variables.
Select: 08-COMPOSITION/01-visual-hierarchy.md,
        08-COMPOSITION/03-spacing-density.md,
        08-COMPOSITION/07-iconography.md,
        07-COGNITIVE/06-feedback.md,
        10-QUALITY/02-screen-review.md.
Do not select Apple, Fluent, Material, Carbon, Atlassian automatically.
Task plan: identify files, build states, implement, screenshot test, keyboard test, log review.
```

## No silent reclassification

A locally authored ADI rule cannot become an “official ISO clause” or “Fluent 2 requirement.” Evidence type remains attached to the rule when the agent reports on it.
