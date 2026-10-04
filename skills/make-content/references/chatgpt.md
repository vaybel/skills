---
name: make-content
description: Create promotional videos, carousels, images or social drafts for an existing Vaybel product, and publish a chosen social post only when explicitly requested.
---

# Make product content

Use the connected Vaybel MCP tools. If Vaybel is disconnected, use the host's
connection flow. Authentication and account selection happen there; do not request
credentials in the conversation. Use the account's existing brand context.

For async operations, retain the returned handle and poll its status until terminal.
A long wait is not a reason to dispatch again. Use an idempotency key for a retry
of the same requested operation. Do not retry a failed generation automatically.
Keep implementation details out of normal progress messages. Report actual failures
briefly and leave internal evaluation/processing diagnostics out of customer copy.

Resolve the existing listing/design using the available saved context and read
tools. Use `content.generate` for requested video, slideshow, carousel or single
image content; follow the current tool schema for supported formats and inputs.
For formats using existing photos, reuse the selected saved image URLs. Poll the
same handle with `content.get` until it is ready, then show the actual artifact.

Use `social_post.generate` for requested channel-specific drafts, `social_post.get`
to retrieve a saved draft and `social_post.update` for revisions. Publish with
`social_post.publish` only when the user explicitly asks to publish the chosen
post to the chosen channel. Report queued/publishing separately from published.
Never silently repeat a provider publication after an ambiguous result.

A draft request does not authorize publishing. Return the saved content/draft link
and concise relevant outcome, without inventing reach, engagement or sales.
