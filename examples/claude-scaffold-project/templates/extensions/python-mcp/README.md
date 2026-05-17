# Extension: python-mcp

Python MCP server scaffold.

## Includes

- `pyproject.toml` — Python 3.11+, `mcp` SDK, optional dev deps (`pytest`, `ruff`).
- `server.py` — FastMCP entry point with a `hello()` smoke tool.
- `tests/test_smoke.py` — pytest smoke test.

## When to attach

- New MCP servers in Python.
- Python scripts that should be exposed to Claude as MCP tools.
- Standalone Python utilities (drop the `mcp` dep if only running locally).

## Env vars

None at scaffold time. Add to `.env.example` when first secret appears.

## Smoke check after scaffold

```bash
cd <project>
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
```

Expected: 1 passing test (`test_hello_smoke`).
