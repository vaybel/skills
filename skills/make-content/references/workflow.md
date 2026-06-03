# Make Content Workflow

The dashboard workflow is:

```text
Make Content -> Content Asset -> Social Drafts -> Optional Publish
```

Expected MCP flow:

1. `content.resolve_sales_channels`
2. `content.generate`
3. `content.get` with `wait_sec`
4. Optional `social_post.generate`
5. Optional `social_post.publish`

Publishing is intentionally opt-in. Generate drafts by default and leave final
review to the user unless they pass `--publish`.
