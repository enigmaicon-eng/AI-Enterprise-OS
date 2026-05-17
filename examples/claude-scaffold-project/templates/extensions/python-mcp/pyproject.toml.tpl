[project]
name = "{{PROJECT_NAME}}"
version = "0.1.0"
description = "{{SHORT_DESCRIPTION}}"
authors = [{ name = "{{AUTHOR}}" }]
requires-python = ">=3.11"
dependencies = [
    "mcp>=1.0.0,<2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "ruff>=0.5.0",
]

[tool.setuptools]
py-modules = ["server"]

[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]
