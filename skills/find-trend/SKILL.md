---
name: vaybel:find-trend
version: 0.1.0
description: |
  Find a Vaybel product trend through the public MCP server. Use when the user
  wants trend discovery, ranked opportunities, seasonal or brand-fit trend
  review, or a launch concept for a trend. NOT for generating designs, mockups,
  listings, content, social publishing, or importing provider products.
argument-hint: [product-type] [--view all|brand|seasonal] [--match UUID] [--no-concept] [--limit N]
allowed-tools: Bash(npm *), Bash(node *), Read
metadata:
  hermes:
    tags: [vaybel, trend, discovery]
    requires_tools: [terminal]
required_environment_variables:
  - name: VAYBEL_PAT
    prompt: "Vaybel PAT (Dashboard -> Settings -> MCP)"
    required_for: "Vaybel MCP access"
---

# Vaybel Find Trend

Run this skill when the user wants to identify a product opportunity from
Vaybel's trend feed. The runner selects the best visible trend, fetches its
details, and generates a launch concept unless the user asks for trend review
only.

## Execution

Resolve `$PLUGIN_ROOT` as the absolute plugin root, then invoke:

```bash
npm --prefix "$PLUGIN_ROOT" run find-trend --
```

Pass through user-provided options:

```bash
npm --prefix "$PLUGIN_ROOT" run find-trend -- tshirt --view brand
npm --prefix "$PLUGIN_ROOT" run find-trend -- --match <trend-match-uuid>
npm --prefix "$PLUGIN_ROOT" run find-trend -- hoodie --view seasonal --seasonal-events --json
npm --prefix "$PLUGIN_ROOT" run find-trend -- --no-concept
```

Substitute the resolved absolute path for `$PLUGIN_ROOT` in the actual bash
call. If dependencies are missing, run `npm --prefix "$PLUGIN_ROOT" install`
once.

On **Hermes**, the skill dir is `${HERMES_SKILL_DIR}` and the plugin root is
`${HERMES_SKILL_DIR}/../..`. If the root is read-only (baked into an image), skip
`npm run` (it rebuilds) and call the prebuilt runner directly:
`node "${HERMES_SKILL_DIR}/../../dist/skills/find-trend/run.js" [product-type] --view brand --json`.

## Required Environment

- Recommended: `VAYBEL_PAT` is set once in the agent environment.
- Optional fallback: the Claude plugin `vaybel_pat` option.
- Optional: `VAYBEL_MCP_URL` or plugin option `mcp_url` for local/dev MCP.

Do not ask the user to paste a PAT in chat.

## Behavior

The runner will:

1. List ranked trend matches for the requested view/product type, or load the
   explicit `--match`.
2. Pick the highest non-dismissed trend when no match is supplied.
3. Generate and wait for a launch concept by default.
4. Return trend scores, the fit rationale, product UUIDs, concept prompts, and
   a dashboard link.

## Rules

- Call only the bundled runner. Do not call Vaybel APIs directly.
- Do not create designs, mockups, listings, or content from this skill.
- Use `/vaybel:launch-product` after the user chooses a trend product.
- Use `--no-concept` when the user only wants to browse opportunities.

## References

- Trend workflow details: `references/workflow.md`
- Options and boundaries: `references/options.md`
