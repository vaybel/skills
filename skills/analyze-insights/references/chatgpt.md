---
name: analyze-insights
description: Explain Vaybel account and design performance when the user asks about sales, channels, top designs or what to improve.
---

# Understand performance

Use the connected Vaybel MCP tools. If Vaybel is disconnected, use the host's
connection flow. Authentication and account selection happen there; do not request
credentials in the conversation. Use the account's existing brand context.

For a write that supports an idempotency key, choose a unique key on the first
request and retain it with the returned handle. Reuse the same key and unchanged
inputs only for the same request; a new key cannot recover an uncertain dispatch.
For async operations, retain the returned handle and poll its status until terminal.
A long wait is not a reason to dispatch again. Do not retry a failed generation
automatically or add a new key after an uncertain unkeyed request.
Keep implementation details out of normal progress messages. Report actual failures
briefly and leave internal evaluation/processing diagnostics out of customer copy.

Use `insight.get_overview` for the requested date range/channels,
`insight.list_design_performance` for available design snapshots, and
`insight.get_guidance` when next-step guidance helps answer the question.

Explain the actual range and relevant comparisons. A truncated top snapshot is
not a complete ranking. If meaningful period data is absent, say so; missing rows
do not prove poor performance. When `metric_coverage` is `partial`, a sales channel
or day did not report: present those totals as a floor, not a full count.
Distinguish observations from proposed explanations.

Read `credits.check`, `credits.list_costs` or `credits.list_usage` when the user
asks about allowance, costs or usage. Do not add credit commentary to unrelated
creation requests. This workflow is read-only; carry out follow-up changes only
when the user asks for them.
