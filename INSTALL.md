# Install Vaybel Skills

## Prerequisites

- Node.js 20 or newer.
- A Vaybel MCP PAT with catalog, brand DNA, credits, design, and mockup scopes.
- Network access to `https://mcp.vaybel.com/`.

Create a PAT in Vaybel at `Dashboard -> Settings -> MCP`, then export it:

```bash
export VAYBEL_PAT="vbl_pat_live_..."
```

Optional local/dev override:

```bash
export VAYBEL_MCP_URL="http://vaybel.localhost:8000/mcp/"
```

## Option 1: Plugin Marketplace

After the repo is listed in a marketplace:

```text
/plugin marketplace add vaybel/skills
/plugin install vaybel@vaybel
```

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
