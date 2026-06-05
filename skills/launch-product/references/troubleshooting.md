# Troubleshooting

## Missing PAT

Ask the user to set:

```bash
export VAYBEL_PAT="<your-vaybel-pat>"
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

## No VTO Audience Or Model

The launch-product runner requests VTO to meet the five-mockup listing minimum.
If Brand DNA has no compatible audience, stop before design generation and ask
the user to add an audience in Vaybel Brand Kit.

If `mockup.generate_mockup` reports that no virtual model exists for the chosen
audience, tell the user the audience needs a created virtual model before VTO can
run. Do not fake the listing-ready minimum with only flats or detail close-ups.

## Product Video Failure

Product videos require completed VTO mockups. If `product_video.generate` says
VTO mockups are missing or pending, return that status and do not retry video
generation until mockups are complete.

If a requested listing channel is Shopify only, skip product-video generation.
The public MCP video tool supports TikTok Shop and Etsy product videos.
