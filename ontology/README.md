---
layer: ontology
version: 1.0.0
created: 2026-05-09
status: active
owner: architect-agent
---

# Ontology

The Enterprise AI OS ontology is the shared vocabulary layer. It defines what terms mean precisely, how concepts relate, and how the system classifies artifacts, agents, and workflows.

Without a shared ontology, agents use the same words to mean different things. "Workflow" and "playbook" blur. "Artifact" is used for both a document and a code output. "Quality gate" might mean a checklist or a blocking review. The ontology resolves this.

---

## Why Ontology Matters in an AI-Native System

In a human organization, shared vocabulary develops through repeated interaction. In an AI-native system, each agent session starts with no shared context. The ontology is the vocabulary that must be loaded into every session — it is a core component of minimum viable context.

**Rule:** When a term in the ontology is used in an artifact, it must match the ontology definition. If a new term is needed, it must be added to the ontology before being used in governance-critical contexts.

---

## Directory Structure

```
ontology/
├── README.md              ← This file
├── core-concepts.md       ← Foundational terms and their definitions
├── artifact-taxonomy.md   ← Classification of all artifact types
├── agent-vocabulary.md    ← Agent roles, capabilities, and boundaries
└── workflow-vocabulary.md ← Workflow, playbook, and process terms
```

---

## Governance of the Ontology

- Adding terms: any agent may propose a term via RFC; architect-agent approves
- Changing terms: requires ADR if the change affects existing governance docs
- Deleting terms: requires checking all existing artifacts that use the term
- Conflicting definitions: architect-agent is the tie-breaker; conflicts are escalated via RFC

## Versioning

The ontology is versioned. Breaking changes (term redefinitions that change meaning) increment the minor version. Non-breaking additions increment the patch version. The current version is tracked in this file's frontmatter.

## Loading Rule

Agents handling cross-org or governance-critical work should load `ontology/core-concepts.md` as part of their context package. For AI feature work, also load `ontology/agent-vocabulary.md`.
