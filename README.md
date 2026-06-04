# Vaybel Skills

Vaybel Skills are agent workflows for operating clothing-product workflows
through the public Vaybel MCP server.

This repo follows the code-execution-with-MCP pattern:

```text
Agent skill -> TypeScript orchestration -> mcp.vaybel.com
```

There is no CLI dependency in v1. Skills call MCP through the small wrappers in
`servers/vaybel/`, authenticated by `VAYBEL_PAT`.

## Skills

- `/vaybel:find-trend` - find a trend opportunity and generate a launch
  concept.
- `/vaybel:launch-product` - select a blank, generate a design, generate
  listing-ready mockups, and return concise launch links.
- `/vaybel:optimize-product` - import and optimize an existing Printify or
  Printful product.
- `/vaybel:make-content` - generate a video, slideshow, carousel, or single
  post for an existing listing, with social drafts and explicit publish.
- `/vaybel:analyze-insights` - read performance KPIs, top design snapshots, credit
  state, and next-best-action guidance.

The scope matches the four primary Vaybel workflows:

```text
Find Trend -> Launch Product -> Optimize Product -> Make Content
```

`analyze-insights` is a read-only management skill for deciding which workflow to
run next.

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
/vaybel:find-trend tshirt --view brand
/vaybel:optimize-product --provider printify --product-id <external-id>
/vaybel:make-content <listing-id> --channels tiktok,instagram
/vaybel:analyze-insights --range 28d
```

## Manual Setup

```bash
git clone https://github.com/vaybel/skills.git
cd skills
npm install
export VAYBEL_PAT="<your-vaybel-pat>"
./setup
```

## Repository Layout

```text
client.ts                    MCP transport and auth helper
servers/vaybel/              thin typed wrappers around public MCP tools
skills/*/                    SKILL.md plus TypeScript orchestration per workflow
.claude-plugin/              Claude Code marketplace metadata
.codex-plugin/               Codex plugin metadata
.cursor-plugin/              Cursor plugin metadata
scripts/validate.mjs         structural validation for skills and manifests
scripts/smoke/               clean-project host install smoke tests
DEPLOYMENT.md                marketplace deployment checklist
```

## Validate

```bash
npm run validate
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=moderate
scripts/smoke/host_install_smoke.sh
```

The smoke script creates a clean sibling project, installs the plugin into
isolated Claude and Codex homes when those CLIs are available, and runs every
skill runner in no-token mode. It uses `tmux` automatically when installed;
pass `--no-tmux` to run serially.
