---
name: analyze-insights
description: Explain Vaybel account and design performance when the user asks about sales, channels, top designs or what to improve.
---

# Understand performance

Use the connected Vaybel MCP tools. If Vaybel is disconnected, use the host's
connection flow. Authentication and account selection happen there; do not request
credentials in the conversation. Use the account's existing brand context.

For async operations, retain the returned handle and poll its status until terminal.
A long wait is not a reason to dispatch again. Use an idempotency key for a retry
of the same requested operation. Do not retry a failed generation automatically.
Keep implementation details out of normal progress messages. Report actual failures
briefly and leave internal evaluation/processing diagnostics out of customer copy.

Use `insight.get_overview` for the requested date range/channels,
`insight.list_design_performance` for available design snapshots, and
`insight.get_guidance` when next-step guidance helps answer the question.

Explain the actual range and relevant comparisons. A truncated top snapshot is
not a complete ranking. If meaningful period data is absent, say so; missing rows
do not prove poor performance. Distinguish observations from proposed explanations.

Read `credits.check`, `credits.list_costs` or `credits.list_usage` when the user
asks about allowance, costs or usage. Do not add credit commentary to unrelated
creation requests. This workflow is read-only; carry out follow-up changes only
when the user asks for them.
