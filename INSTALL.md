# Install Vaybel Skills

## Prerequisites

- Node.js 20 or newer.
- A Vaybel MCP PAT with catalog, brand DNA, credits, design, and mockup scopes.
- Network access to `https://mcp.vaybel.com/`.

Create a PAT in Vaybel at `Dashboard -> Settings -> MCP`.

For Claude Code installs, prefer defining it once as `VAYBEL_PAT` in Claude Code
settings and reuse `${VAYBEL_PAT}` from the Vaybel MCP config. For manual
installs, export it:

```bash
export VAYBEL_PAT="vbl_pat_live_..."
```

Optional local/dev override:

```bash
export VAYBEL_MCP_URL="http://vaybel.localhost:8000/mcp/"
```

## Option 1: Claude Code Marketplace

Recommended setup:

```text
/plugin marketplace add vaybel/skills
/plugin install vaybel@vaybel
```

This reads `.claude-plugin/marketplace.json`, installs the `vaybel` plugin, and
exposes `/vaybel:launch-product`.

The plugin also accepts an optional sensitive `vaybel_pat` fallback, but do not
use it if MCP already works through `VAYBEL_PAT`.

## Option 2: Local Setup Script

```bash
git clone https://github.com/vaybel/skills.git
cd skills
npm install
./setup
```

The setup script symlinks this repo into the detected agent plugin location.

## Verify

In your agent, run:

```text
/vaybel:launch-product "minimal archive-style mountain race graphic"
```

The skill should call the Vaybel MCP server, generate a design, generate flat
mockups, and return a short summary with URLs.
