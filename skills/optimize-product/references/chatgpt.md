---
name: optimize-product
description: Import or optimize an existing connected Printify or Printful product in Vaybel, or refresh its linked listing information.
---

# Improve an existing product

Use the connected Vaybel MCP tools. If Vaybel is disconnected, use the host's
connection flow. Authentication and account selection happen there; do not request
credentials in the conversation. Use the account's existing brand context.

For async operations, retain the returned handle and poll its status until terminal.
A long wait is not a reason to dispatch again. Use an idempotency key for a retry
of the same requested operation. Do not retry a failed generation automatically.
Keep implementation details out of normal progress messages. Report actual failures
briefly and leave internal evaluation/processing diagnostics out of customer copy.

Use `optimize.list_providers` and `optimize.list_provider_products` to identify the
requested connected product. A provider product ID differs from a Vaybel design ID;
use the IDs returned by the relevant reads.

Check `optimize.check_duplicate` before importing. Reuse an existing import unless
the user explicitly requests another. Call `optimize.run` only for the selected
product, then poll `optimize.get_generation` with its returned handle.
For an existing design's listing discovery, use `optimize.refresh_listing` when
requested. Report the persisted result and returned app link.

Do not publish listings or social posts as a side effect of optimization.
