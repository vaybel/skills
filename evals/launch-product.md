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

## Insufficient Credits

Expected:

- stops before design generation
- reports balance and required credits
