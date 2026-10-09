# PrintGen ChatGPT plugin

Build `npm run package:chatgpt:printgen` and validate with
`npm run test:chatgpt-package`. The archive is `dist/chatgpt/printgen-0.1.0.zip`.
It contains the portable manifest, hosted MCP connection, existing PrintGen
512px icon and three native buyer skills. It contains no credentials or local
runner. The Vaybel package and its six seller workflows retain their own identity.

The first release creates apparel from text, shows saved product previews,
refines designs, prepares a mixed-size checkout for one approved design and
reads payment/order status. Shipping and listing availability are US-only.
Photos, exact uploaded logos, split payments, multi-address orders and merchant
publishing are outside this release. The existing buyer allowance applies.

Payment takes place on the external Shopify checkout. The returned subtotal
includes the design price; tax is calculated at checkout and shipping can remain
unknown until then. `shop.get_checkout` checks payment without making a new cart.
The plugin cannot charge a card or sell credits or subscription upgrades.

## Source dependencies

Platform must expose `workspace.open`, `shop.get_checkout`, the richer
`shop.create_checkout` result and the PrintGen domain-verification token.
The platform implementation is described in `docs/printgen/chatgpt-plugin.md`.
Keep catalog and variant identifiers supplied by the buyer tools; Vaybel seller
catalog and listing tools are not available on this endpoint.

The package builder is shared with Vaybel. Vaybel reads its existing
`skills/*/references/chatgpt.md`; PrintGen reads this directory's `skills/`.
PrintGen versions independently in `plugin.json`. The icon comes from Platform's
`frontend/apps/printgen/public/static/web-app-manifest-512x512.png`.

## Review preparation

The five positive and three negative review cases in the manifest are drafts,
not recorded live results. They cover catalog lookup, creation, editing,
checkout, order lookup, unsupported attachments, buyer isolation and unsupported
merchant publishing. All are **Not run in ChatGPT**. Run them with a dedicated
review buyer before submission. An empty order history must remain an empty
history; do not fabricate a paid order for the demonstration.

Additional acceptance: connect and revoke OAuth; browse saved artwork without
generation; refresh during a long generation without duplicate dispatch; read
an unpaid checkout twice without creating another; confirm a known paid order;
verify the checkout color matches its approved preview; require a new preview
and approval after a color change; handle a just-paid cart whose webhook has not
arrived; deny another buyer's
open checkout; stop at an exhausted allowance; refuse non-US delivery.

The public listing, support and policy URLs were fetched and their content
checked on 2026-10-09 UTC. The developers page has the assistant description,
publisher footer and working support email link, so it serves both listing and
support. The actual MCP path returns the expected unauthenticated 401.

Local package validation is separate from hosted acceptance. Still required:

- Deploy the platform changes and configure the PrintGen domain token.
- Provision the dedicated review buyer after explicit production authorization.
- Connect PrintGen in ChatGPT and run the cases on the submitted revision.
- Record the real walkthrough, verify its hosted link and add
  `extensions.com.openai.review.demo_recording_url` before submission.
- Enter reviewer access only in the secure portal; keep it out of this ZIP.
- Complete portal scans and have the owner complete attestations and submission.

The package is a local development artifact, not submission-ready. No recording
URL or registered app ID is invented. Upload and publication are separate steps.
