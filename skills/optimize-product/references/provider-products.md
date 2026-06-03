# Provider Product Options

- `--provider printify|printful`: required for import or provider-product list.
- `--product-id <external-id>`: provider-side product ID to import.
- `--shop-id <shop-id>`: Printify-only selector when multiple shops are
  connected.
- `--list`: list connected providers, or products for the selected provider.
- `--force`: re-dispatch import even when duplicate detection finds an
  existing design.
- `--refresh-listing`: after import or with `--design-id`, re-check linked
  marketplace listing discovery.

The runner reports unsupported provider products but does not try to repair
them locally.
