# CLAUDE.md - Vaybel Skills

This repo contains Vaybel agent skills that run TypeScript orchestration code
against the public Vaybel MCP server.

## Architecture

```text
Skill -> run.ts -> servers/vaybel wrappers -> client.ts -> mcp.vaybel.com
```

There is no Vaybel CLI dependency in v1.

## Auth

`client.ts` reads `VAYBEL_PAT` and attaches it to MCP calls. Optional:
`VAYBEL_MCP_URL` overrides the default production endpoint.

## Skills

This repo ships four workflow skills that match the main Vaybel dashboard
workflows, plus one read-only insights skill:

```text
Find Trend
Launch Product
Optimize Product
Make Content
Analyze Insights
```

Keep skills aligned with the public MCP surface. Do not add private REST
fallbacks or Vaybel CLI calls.

## Validation

Run:

```bash
npm run validate
npm run typecheck
```

The validation script checks versions, manifests, frontmatter, references,
private API usage, and accidental CLI/curl patterns.
