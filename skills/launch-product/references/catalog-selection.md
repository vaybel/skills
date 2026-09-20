# Catalog Selection

Select the canonical blank before running generation. Use the read-only research runner:

```bash
npm --prefix "$PLUGIN_ROOT" run blank-research -- --category tee --technique dtg
npm --prefix "$PLUGIN_ROOT" run blank-research -- --products <uuid> --section overview
npm --prefix "$PLUGIN_ROOT" run blank-research -- --products <uuid>,<uuid> --section materials
```

The runner calls public MCP tools only: catalog.list_blanks for discovery,
catalog.get_blank for one product, catalog.compare_blanks for two to four.
Use full UUIDs from discovery. Sections are overview, materials, sizing and
construction. Sizing includes the raw canonical size tables used by the app.
Responses page facts and compact claim references. Follow returned next_offset
values using --offset; get_blank returns ten rows per section, comparisons three.
The research URL links to the full claim register with targets and source locators.
These calls are read-only and require catalog:read and Starter or above.

Ask about intended garment, fit, fabric/feel, weight, sizes and colors. Start
with the cited when-to-choose summary and tradeoffs, then inspect the relevant
section. Explain a short list against those preferences; never manufacture a
quality score from a product name or GSM. Keep material/color scopes and body
versus garment measurements separate. State missing research as unknown. Blank
research is a dated snapshot; printing, provider performance, prices and shipping
are separate decisions. Cite the returned research URL and sources.

Once selected, pass --product <full-uuid-or-exact-sku> to launch-product. The
runner validates a UUID through catalog.get_blank and rejects an ambiguous
search rather than silently generating on its first result. Unique search
results remain supported. A missing research attachment does not make a
published catalog product unavailable.

For people using the app, Launch Product offers direct browsing or Choose with
Brand Assistant. The Assistant uses the same MCP tools and opens the existing
Design step with the chosen product; generation still requires the customer's
Generate action. The public Blank library also supports manual comparison and
copyable selection briefs.
