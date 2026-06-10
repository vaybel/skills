---
name: vaybel:optimize-product
version: 0.2.0
description: |
  Optimize an existing Printify or Printful product through the public Vaybel
  MCP server. Use when the user wants to import a connected provider product,
  check duplicate imports, list importable provider products, or refresh linked
  marketplace listing discovery. NOT for trend discovery, creating new designs
  from a blank, mockup-only generation, content creation, or social publishing.
argument-hint: --provider printify|printful --product-id ID [--shop-id ID] [--refresh-listing] [--list]
allowed-tools: Bash(npm *), Bash(node *), Read
metadata:
  hermes:
    tags: [vaybel, optimize, import]
    requires_tools: [terminal]
required_environment_variables:
  - name: VAYBEL_PAT
    prompt: "Vaybel PAT (Dashboard -> Settings -> MCP)"
    required_for: "Vaybel MCP access"
---

# Vaybel Optimize Product

Run this skill when the user wants Vaybel to ingest and optimize an existing
Printify or Printful product from a connected account.

## Execution

Resolve `$PLUGIN_ROOT` as the absolute plugin root, then invoke:

```bash
npm --prefix "$PLUGIN_ROOT" run optimize-product -- --provider printify --product-id <external-id>
```

Pass through user-provided options:

```bash
npm --prefix "$PLUGIN_ROOT" run optimize-product -- --provider printful --product-id <external-id>
npm --prefix "$PLUGIN_ROOT" run optimize-product -- --provider printify --shop-id <shop-id> --list
npm --prefix "$PLUGIN_ROOT" run optimize-product -- --design-id <design-uuid> --refresh-listing
npm --prefix "$PLUGIN_ROOT" run optimize-product -- printify <external-id> --json
```

Substitute the resolved absolute path for `$PLUGIN_ROOT` in the actual bash
call. If dependencies are missing, run `npm --prefix "$PLUGIN_ROOT" install`
once.

On **Hermes**, the skill dir is `${HERMES_SKILL_DIR}` and the plugin root is
`${HERMES_SKILL_DIR}/../..`. If the root is read-only (baked into an image), skip
`npm run` (it rebuilds) and call the prebuilt runner directly:
`node "${HERMES_SKILL_DIR}/../../dist/skills/optimize-product/run.js" --provider printify --product-id <id> --json`.

## Required Environment

- Recommended: `VAYBEL_PAT` is set once in the agent environment.
- Optional fallback: the Claude plugin `vaybel_pat` option.
- Optional: `VAYBEL_MCP_URL` or plugin option `mcp_url` for local/dev MCP.

Do not ask the user to paste a PAT in chat.

The org needs the **Growth plan** — gated calls fail with a `plan_required:` error; surface the upgrade path instead of retrying.

## Behavior

The runner will:

1. List connected providers or provider products when `--list` is used.
2. Check whether the provider product is already imported.
3. Skip duplicate imports unless `--force` is supplied.
4. Dispatch `optimize.run` and wait for completion.
5. Return design/listing IDs and the dashboard URL.

## Rules

- Call only the bundled runner. Do not call Vaybel APIs directly.
- Require an explicit provider product ID before importing.
- Do not create social content or publish marketplace listings.
- Use `--refresh-listing` for an already imported design when marketplace
  listing discovery needs to be re-run.

## References

- Optimize workflow details: `references/workflow.md`
- Provider options: `references/provider-products.md`
