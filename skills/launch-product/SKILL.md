---
name: vaybel:launch-product
version: 0.2.0
description: |
  Launch a Vaybel product through the public MCP server. Use when the user wants
  to create a new apparel product, turn a prompt into a design, generate
  listing-ready mockups, explore a tee or hoodie idea, or test an AOP concept. NOT for trend
  discovery, listing optimization, video generation, social publishing, or any
  workflow requiring private REST APIs.
argument-hint: <prompt-or-theme> [--product UUID-or-SKU] [--category tee|hoodie|...] [--technique dtg|aop|embroidery] [--quality pro|standard] [--listing-channels tiktok_shop,etsy]
allowed-tools: Bash(npm *), Bash(node *), Read
metadata:
  hermes:
    tags: [vaybel, product, design, mockup]
    requires_tools: [terminal]
required_environment_variables:
  - name: VAYBEL_PAT
    prompt: "Vaybel PAT (Dashboard -> Settings -> MCP)"
    required_for: "Vaybel MCP access"
---

# Vaybel Launch Product

Run this skill when the user wants to launch a Vaybel product idea. The
scope is the product creation slice of the Vaybel app workflow:

```text
Product -> Design -> Mockups
```

Content and provider-product import are handled by separate workflow skills.
Return dashboard links so the user can continue manually.

## Execution

Use the bundled TypeScript runner. The `launch-product` npm script lives in
the **plugin root** — the parent of `skills/launch-product/`, i.e. two
directories above this SKILL.md.

Resolve `$PLUGIN_ROOT` as the **absolute** path of the plugin root:

- If `$CLAUDE_PLUGIN_ROOT` is set in the shell env, use that.
- Otherwise, derive it from this SKILL.md's base directory (shown in the
  skill prompt header). Strip the trailing `skills/launch-product` to get the
  plugin root.
- On **Hermes**, the skill dir is `${HERMES_SKILL_DIR}` and the plugin root is
  `${HERMES_SKILL_DIR}/../..`. If the root is read-only (e.g. baked into an
  image), skip `npm run` (it rebuilds) and call the prebuilt runner directly:
  `node "${HERMES_SKILL_DIR}/../../dist/skills/launch-product/run.js" "<prompt-or-theme>" --json`.

Then invoke:

```bash
npm --prefix "$PLUGIN_ROOT" run launch-product -- "<prompt-or-theme>"
```

Pass through user-provided options:

```bash
npm --prefix "$PLUGIN_ROOT" run launch-product -- "<prompt-or-theme>" --category tee --technique dtg
npm --prefix "$PLUGIN_ROOT" run launch-product -- "<prompt-or-theme>" --product <uuid-or-sku>
npm --prefix "$PLUGIN_ROOT" run launch-product -- "<prompt-or-theme>" --quality standard --json
npm --prefix "$PLUGIN_ROOT" run launch-product -- "<prompt-or-theme>" --listing-channels tiktok_shop,etsy
```

Substitute the resolved absolute path for `$PLUGIN_ROOT` in the actual bash
call — do not rely on the shell expanding an unset variable.

The `--quality` option only accepts `pro` or `standard` and controls product
flats. Translate the user's wording before invoking: "premium / high / best /
hi-res" → `pro`; "draft / fast / cheap / low" → `standard`. Default is `pro`
when unspecified.

Use `--listing-channels` only when the user knows where this product will be
listed. It accepts `tiktok_shop`, `etsy`, and `shopify` as a comma-separated
list. The runner generates product videos only for supported video destinations:
TikTok Shop and Etsy. Shopify is accepted as a listing target but skipped for
product-video generation because the public product-video MCP tool does not
expose a Shopify-specific video channel.

If dependencies are missing, run `npm --prefix "$PLUGIN_ROOT" install` once.

## Required Environment

- Recommended: `VAYBEL_PAT` is set once in Claude Code settings and reused by
  the Vaybel MCP server and this skill.
- Optional fallback: the Claude plugin `vaybel_pat` option can be set when the
  skill is installed without a shared `VAYBEL_PAT` environment.
- Optional: `VAYBEL_MCP_URL` or plugin option `mcp_url` for local/dev MCP.

Do not ask the user to paste a PAT in chat.

The org needs the **Starter plan or higher** — gated calls fail with a `plan_required:` error; surface the upgrade path instead of retrying. Ask them to set the environment
variable or plugin option in their agent environment.

## Behavior

The runner will:

1. Check credits for the design plus mockup work.
2. Read Brand DNA and fold concise brand context into the prompt.
3. Resolve a catalog product from `--product`, or choose one with catalog
   filters.
4. Generate the design and wait for completion.
5. Generate listing-ready mockups and wait for completion.
6. If listing channels were supplied, generate only the product videos those
   channels can use.
7. Print a short launch summary with product, design, grouped mockup links, and
   the Vaybel dashboard URL.

Mockup policy:

- Always request product flats (`flat`) and studio virtual try-on (`vto`) so the
  result has at least five listing images: front/back flats plus front/side/back
  VTO.
- Select the first Brand DNA audience whose `gender_options` overlap the
  product. For one-gender products, pass that gender. For unisex products with
  both genders available, let the MCP server choose the first valid created
  virtual model.
- Add detail close-ups (`detail_closeup`) for DTG/non-AOP products. Skip them
  for AOP products because product flats and VTO are more useful listing assets.
- Stop before design generation if Brand DNA has no compatible audience for
  VTO. The five-image listing minimum cannot be met without an audience-backed
  virtual model.

Product-video policy:

- Product videos are listing media, not social `content.*` videos.
- Generate product videos only when `--listing-channels` is supplied. Do not
  default to both channels; that can spend 20 credits per unused video.
- Map `tiktok_shop` to the square TikTok Shop product video and `etsy` to the
  Etsy product video. Skip `shopify` for product-video generation.
- Product videos require completed VTO mockups. Run them after mockups, then
  wait with `product_video.get_generation`.

## Rules

- Call only the bundled runner. Do not call Vaybel APIs directly.
- Do not shell out to a Vaybel CLI.
- Do not invent product UUIDs or SKUs.
- Stop if auth, catalog lookup, credits, design generation, or mockup generation
  fails.
- Surface only concise summaries and URLs. Do not dump full MCP payloads into
  chat.
- After the runner succeeds, preserve its Markdown links and section structure.
  Do not rewrite CDN URLs into plain filenames or generic labels.

## References

- Product workflow details: `references/workflow.md`
- Catalog selection: `references/catalog-selection.md`
- AOP and DTG guidance: `references/aop-dtg.md`
- Common failures: `references/troubleshooting.md`
