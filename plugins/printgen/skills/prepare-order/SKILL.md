---
name: prepare-order
description: Prepare a PrintGen checkout when the user wants to buy their approved custom apparel, choose sizes and quantities, or get a quote for a saved design.
---

# Prepare an apparel order

Use the connected PrintGen buyer account. This workflow purchases physical
apparel through an external Shopify checkout. It cannot charge a card, buy
generation credits, upgrade subscriptions, or publish store listings.

Identify the approved saved `design_id` from this conversation or `workspace.open`.
Read `design.get` (or reuse its current response) to show the product preview and
retain `catalog_variant_group_uuid`. Ask for approval of this version and any
missing sizes, quantities and destination country.

Use `shop.get_product` for the design's catalog product. Match the saved design's
`catalog_variant_group_uuid` to a returned color's `variant_group_uuid`, then
resolve sizes to `variant_id` only within that color. Do not substitute a color
or variant silently. If no group is known, confirm the buyer's desired color
and use the edit-and-preview flow below to establish a known color before checkout.

Changing or establishing the garment color uses a design edit from the buyer's
allowance. Explain that and obtain confirmation before dispatch. Call
`design.edit` with the selected color's `variant_group_uuid` and an `instruction`
to keep the artwork and placement unchanged while changing to the chosen garment
color. Poll `design.get_generation`, then show the new `design.get` preview for
approval. Use that new `design_id` for checkout.
An unavailable size needs a user choice. This release ships to the United
States only; explain that limit before preparing checkout for another country.

One checkout uses one approved design, mixed sizes, one payer and one destination.
If the user asks for split payments, several designs or separate destinations,
explain the limitation and clarify how they want to proceed.

Once the user has confirmed their selections and asked for a quote or checkout,
call `shop.create_checkout` with `design_id` and `items` of `variant_id` and
positive integer `quantity`. A user-supplied US shipping address may be passed
as `shipping_address`, but it is optional: offer to enter it on the checkout page.
Never request or send payment-card details. Do not send the whole conversation.

Show the returned seller, quantities, sizes, colors, line prices, subtotal,
currency, shipping and policy link. Prices are integer cents. When shipping is
null, say it will be calculated at checkout; tax is also calculated there.
Do not call the subtotal a final all-inclusive total or invent delivery dates.

Give the returned `checkout_url` for the buyer to open and pay. Use it as an
external link, never an embedded payment form. Retain `checkout_id`, the approved
design and selections. Creating this cart charges nothing and is not a paid order.

Reuse an existing checkout link for unchanged selections. `shop.create_checkout`
creates a new cart on every call, so never repeat it simply to check payment or
recover an uncertain response. Use `shop.get_checkout` for a known checkout ID.
If artwork or selections change, show the new choice for approval before creating
a replacement checkout, and clearly identify which link the buyer should use.

After payment, continue with track-order. Do not claim that an order was placed
until a paid result or a saved order confirms it.
