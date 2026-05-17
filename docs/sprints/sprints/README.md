---
type: directory-readme
layer: sprints
created: 2026-05-09
owner: delivery-agent
---

# Sprints

Sprint execution records for the Enterprise AI OS.

## Directory Structure

```
sprints/
├── README.md          ← This file
└── sprint-NNN/        ← One directory per sprint
    ├── sprint-plan.md     ← Created at sprint planning
    ├── sprint-review.md   ← Created at sprint close
    └── retro.md           ← Created at retrospective
```

## How to Start a Sprint

1. Determine sprint number (next sequential after last sprint in this directory)
2. Create `sprints/sprint-NNN/` directory
3. Run `playbooks/sprint-playbook.md §① Sprint Planning`
4. Create `sprints/sprint-NNN/sprint-plan.md` using `templates/sprint-template.md`
5. Answer the 5 blocking open questions (if still open) as first sprint input

## Current Sprint Status

No sprints have been run yet. The system is in pre-operational state.

First sprint can begin once Q-001 through Q-005 in `memory/open-questions.md` are answered.

## Sprint Conventions

- Sprint numbering starts at 001 (zero-padded to 3 digits)
- Sprint plans are finalized before the sprint begins — no retroactive planning
- Sprint reviews include DORA metric snapshot
- Retrospective action items must be tracked and verified at next sprint's retro
- Every sprint closes with a wiki-maintenance step

## Relationship to Workflows

| Action | Workflow / Playbook |
|--------|-------------------|
| Plan sprint | `playbooks/sprint-playbook.md` + `templates/sprint-template.md` |
| Execute features | `workflows/feature-development.md` |
| Review sprint | `playbooks/sprint-playbook.md §③` |
| Retrospective | `playbooks/sprint-playbook.md §④` + `templates/retro-template.md` |
