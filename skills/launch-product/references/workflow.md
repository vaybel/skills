# Launch Product Workflow

The Vaybel app workflow is:

```text
Product -> Design -> Mockups -> Videos -> Listings
```

This skill covers the product creation segment:

```text
Product -> Design -> Mockups
```

After mockups complete, return the Vaybel dashboard URL for the design so the
user can continue into content or listings manually.

Expected MCP flow:

1. `credits.check_credits`
2. `brand_dna.get_brand_dna`
3. `catalog.list_blanks`
4. `design.generate_design`
5. `design.get` with `wait_sec`
6. `mockup.generate_mockup`
7. `mockup.get` with `wait_sec`

Do not use private REST endpoints for listings, optimization, trend feed, or
social publishing. Use the dedicated workflow skills for those tasks.
