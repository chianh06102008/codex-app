# Evidence, provenance and confidence

Every file in the publisher and ISO collections is **original editorial implementation guidance**. It does not reproduce source standards, claim publisher endorsement, or establish a compliance certification. Exact prescriptions in source publications may differ or evolve.

## Source labels

| Label | Meaning | Can Taro use as mandatory check? |
|---|---|---|
| `independent-implementation-guidance` | Taro-authored decisions | Yes, if selected by task policy, but **not** as a publisher requirement |
| `independent-companion-heuristics` | General heuristic associated with a restricted standard's subject area | Yes as independent quality guidance; never as ISO compliance |
| `official-link-only` | A current publisher URL, not locally ingested publisher content | No, link alone cannot establish detailed compliance |
| `versioned-package-metadata` | A dependency/version/license inspected in the target repo | Can validate implemented API names, not design quality |
| `verified-source-extract` | Authorized content imported separately under documented permissions | Only if permission explicitly covers AI use and the reviewed version |

## How to make a defensible claim

A proposed rule should have: (a) source/provenance; (b) observed UI failure or product need; (c) applicability; (d) test; (e) recorded result. Avoid vague claims such as “design quality improved by 65%” without actual measurement.

## Source freshness

These references were selected on 2026-11-14. Publisher docs, component release notes and license terms can change. A version pinned to a code library does *not* pin a live documentation website. Use explicit review dates and named component package versions in build reports.
