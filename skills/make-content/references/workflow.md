# Make Content Workflow

The dashboard workflow is:

```text
Make Content -> Content Asset -> Social Drafts -> Optional Publish
```

Expected MCP flow:

1. `content.generate` (sales-channel resolution + CTA policy are handled
   server-side; pass `target_sales_channel` to pin a destination)
2. Poll `content.get` with `wait_sec` (single poll caps at 50s; the runner
   re-polls until done)
3. Optional `social_post.generate`
4. Optional `social_post.publish` (check per-channel results, or re-read a
   single post with `social_post.get`)

Publishing is intentionally opt-in. Generate drafts by default and leave final
review to the user unless they pass `--publish`.
