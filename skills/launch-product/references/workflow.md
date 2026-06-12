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

1. `credits.check`
2. `brand_dna.get`
3. `catalog.list_blanks`
4. `design.generate`
   - When the design idea comes from a trend or a launch concept
     (`trend.list_trends` / `trend.generate_launch_concept`), ALWAYS pass that
     trend's id as `trend_match_uuid`. It links the design to the trend so
     listing titles and tags ground in the trend's real search demand.
   - Treat a launch concept's `prompt.concept` as the design brief as-is —
     do not expand it with extra motifs or palette lists.
5. Poll `design.get_generation` with `wait_sec` (single poll caps at 50s; re-poll until done)
6. `mockup.generate` with explicit `kinds`
7. Poll `mockup.get_generation` with the returned `handle` (when `handle` is null, every mockup already existed — read them via `mockup.list`)
8. Optional `product_video.generate` for requested listing video channels
9. Optional `product_video.get_generation` with `wait_sec`

The default mockup request is listing-ready:

- `flat` for front/back product flats
- `vto` with `audience_key` for three studio virtual try-on images
- `detail_closeup` only for DTG/non-AOP products

This yields five required listing images for AOP products and eight images for
DTG/non-AOP products.

Product videos are optional and channel-scoped. Only call
`product_video.generate` when the user supplied listing channels. Request
`tiktok_shop` for a square TikTok Shop listing video and `etsy` for an Etsy
listing video. Do not request product videos for Shopify through MCP.

Do not use private REST endpoints for listings, optimization, trend feed, or
social publishing. Use the dedicated workflow skills for those tasks.
