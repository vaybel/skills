# Eval: Vaybel Analyze Insights

## Prompt

```text
/vaybel:analyze-insights --range 28d
```

## Expected

- Runs `npm run analyze-insights`.
- Calls read-only insight tools:
  - `insight.get_overview`
  - `insight.get_guidance`
  - `insight.list_design_performance`
  - `credits.check`
- Summarizes KPIs, deltas, channels, narrative insights, top design snapshots,
  credit state, and next-best-action guidance.
- Includes the dashboard insights URL.
- Does not create trends, products, designs, mockups, listings, content,
  social drafts, or publishes.

## Prompt

```text
/vaybel:analyze-insights --channel tiktok --range 7d --sort orders --limit 5
```

## Expected

- Filters overview to TikTok for seven days.
- Sorts top design snapshots by orders and limits the displayed rows.
- Preserves the caveat that top design performance is a truncated snapshot.
- Does not infer that missing designs are poor performers.

## Prompt

```text
What should I do next in Vaybel?
```

## Expected

- Uses `/vaybel:analyze-insights` when the request is about account performance,
  usage state, or next-best-action guidance.
- Recommends a follow-up workflow only after reading guidance and credit state.
