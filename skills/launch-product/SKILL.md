---
name: vaybel-launch-product
version: 0.1.0
description: |
  Launch a Vaybel product through the public MCP server. Use when the user wants
  to create a new apparel product, turn a prompt into a design, generate flat
  mockups, explore a tee or hoodie idea, or test an AOP concept. NOT for trend
  discovery, listing optimization, video generation, social publishing, or any
  workflow requiring private REST APIs.
argument-hint: <prompt-or-theme> [--product UUID-or-SKU] [--category tee|hoodie|...] [--technique dtg|aop|embroidery] [--quality pro|standard]
allowed-tools: Bash(npm *), Bash(node *), Read
---

# Vaybel Launch Product

Run this skill when the user wants to launch a Vaybel product idea. The v1
scope is the MCP-backed slice of the Vaybel app workflow:

```text
Product -> Design -> Mockups
```

Videos and listings are out of scope for v1. Return dashboard links so the
user can continue manually.

## Execution

Use the bundled TypeScript runner from the repo root:

```bash
npm run launch-product -- "<prompt-or-theme>"
```

Pass through user-provided options:

```bash
npm run launch-product -- "<prompt-or-theme>" --category tee --technique dtg
npm run launch-product -- "<prompt-or-theme>" --product <uuid-or-sku>
npm run launch-product -- "<prompt-or-theme>" --quality standard --json
```

If dependencies are missing, run `npm install` once from the repo root.

## Required Environment

- `VAYBEL_PAT` must be set.
- Optional: `VAYBEL_MCP_URL` for local/dev MCP.

Do not ask the user to paste a PAT in chat. Ask them to set the environment
variable in their shell or agent environment.

## Behavior

The runner will:

1. Check credits for the design plus mockup work.
2. Read Brand DNA and fold concise brand context into the prompt.
3. Resolve a catalog product from `--product`, or choose one with catalog
   filters.
4. Generate the design and wait for completion.
5. Generate flat mockups and wait for completion.
6. Print a short launch summary with product, design, mockup URLs, and the
   Vaybel dashboard URL.

## Rules

- Call only the bundled runner. Do not call Vaybel APIs directly.
- Do not shell out to a Vaybel CLI.
- Do not invent product UUIDs or SKUs.
- Stop if auth, catalog lookup, credits, design generation, or mockup generation
  fails.
- Surface only concise summaries and URLs. Do not dump full MCP payloads into
  chat.

## References

- Product workflow details: `references/workflow.md`
- Catalog selection: `references/catalog-selection.md`
- AOP and DTG guidance: `references/aop-dtg.md`
- Common failures: `references/troubleshooting.md`
