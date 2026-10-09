---
name: track-order
description: Check PrintGen checkout payment, order production or shipping when the user asks whether they paid, where their custom apparel is, or to view their existing orders.
---

# Check payment and delivery

Use the connected PrintGen buyer account. This is a read-only workflow: never
create a cart, generate a design, submit a payment, or retry an order to check it.
Use only identifiers returned for this buyer; never search another account.

If this conversation has a `checkout_id`, call `shop.get_checkout`:

- `paid`: show the returned order and its actual state. Payment is not shipment.
- `awaiting_payment`: explain payment is not confirmed and reuse the returned
  checkout link if the user still wants to pay.
- `not_found`: an expired cart and a just-paid cart awaiting its webhook can
  look the same. Explain the uncertainty, check `shop.list_orders` or retry the
  read later, and do not encourage a second payment or claim failure.

For earlier purchases, call `shop.list_orders` and `shop.get_order` for the
selected order. Summarize only returned production and delivery states, items,
totals and tracking links. If more than one order matches, ask which one. If no
orders are returned, say so without inventing a sample purchase.

A failed lookup is not proof that payment failed. Explain the error and use the
published PrintGen support page when needed. Refunds, cancellations, address
changes and returns are not implemented by these MCP tools; explain the limit
and point to the returned policies or PrintGen support without claiming an action.
