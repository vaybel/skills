# Plan Drop Workflow

The dashboard workflow is:

```text
Plan a drop -> pin the trends that fit -> launch concepts into it -> publish -> launch the drop
```

This skill covers planning, trend fit, pinning, and readiness. Design and
listing work stays with the launch-product skill; the drop files the results.

Expected MCP flow:

1. `drop.create` (name, kind, brief, target_date, optional `trend_id` /
   `trend_match_id` to pin and seed the brief) or `drop.get` for an existing
   drop
2. `drop.attach` for each `--attach-design` (entity_type `design`)
3. `drop.related_trends` — the workspace's trends ranked against the brief,
   pinned ones first; each row carries `reasons`, `pinned`, and
   `concept_match_id` (the keyword row whose launch concept opens the design
   flow)
4. `drop.pin_trend` for `--trend`, `--match`, or `--pin-top N`; a pin on an
   empty brief seeds it from the trend, keys the seller wrote are kept
5. Return the drop payload: `readiness.percent`, `readiness.checks`,
   `readiness.counts`, `readiness.products_detail`, `trends`, `channel_groups`

Readiness is derived, never stored. Drop-level steps: brief, launch date, at
least one product. Per product: design finished, at least one mockup, a live
listing. Content is reported but optional.

Related tools the runner does not call: `drop.list` (the workspace's drops),
`drop.update` (name, brief, date, launch or wrap). Use the dashboard for
launch and wrap so the seller confirms them.
