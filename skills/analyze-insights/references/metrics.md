# Metrics And Caveats

- `range`: Insights supports `7d` and `28d`.
- `channel`: Use `all` unless the user names TikTok, Etsy, Shopify, or
  Instagram.
- `kpis`: Overview-level orders, GMV, views, and CVR for the selected channel.
- `deltas`: Period-over-period percent changes. Do not present them as absolute
  metric values.
- `per_channel`: Channel breakdown rows. Use them to compare channels, not to
  infer platform health beyond the selected period.
- `insights`: Narrative rows from the platform. Preserve the caveat/severity
  when present.
- `top_designs`: The design-performance source is a top-10 snapshot, not a full
  inventory ranking. Missing designs are unknown, not necessarily bad.
- `guidance.next_action`: Suggested next best action. Check `requires_credits`
  and current credit state before recommending an expensive workflow.
- `has_data=false`: Say there is not enough meaningful period data yet; then
  fall back to guidance and credits.
