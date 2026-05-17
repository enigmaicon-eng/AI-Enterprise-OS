# Intelligence Package Index

**System:** Research Intelligence Architecture
**Updated:** 2026-05-14
**Format:** Append new rows as investigations complete

---

## Active Intelligence Packages

| Date | Topic | Type | Confidence | Depth | Package |
|------|-------|------|------------|-------|---------|
| — | — | — | — | — | *(no packages yet — system initialized)* |

---

## Directory Structure

```
wiki/intelligence/
  INDEX.md                    ← This file — master index of all packages
  corpus/                     ← Evidence corpora (JSONL)
    full-docs/                ← Large document storage
  briefs/                     ← Research briefs (intake documents)
  context/                    ← Context memos and domain briefs
  lineage/                    ← Source lineage maps
  pipeline-health.md          ← Pipeline health metrics (auto-updated)
  [YYYY-MM-DD]-[slug]-intelligence-package.md  ← Completed packages
```

---

## Package Types

| Type | When Created | Audience |
|------|-------------|---------|
| Full Intelligence Package | Major investigations | All stakeholders |
| Intelligence Brief | Standard investigations | PM, Strategy |
| Signal Alert | Urgent competitive signals | Immediate recipients |
| Context Memo | Domain background research | Specific agents |
| Technical Brief | Architecture investigations | Architecture team |
| Market Brief | Market research | PM, Strategy, Business |
| Competitive Brief | Competitive analysis | PM, Strategy, Sales |

---

## How to Create an Investigation

1. Go to `research-intelligence/orchestrator.md`
2. Provide the research mandate
3. Orchestrator selects workflow and activates investigation
4. Intelligence package is written here when complete
5. New row added to this INDEX

## How to Find Prior Research

Search this INDEX by:
- Topic keyword
- Type (competitive, market, technical, org)
- Date range
- Confidence threshold

Or query `intelligence-memory/investigation-index.jsonl` for structured search.
