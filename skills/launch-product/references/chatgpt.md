---
name: launch-product
description: Create or edit saved clothing designs and product mockups in Vaybel when the user asks to turn an idea into apparel or improve an existing design.
---

# Create a saved clothing design

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

Find a suitable garment using `catalog.list_blanks`. Use `catalog.get_blank` or
`catalog.compare_blanks` when garment facts or a comparison matter. Reuse a product
already selected in this conversation or the app panel. Ask only for a missing
choice that materially affects the requested result.

Call `design.generate` for a new saved design, or `design.edit` with the selected
saved design for an edit. Preserve the user's requested placements, wording and
intent. A request for an image does not imply invented slogans, coordinates or
microtext. Do not add exact lettering requirements the user did not request.
A standalone host image is not a saved Vaybel design.

After `design.get_generation` completes, use the returned saved ID/next action to
read `design.get` once. Show the saved product previews, with their available view
labels, and the returned Vaybel link. Raw artwork is an explicit-request view.
Do not generate mockups just to display product previews already returned.
If a gallery is available, avoid duplicate Markdown images or graphic descriptions.
If the host has no gallery support, provide labeled links to the returned images.

When the user requests mockups, call `mockup.generate` for that saved design,
using Pro by default and the requested shot types. Poll the same batch handle;
then display the completed IDs together with `mockup.show`. Reuse saved mockups
for a request to view existing images. An unavailable option or failed result is
not permission to silently substitute a different quality or start another batch.

Creating a design or mockups does not publish a store listing. Prepare listings
only when requested; publishing requires the user's explicit instruction for the
intended channel/product. Use returned URLs rather than constructing dashboard paths.
