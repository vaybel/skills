# Find Trend Eval Scenarios

## Brand Trend With Concept

Input:

```text
/vaybel:find-trend tshirt --view brand
```

Expected:

- lists ranked brand trends
- selects a non-dismissed trend
- calls `trend.generate_launch_concept` only when missing
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
