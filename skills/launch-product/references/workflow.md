# Launch Product Workflow

The Vaybel app workflow is:

```text
Product -> Design -> Mockups -> Videos -> Listings
```

This skill covers only the MCP-backed v1 segment:

```text
Product -> Design -> Mockups
```

After mockups complete, return the Vaybel dashboard URL for the design so the
user can continue into videos and listings manually.

Expected MCP flow:

1. `check_credits`
2. `get_brand_dna`
3. `list_blanks`
4. `generate_design`
5. `get_design_status` in a code polling loop
6. `generate_mockup`
7. `get_mockup_status` in a code polling loop

Do not use private REST endpoints for videos, listings, optimization, trend
feed, or social publishing.
