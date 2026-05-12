# Vaybel Skills

Vaybel Skills are agent workflows for launching clothing products through the
public Vaybel MCP server.

This repo follows the code-execution-with-MCP pattern:

```text
Agent skill -> TypeScript orchestration -> mcp.vaybel.com
```

There is no CLI dependency in v1. Skills call MCP through the small wrappers in
`servers/vaybel/`, authenticated by `VAYBEL_PAT`.

## Initial Skill

- `/vaybel:launch-product` - select a blank, generate a design, generate flat
  mockups, and return concise launch links.

The v1 scope is the MCP-backed slice of the app workflow:

```text
Product -> Design -> Mockups
```

`find-trend`, `optimize-product`, and `make-video` are intentionally deferred
until those public MCP surfaces exist.

## Setup - Recommended

Claude Code marketplace install:

```text
/plugin marketplace add vaybel/skills
/plugin install vaybel@vaybel
```

Use one shared secret for MCP and skills: define `VAYBEL_PAT` in Claude Code
settings, and reference it from the Vaybel MCP server config. Then run:

```text
/vaybel:launch-product "washed trail running poster art on a heavyweight tee"
```

## Manual Setup

```bash
git clone https://github.com/vaybel/skills.git
cd skills
npm install
export VAYBEL_PAT="vbl_pat_live_..."
./setup
```

## Repository Layout

```text
client.ts                    MCP transport and auth helper
servers/vaybel/              thin typed wrappers around public MCP tools
skills/launch-product/       SKILL.md plus TypeScript orchestration
.claude-plugin/              Claude Code marketplace metadata
.codex-plugin/               Codex plugin metadata
.cursor-plugin/              Cursor plugin metadata
scripts/validate.mjs         structural validation for skills and manifests
DEPLOYMENT.md                marketplace deployment checklist
```

## Validate

```bash
npm run validate
npm run typecheck
```
