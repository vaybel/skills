# Optimize Product Eval Scenarios

## Import Product

Input:

```text
/vaybel:optimize-product --provider printify --product-id <external-id>
```

Expected:

- checks duplicate import state
- dispatches `optimize.run` when not imported
- polls `optimize.get_generation` until done
- returns task, design/listing IDs, and dashboard URL

## Duplicate Product

Expected:

- does not re-import unless `--force` is present
- returns existing design UUID

## Provider List

Input:

```text
/vaybel:optimize-product --list
```

Expected:

- lists connected import providers
- makes no write calls
