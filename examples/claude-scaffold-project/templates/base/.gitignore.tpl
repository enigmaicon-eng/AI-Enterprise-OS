# Environment
.env
.env.*
!.env.example

# OS
.DS_Store
Thumbs.db

# Editors
.vscode/
.idea/
*.swp
*~

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
dist/
build/

# Python
__pycache__/
*.py[cod]
*$py.class
*.egg-info/
.pytest_cache/
.ruff_cache/
.mypy_cache/
venv/
.venv/
env/

# Private (per-project secrets / personal data / drafts).
# Use `private/*` not `private/` — git won't re-include subdirs of an
# ignored parent, so we ignore the contents and then re-include backlog.
private/*
!private/backlog/

data/
*.local

# Claude Code
.claude/worktrees/
