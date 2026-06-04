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
user can continue into videos, content, or listings manually.

Expected MCP flow:

1. `credits.check_credits`
2. `brand_dna.get_brand_dna`
3. `catalog.list_blanks`
4. `design.generate_design`
5. `design.get` with `wait_sec`
6. `mockup.generate_mockup` with explicit `kinds`
7. `mockup.get` with `wait_sec`

The default mockup request is listing-ready:

- `flat` for front/back product flats
- `vto` with `audience_key` for three studio virtual try-on images
- `detail_closeup` only for DTG/non-AOP products

This yields five required listing images for AOP products and eight images for
DTG/non-AOP products.

Do not use private REST endpoints for listings, optimization, trend feed, or
social publishing. Use the dedicated workflow skills for those tasks.
