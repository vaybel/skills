# Catalog Selection

Use `--product` when the user provides an exact catalog product UUID or SKU.

Without `--product`, the runner selects the first catalog result from:

```text
category = user category or tee
technique = user technique or any
search = user search or none
limit = user limit or 10
```

Supported technique examples:

- `dtg`
- `aop`
- `embroidery`
- `cut-sew`
- `sublimation`
- `direct-to-fabric`
- `screen-print`

Never invent product IDs. If the catalog query returns no products, stop and
ask the user for a different category, search term, technique, or product UUID.
