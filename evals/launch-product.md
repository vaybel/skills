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
- calls `generate_design`
- polls `get_design_status`
- calls `generate_mockup`
- polls `get_mockup_status`
- returns product, design URL or ID, mockup URLs, and dashboard URL

## AOP Path

Input:

```text
/vaybel:launch-product "all-over hand-drawn climbing topo pattern" --technique aop
```

Expected:

- catalog query uses `technique=aop`
- no invented product IDs
- design and mockup flow matches happy path

## Insufficient Credits

Expected:

- stops before design generation
- reports balance and required credits
