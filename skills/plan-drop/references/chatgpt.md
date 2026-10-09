---
name: plan-drop
description: Organize Vaybel designs into a collection or drop when the user asks to plan a launch, arrange existing products, or connect trends to a collection.
---

# Plan a drop

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

Use `drop.list` and `drop.get` to find an existing drop before creating a duplicate.
Use `drop.create` for a requested new collection and `drop.update` for its brief,
name or timing. Keep unknown dates unset rather than inventing a launch date.

Use `drop.attach` to attach the user's selected designs. Confirm the selected IDs
from the conversation or saved app state. Read `drop.related_trends` for ideas;
use `drop.pin_trend` only for trends the user chooses to add.

Return the saved drop and its current readiness using actual data. Planning a drop
does not request paid concept/design generation or store/social publication.
