# Find Trend Workflow

The dashboard workflow is:

```text
Find Trend -> Launch Concept -> Launch Product
```

This skill covers the trend and concept segment only.

Expected MCP flow:

1. `trend.list_trends` or `trend.get_trend_match`
2. `trend.generate_launch_concept` when a concept is missing
3. `trend.get` with `wait_sec`
4. Return dashboard and launch-product inputs

Do not continue into product design generation unless the user explicitly
invokes the launch-product skill.
