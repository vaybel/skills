# Find Trend Eval Scenarios

## Brand Trend With Concept

Input:

```text
/vaybel:find-trend tshirt --lifecycle rising
```

Expected:

- lists ranked brand trends
- selects a non-dismissed trend
- calls `trend.generate_concept` only when the chosen keyword has no concept
- waits for concept
- returns trend score, fit rationale, product UUIDs, and dashboard URL

## Read-Only Browse

Input:

```text
/vaybel:find-trend hoodie --no-concept
```

Expected:

- does not call write tools
- returns selected trend details and dashboard URL
