# Cookbook

## Find a Trend Opportunity

```text
/vaybel:find-trend tshirt --view brand
```

The skill ranks trend matches, generates a launch concept when needed, and
returns product UUIDs that can be fed into launch-product.

## Launch a Tee From a Prompt

```text
/vaybel:launch-product "distressed motocross type treatment, washed black tee"
```

The skill will search for a tee blank, generate a design, create listing-ready
mockups, and return a concise launch summary.

## Launch With Listing Product Videos

```text
/vaybel:launch-product "distressed motocross type treatment, washed black tee" --listing-channels tiktok_shop,etsy
```

Listing product videos are generated only for supplied listing channels. TikTok
Shop and Etsy are supported; Shopify is skipped for product-video generation.

## Launch on a Specific Product

```text
/vaybel:launch-product "glacial trail map fragments and tiny elevation labels" --product <product-uuid>
```

Use a catalog product UUID from Vaybel MCP `catalog.list_blanks`.

## Force AOP

```text
/vaybel:launch-product "all-over checkerboard field with tiny road-race symbols" --technique aop
```

The skill filters the blank catalog to all-over-print candidates before
generating the design.

## Use Standard Mockups

```text
/vaybel:launch-product "small chest logo, vintage surf club" --quality standard
```

The quality flag controls product flats. The skill still requests VTO so the
launch has the five mockups needed for listings. Pro flats remain the default
for presentation-quality output.

## Optimize a Provider Product

```text
/vaybel:optimize-product --provider printify --product-id <external-id>
```

The skill checks for duplicate imports, dispatches the optimize import, waits
for completion, and returns the design/listing IDs.

## Make Social Content

```text
/vaybel:make-content <listing-id> --channels tiktok,instagram
```

The skill generates content, creates social post drafts for the selected
channels, and only publishes when `--publish` is explicitly included.

## Check Insights Before Acting

```text
/vaybel:analyze-insights --range 28d
```

The skill returns KPIs, channel breakdowns, top design snapshots, credit state,
and next-best-action guidance. Use it before choosing which product workflow to
run next.
