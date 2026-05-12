# Contributing

Vaybel Skills are code-on-MCP workflows. Keep changes small, auditable, and
aligned with the public Vaybel MCP surface.

## Rules

- Skills call MCP from TypeScript code.
- Skills do not shell out to a Vaybel CLI.
- Skills do not call private REST APIs.
- Do not add workflow skills unless the required public MCP tools exist.
- Keep `SKILL.md` under 300 lines.
- Keep root `VERSION`, package version, skill versions, and plugin manifest
  versions in sync.
- Wrapper files in `servers/vaybel/` must remain thin and tool-shaped.

## Checks

```bash
npm run validate
npm run typecheck
```

## Adding a Skill

1. Add `skills/<workflow>/SKILL.md` and `skills/<workflow>/run.ts`.
2. Add or reuse wrappers in `servers/vaybel/`.
3. Update `.claude-plugin/marketplace.json`.
4. Update `README.md`, `COOKBOOK.md`, and `DEPLOYMENT.md` if install or launch
   behavior changes.
5. Run validation and typecheck.
