# Find Trend Workflow

The dashboard workflow is:

```text
Find Trend -> Launch Concept -> Launch Product
```

This skill covers the trend and concept segment only.

Expected MCP flow:

1. `trend.list` (named trends, ranked by `trend_score`) or `trend.get` for an
   explicit named trend
2. `trend.get` returns `keywords[]` — concepts are keyword-scoped, so pick a
   keyword `id` (the runner prefers the requested product type, else the
   strongest keyword)
3. `trend.generate_concept` when that keyword has no concept yet
4. Poll `trend.get_generation` with `wait_sec` (the server caps a single
   long-poll at 50s; the runner re-polls until done)
5. Return dashboard and launch-product inputs

`trend.list_keywords` / `trend.get_keyword` expose the raw keyword feed when
the user explicitly wants per-keyword metrics instead of named trends.

Do not continue into product design generation unless the user explicitly
invokes the launch-product skill.
