# Troubleshooting

## Missing PAT

Ask the user to set:

```bash
export VAYBEL_PAT="vbl_pat_live_..."
```

Do not ask them to paste the token into chat.

## Insufficient Credits

Stop and report the balance and required amount. Do not retry generation.

## No Catalog Match

Ask for a different product UUID, SKU, category, technique, or search term.

## Design Timeout

Return the task status and tell the user the design may still be running in
Vaybel. Do not start a second design automatically.

## Mockup Timeout

Return the mockup status. Do not dispatch another mockup batch unless the user
explicitly asks.
