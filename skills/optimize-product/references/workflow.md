# Optimize Product Workflow

The dashboard workflow is:

```text
Optimize Product -> Imported Design -> Mockups/Videos/Publish
```

This skill covers the import and linked-listing discovery segment only.

Expected MCP flow:

1. `optimize.list_providers` when provider context is missing
2. `optimize.list_provider_products` when browsing provider products
3. `optimize.check_duplicate`
4. `optimize.optimize_product`
5. `optimize.get` with `wait_sec`
6. Optional `optimize.refresh_listing`

Do not use this skill for Vaybel-origin products that should start from
catalog blanks and design generation.
