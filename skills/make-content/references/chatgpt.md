---
name: make-content
description: Create promotional videos, carousels, images or social drafts for an existing Vaybel product, and publish a chosen social post only when explicitly requested.
---

# Make product content

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

Resolve the existing listing/design using the available saved context and read
tools. Use `content.generate` for requested video, slideshow, carousel or single
image content; follow the current tool schema for supported formats and inputs.
For formats using existing photos, reuse the selected saved image URLs. Poll the
same handle with `content.get` until it is ready, then show the actual artifact.

Use `social_post.generate` for requested channel-specific drafts, `social_post.get`
to retrieve a saved draft and `social_post.update` for revisions. Publish with
`social_post.publish` only when the user explicitly asks to publish the chosen
post to the chosen channel. Report queued/publishing separately from published.
Retain the returned post ID and check `social_post.get` for progress; repeating a
publish request is not a status check. If `action_required` is present, explain
that step briefly. Delivery to a TikTok inbox still needs the creator to finish
the post and is not publication.
Never silently repeat a provider publication after an ambiguous result.

A draft request does not authorize publishing. Return the saved content/draft link
and concise relevant outcome, without inventing reach, engagement or sales.
