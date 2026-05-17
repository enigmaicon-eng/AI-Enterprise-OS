"""Entry point for {{PROJECT_NAME}} MCP server.

Replace this skeleton with actual MCP tools as the project grows.
"""

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("{{PROJECT_NAME}}")


@mcp.tool()
def hello(name: str = "world") -> str:
    """Smoke tool — echoes a greeting."""
    return f"hello, {name}"


if __name__ == "__main__":
    mcp.run()
