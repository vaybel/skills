---
name: find-trend
description: Find clothing trends and seasonal opportunities in Vaybel when the user asks for research or ideas for their brand.
---

# Find clothing trends

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

Use `trend.list` with the requested product type and lifecycle. Return a short
list of named trends with useful design directions. Keyword rows support a trend;
they are not extra trend choices. Do not turn a peak trend into a rising trend.
If the requested slice is empty, say so and offer available alternatives.

Read `trend.get` for a chosen trend. Use its returned keyword IDs when continuing
to a saved design; never pass a named trend UUID where a keyword ID is required.
Use `trend.list_seasonal_events` for timing questions. Use keyword detail only when
it helps answer the request. Internal ranking scores are not customer explanations.

Browsing trends does not request concept or image generation. Generate a launch
concept with `trend.generate_concept` only when the user requests one; follow its
returned handle. If they ask to create a design, continue with the saved-design
workflow directly using the selected trend direction and valid product choice.
