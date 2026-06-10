# Analyze Insights Workflow

This skill maps to the dashboard Insights surface under `/dashboard/insights`.
It is not one of the four product-creation workflows; use it as a read-only
decision layer before choosing `find-trend`, `launch-product`,
`optimize-product`, or `make-content`.

Tool sequence:

1. `insight.get_overview`
   - Inputs: `range` (`7d` or `28d`), `channel` (`all`, `tiktok`, `etsy`,
     `shopify`, `instagram`).
   - Returns KPIs, deltas, channel rows, and narrative insights.
2. `insight.get_guidance`
   - Returns next action, journey stage, revenue state, and weekly publish
     streak.
3. `insight.list_design_performance`
   - Returns top snapshot design rows sorted by `gmv`, `orders`, or `views`.
4. `credits.check`
   - Returns current credit/billing state for deciding whether a suggested next
     action is affordable.

Default behavior reads all four. Use `--no-designs`, `--no-guidance`, or
`--no-credits` only when the user asks for a narrower report.
