---
name: vaybel:make-content
version: 0.2.0
description: |
  Make Vaybel social content through the public MCP server. Use when the user
  wants to generate a video, slideshow, carousel, or single-photo post from an
  existing listing, create social post drafts, or explicitly publish generated
  social posts. NOT for trend discovery, provider-product import, design
  generation, mockup generation, or listing creation.
argument-hint: <listing-id> [--format video|slideshow|carousel|single] [--scene-type lifestyle|studio] [--channels tiktok,instagram,youtube,x] [--publish]
allowed-tools: Bash(npm *), Bash(node *), Read
metadata:
  hermes:
    tags: [vaybel, content, social]
    requires_tools: [terminal]
required_environment_variables:
  - name: VAYBEL_PAT
    prompt: "Vaybel PAT (Dashboard -> Settings -> MCP)"
    required_for: "Vaybel MCP access"
---

# Vaybel Make Content

Run this skill when the user wants Vaybel to create social content for an
existing listing. The default is draft-safe: generate content and, when
channels are supplied, generate social post drafts. Publishing requires an
explicit `--publish`.

## Execution

Resolve `$PLUGIN_ROOT` as the absolute plugin root, then invoke:

```bash
npm --prefix "$PLUGIN_ROOT" run make-content -- <listing-id>
```

Pass through user-provided options:

```bash
npm --prefix "$PLUGIN_ROOT" run make-content -- <listing-id> --format video
npm --prefix "$PLUGIN_ROOT" run make-content -- <listing-id> --format carousel --image-url <cdn-url> --channels instagram,x
npm --prefix "$PLUGIN_ROOT" run make-content -- <listing-id> --channels tiktok,instagram,youtube,x
npm --prefix "$PLUGIN_ROOT" run make-content -- <listing-id> --channels tiktok --publish
```

Substitute the resolved absolute path for `$PLUGIN_ROOT` in the actual bash
call. If dependencies are missing, run `npm --prefix "$PLUGIN_ROOT" install`
once.

On **Hermes**, the skill dir is `${HERMES_SKILL_DIR}` and the plugin root is
`${HERMES_SKILL_DIR}/../..`. If the root is read-only (baked into an image), skip
`npm run` (it rebuilds) and call the prebuilt runner directly:
`node "${HERMES_SKILL_DIR}/../../dist/skills/make-content/run.js" <listing-id> --channels tiktok,instagram,youtube,x --json`.

## Required Environment

- Recommended: `VAYBEL_PAT` is set once in the agent environment.
- Optional fallback: the Claude plugin `vaybel_pat` option.
- Optional: `VAYBEL_MCP_URL` or plugin option `mcp_url` for local/dev MCP.

Do not ask the user to paste a PAT in chat.

The org needs the **Growth plan** — gated calls fail with a `plan_required:` error; surface the upgrade path instead of retrying.

## Behavior

The runner will:

1. Resolve sales-channel CTA destinations for the listing when available.
2. Dispatch `content.generate` and wait for completion.
3. Generate social post drafts when `--channels` is supplied.
4. Publish only when `--publish` is explicitly supplied.
5. Return content assets, social drafts or publish results, and the dashboard
   URL.

## Rules

- Call only the bundled runner. Do not call Vaybel APIs directly.
- Require an existing listing ID.
- Do not publish unless the user explicitly asks to publish.
- For `slideshow`, `carousel`, or `single`, require one or more `--image-url`
  values.
- For `--publish`, require `--channels`.

## References

- Content workflow details: `references/workflow.md`
- Format and channel options: `references/formats-and-channels.md`
