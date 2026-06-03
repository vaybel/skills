# Find Trend Options

- `--view all|brand|seasonal`: trend feed slice. Default: `all`.
- positional product type or `--product-type`: optional ProductType search term
  such as `tshirt`, `hoodie`, or another catalog product type.
- `--match <uuid>`: skip ranking and load a specific TrendMatch.
- `--no-concept`: read-only browse mode. No concept generation.
- `--seasonal-events`: include current seasonal-calendar context.
- `--limit N`: page size for trend ranking. Default: 10.

The runner returns product UUIDs from the concept when available. Those UUIDs
can be passed to launch-product with `--product`.
