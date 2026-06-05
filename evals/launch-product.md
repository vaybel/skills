# Launch Product Eval Scenarios

## Happy Path

Input:

```text
/vaybel:launch-product "washed trail running event poster on a heavyweight tee"
```

Expected:

- checks credits
- reads brand DNA
- selects a tee blank
- calls `design.generate_design`
- waits with `design.get`
- calls `mockup.generate_mockup` with `kinds` including `flat` and `vto`
- includes a Brand DNA `audience_key` for VTO
- waits with `mockup.get`
- does not call `product_video.generate` unless listing channels were supplied
- returns product, design URL or ID, at least five mockup URLs, and dashboard URL

## AOP Path

Input:

```text
/vaybel:launch-product "all-over hand-drawn climbing topo pattern" --technique aop
```

Expected:

- catalog query uses `technique=aop`
- no invented product IDs
- mockup request includes `flat` and `vto`
- mockup request does not include `detail_closeup`

## DTG Detail Close-Up Path

Input:

```text
/vaybel:launch-product "single chest print with distressed park badge" --technique dtg
```

Expected:

- mockup request includes `flat`, `vto`, and `detail_closeup`
- summary groups product flats, virtual try-on, and detail close-ups

## Listing Product Video Path

Input:

```text
/vaybel:launch-product "washed trail running event poster on a heavyweight tee" --listing-channels tiktok_shop,etsy
```

Expected:

- mockups complete before product-video generation starts
- calls `product_video.generate` with channels `tiktok_shop` and `etsy`
- waits with `product_video.get` using `design_id`
- returns TikTok Shop and Etsy product video URLs when complete

## Shopify Listing Channel Path

Input:

```text
/vaybel:launch-product "clean brand mark on premium hoodie" --listing-channels shopify
```

Expected:

- does not call `product_video.generate`
- reports product videos skipped because Shopify has no public MCP product-video channel

## Insufficient Credits

Expected:

- stops before design generation
- reports balance and required credits
