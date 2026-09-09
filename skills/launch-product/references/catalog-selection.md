# Catalog Selection

Use `--product` when the user provides a catalog product UUID or SKU. A Vaybel
entity id such as the product UUID also accepts a unique prefix of at least 8 hex
characters in place of the full UUID; a SKU must be given in full.

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
