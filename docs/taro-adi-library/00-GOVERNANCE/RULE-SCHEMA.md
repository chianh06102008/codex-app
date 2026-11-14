# Markdown rule format for ingestion

## Source of truth

All `.md` documents contain a YAML frontmatter metadata block and stable rule IDs. A parser can ingest **headings**, **rules** and **acceptance checks** from the Markdown itself. The supplementary `manifest.json` lists paths and titles for a zero-content first pass.

## Expected rule fields

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Unique document ID |
| `pack` | string | Which system or foundational discipline owns the file |
| `content_kind` | enum | Original operational advice, independent standard companion |
| `source_text_included` | boolean | Must be `false` in this distribution |
| `requires_current_source_verification` | boolean | True for publisher-specific behavior |
| `standards_conformance_claim` | boolean | Must be false for ISO companion docs |

## Example normalized rule record

```json
{
  "id": "ADI-08-COMPOSITION-03_SPACING_DENSITY-01",
  "origin": "taro-original-guidance",
  "publisher_normative": false,
  "activation": {"task_class": ["dashboard", "coding-tool"]},
  "severity": "quality",
  "check": "Use a limited spacing scale with semantically meaningful steps",
  "test": "Compare gap values and grouping at two viewport sizes",
  "evidence": "screenshot+code-review",
  "result": "not-run"
}
```

The example ID above illustrates the schema; production ingestion should parse real IDs, not hardcode this example.

## Rule execution states

`selected` → `planned` → `implemented` → `verified-pass` / `verified-fail` / `unverified` / `not-applicable`. An agent must not report `verified-pass` for a rule that was merely read or referenced.

## Requirement severity

- `blocking`: legal/provenance conflict, required safety/accessibility functional failure, or loss of core task.
- `major`: important task degradation or inconsistent behavior.
- `minor`: polish issue or low-impact inconsistency.
- `suggestion`: optional aesthetic alternative with no evidence of failure.

Aesthetic opinions should not silently become blocking requirements.
