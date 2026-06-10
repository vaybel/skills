---
name: vaybel:find-trend
version: 0.2.0
description: |
  Find a Vaybel product trend through the public MCP server. Use when the user
  wants trend discovery, ranked opportunities, seasonal or brand-fit trend
  review, or a launch concept for a trend. NOT for generating designs, mockups,
  listings, content, social publishing, or importing provider products.
argument-hint: [product-type] [--lifecycle emerging|rising|peak|declining] [--type TYPE] [--trend UUID] [--match UUID] [--no-concept] [--limit N]
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
Vaybel's trend feed. Trends are NAMED clusters with a story ("Coastal Grandma
Revival"), a lifecycle stage, and keyword children. The runner picks the
strongest named trend, drills into its best keyword, and generates a launch
concept unless the user asks for trend review only.

## Execution

Resolve `$PLUGIN_ROOT` as the absolute plugin root, then invoke:

```bash
npm --prefix "$PLUGIN_ROOT" run find-trend --
```

Pass through user-provided options:

```bash
npm --prefix "$PLUGIN_ROOT" run find-trend -- tshirt --lifecycle rising
npm --prefix "$PLUGIN_ROOT" run find-trend -- --trend <named-trend-uuid>
npm --prefix "$PLUGIN_ROOT" run find-trend -- --match <keyword-uuid>
npm --prefix "$PLUGIN_ROOT" run find-trend -- hoodie --seasonal-events --json
npm --prefix "$PLUGIN_ROOT" run find-trend -- --no-concept
```

Substitute the resolved absolute path for `$PLUGIN_ROOT` in the actual bash
call. If dependencies are missing, run `npm --prefix "$PLUGIN_ROOT" install`
once.

On **Hermes**, the skill dir is `${HERMES_SKILL_DIR}` and the plugin root is
`${HERMES_SKILL_DIR}/../..`. If the root is read-only (baked into an image), skip
`npm run` (it rebuilds) and call the prebuilt runner directly:
`node "${HERMES_SKILL_DIR}/../../dist/skills/find-trend/run.js" [product-type] --lifecycle rising --json`.

## Required Environment

- Recommended: `VAYBEL_PAT` is set once in the agent environment.
- Optional fallback: the Claude plugin `vaybel_pat` option.
- Optional: `VAYBEL_MCP_URL` or plugin option `mcp_url` for local/dev MCP.

Do not ask the user to paste a PAT in chat.

The org needs the **Starter plan or higher** — gated calls fail with a `plan_required:` error; surface the upgrade path instead of retrying.

## Behavior

The runner will:

1. List named trends (strongest first), optionally filtered by `--lifecycle`
   or `--type`; or load an explicit `--trend` (named) / `--match` (keyword).
2. Pick the top named trend and read its detail: story, why-now, design
   direction, momentum, and keyword children.
3. Pick the best keyword (matching the product type when given) and generate /
   wait for its launch concept by default. Concept generation costs 2 credits
   on first dispatch; cached concepts are free.
4. Return the trend story, keyword scores, product UUIDs, concept prompts, and
   a dashboard link.

## Rules

- Call only the bundled runner. Do not call Vaybel APIs directly.
- Do not create designs, mockups, listings, or content from this skill.
- Use `/vaybel:launch-product` after the user chooses a trend product.
- Use `--no-concept` when the user only wants to browse opportunities.

## References

- Trend workflow details: `references/workflow.md`
- Options and boundaries: `references/options.md`
