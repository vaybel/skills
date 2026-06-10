---
name: vaybel:analyze-insights
version: 0.2.0
description: |
  Get Vaybel shop insights through the public MCP server. Use when the user
  wants performance KPIs, channel breakdowns, top design snapshots, credit
  state, journey stage, streaks, revenue state, or next-best-action guidance.
  NOT for creating trends, products, designs, mockups, listings, content,
  social drafts, or publishing.
argument-hint: [--range 7d|28d] [--channel all|tiktok|etsy|shopify|instagram] [--sort gmv|orders|views] [--limit N]
allowed-tools: Bash(npm *), Bash(node *), Read
metadata:
  hermes:
    tags: [vaybel, insights, analytics]
    requires_tools: [terminal]
required_environment_variables:
  - name: VAYBEL_PAT
    prompt: "Vaybel PAT (Dashboard -> Settings -> MCP)"
    required_for: "Vaybel MCP access"
---

# Vaybel Analyze Insights

Run this skill when the user wants to understand what is happening in their
Vaybel account before deciding what to do next. This is a read-only skill: it
summarizes the Insights module and credit state, then points the user to the
dashboard.

## Execution

Resolve `$PLUGIN_ROOT` as the absolute plugin root, then invoke:

```bash
npm --prefix "$PLUGIN_ROOT" run analyze-insights --
```

Pass through user-provided options:

```bash
npm --prefix "$PLUGIN_ROOT" run analyze-insights -- --range 7d
npm --prefix "$PLUGIN_ROOT" run analyze-insights -- --channel tiktok --sort orders
npm --prefix "$PLUGIN_ROOT" run analyze-insights -- --limit 5 --json
npm --prefix "$PLUGIN_ROOT" run analyze-insights -- --no-designs --no-credits
```

Substitute the resolved absolute path for `$PLUGIN_ROOT` in the actual bash
call. If dependencies are missing, run `npm --prefix "$PLUGIN_ROOT" install`
once.

On **Hermes**, the skill dir is `${HERMES_SKILL_DIR}` and the plugin root is
`${HERMES_SKILL_DIR}/../..`. If the root is read-only (baked into an image), skip
`npm run` (it rebuilds) and call the prebuilt runner directly:
`node "${HERMES_SKILL_DIR}/../../dist/skills/analyze-insights/run.js" --range 28d --json`.

## Required Environment

- Recommended: `VAYBEL_PAT` is set once in the agent environment.
- Optional fallback: the Claude plugin `vaybel_pat` option.
- Optional: `VAYBEL_MCP_URL` or plugin option `mcp_url` for local/dev MCP.

Do not ask the user to paste a PAT in chat.

## Behavior

The runner will:

1. Read `insight.get_overview` for KPIs, deltas, channels, and narrative
   insights.
2. Read `insight.get_guidance` for next action, stage, revenue, and streak
   state.
3. Read `insight.list_design_performance` for top snapshot performers.
4. Read `credits.check` for the current billing/credit state (and `credits.list_usage` when the user asks where credits went).
5. Return an operator summary with caveats and a dashboard link.

## Rules

- Call only the bundled runner. Do not call Vaybel APIs directly.
- Treat top design performance as a truncated top-snapshot feed, not a full
  ranked inventory.
- If `has_data` is false, say that Insights has no meaningful period data yet.
- Do not infer that missing designs are poor performers.
- Use the four workflow skills when the user decides to act.

## References

- Insights workflow details: `references/workflow.md`
- Metrics and caveats: `references/metrics.md`
