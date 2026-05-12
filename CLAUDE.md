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

## Initial Scope

Only `skills/launch-product` is real in v1. It covers:

```text
Product -> Design -> Mockups
```

Do not add placeholder skills for `find-trend`, `optimize-product`, or
`make-video` until their public MCP tool surfaces exist.

## Validation

Run:

```bash
npm run validate
npm run typecheck
```

The validation script checks versions, manifests, frontmatter, references,
private API usage, and accidental CLI/curl patterns.
