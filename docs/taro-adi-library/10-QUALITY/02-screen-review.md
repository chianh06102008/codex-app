# Multi-pass designer-grade screen review

## Pass 1 — functional correctness

- Identify the primary task; follow it from entry to completed outcome.
- Record loading, empty, error, success and cancellation paths.
- Ensure controls actually perform their labeled actions.
- Check that data displayed is correctly sourced and not a decorative placeholder.

## Pass 2 — information architecture

- Can a new user locate the main command or object without instructions?
- Are navigation, creation, history and settings grouped in a recognizable way?
- Do names and action semantics remain stable across screens?
- Does collapsing a sidebar or opening a modal preserve orientation?

## Pass 3 — visual system

- Are type styles, semantic colors, spacing intervals, borders and radii consistent?
- Does the layout use stable alignment anchors and task-appropriate density?
- Are icons from a coherent family and do they carry actual information?
- Are shadows, gradients, images and motion justified by function?

## Pass 4 — stress tests

- Use realistic long filenames, empty lists, 100+ rows, permission errors and multi-line labels.
- Test compact and wide windows, light/dark themes, keyboard, zoom and reduced motion.
- Verify sticky bars, bottom sheets and dialogs do not obscure the main action.
- Check focus restoration and lost-work behavior.

## Pass 5 — evidence and remediation

- Group findings as blocking, major, minor or suggestion.
- For each finding, attach screenshot/DOM evidence, rule ID, exact location and a specific fix.
- Rerun the failed scenario after implementing changes.
- Record remaining issues; never claim quality solely from “looks premium.”

## Suggested output

```text
Screen: Session history
Build: 91a2…   Theme: dark   Viewport: 1366×768
Selected packs: density, visual hierarchy, iconography, feedback
PASS: navigation reveals recent sessions
FAIL: keyboard focus invisible in session row 3
Rule: ADI-08-COMPOSITION-07_ICONOGRAPHY-05 (example) / accessibility gate
Fix: visible outline using project focus token; confirm keyboard activation
Retest: pending
```
