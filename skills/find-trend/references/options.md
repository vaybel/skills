# Find Trend Options

- `--lifecycle emerging|rising|peak|declining`: filter the named-trend feed.
- `--type <trend_type>`: filter by trend type (e.g. `aesthetic`).
- positional product type or `--product-type`: optional ProductType search term
  such as `tshirt` or `hoodie` — used to pick which keyword child the concept
  is generated against.
- `--trend <uuid>`: skip ranking and load a specific named trend.
- `--match <uuid>`: keyword-direct mode — concept against a specific keyword
  row (from a previous run's `keywords[]`).
- `--no-concept`: read-only browse mode. No concept generation.
- `--seasonal-events`: include current seasonal-calendar context.
- `--limit N`: page size for trend ranking. Default: 10.

The runner returns product UUIDs from the concept when available. Those UUIDs
can be passed to launch-product with `--product`.
