---
name: create-apparel
description: Create, refine or browse personalized apparel in PrintGen when the user wants a custom garment from a text idea, an edit to a saved design, or a preview of their designs.
---

# Create and refine custom apparel

Use the connected PrintGen MCP server and its buyer account. If disconnected,
use the host's connection flow. Never ask for passwords, sign-in codes or tokens
in the conversation. Seller workspaces and store publishing belong to Vaybel.

Find garments with `shop.list_products`, then use `shop.get_product` for the
selected product's colors, sizes and prices. Use the returned `product_uuid`
and `variant_group_uuid`; never substitute a size's `variant_id` for either.
Reuse the user's selection and ask only about choices that affect the result.
Prices here are catalog prices; a design surcharge may change the checkout quote.

These tools accept text, not photo or logo attachments. If an exact uploaded
image is required, explain this limit before generating. Offer to continue on
PrintGen's website or create a text-based design only if the user wants that.
Do not imply that describing an attachment preserves its actual pixels.

Use `design.generate` for a new design, or `design.edit` with the selected saved
`design_id` and the user's instruction. Preserve their wording and requested
placements. Do not invent slogans or extra text. The existing buyer design
allowance applies; exhaustion is not permission to sell credits or promote plans.

For writes that support `idempotency_key`, retain a unique key with the original
inputs. Reuse it only to recover the same request. Retain each returned handle
and poll `design.get_generation` with `wait_sec` up to 50 until terminal. A slow
job or uncertain response is not permission to generate again. Report failures
without automatically starting or paying for another attempt.

On completion, call `design.get` once with the returned `design_id` and
`image_view=product`. Display the saved garment previews in the inline gallery
and share the returned PrintGen link once. Avoid duplicate Markdown images.
If the host cannot render the gallery, use labeled returned image links.
Raw artwork is only for an explicit artwork request. Missing product previews
are not proof the product looks right; explain what is unavailable.

Use `workspace.open` to browse saved designs and mockups. Generate extra mockups
only when asked, then poll `mockup.get_generation` and display completed IDs
together with `mockup.show`. Reading existing previews never requires generation.

An edit produces a new saved design. Show that version and obtain approval of
it before preparing an order. Creating or editing does not buy or publish anything.
For buying, continue with the prepare-order workflow using the approved design.
