---
name: vaybel:plan-drop
version: 0.3.0
description: |
  Plan a Vaybel drop through the public MCP server: create or open a themed
  release, see which trends fit its brief, pin them, file designs into it, and
  read its readiness. Use when the user wants to plan a collection, capsule,
  seasonal or themed release, relate trends to a drop, or check how ready a
  drop is. NOT for generating designs, mockups, listings, or content, and NOT
  for browsing the trend feed on its own.
argument-hint: [drop-name] [--drop UUID] [--kind KIND] [--date YYYY-MM-DD] [--theme TEXT] [--motifs a,b] [--trend UUID] [--match UUID] [--pin-top N] [--attach-design UUID] [--limit N]
allowed-tools: Bash(npm *), Bash(node *), Read
metadata:
  tags: [vaybel, drop, release, trend]
required_environment_variables:
  - name: VAYBEL_PAT
    prompt: "Vaybel PAT (Dashboard -> Settings -> API & MCP)"
    required_for: "Vaybel MCP access"
---

# Vaybel Plan Drop

Run this skill when the user wants to plan a release. A drop is a seller's
themed release: a brief on top of Brand DNA, a launch date, the designs and
listings filed into it, and readiness that Vaybel derives from that work. The
runner creates or opens the drop, ranks the workspace's trends against its
brief, pins the ones the user chooses, and reports what is still missing.

## Execution

Resolve `$PLUGIN_ROOT` as the absolute plugin root, then invoke:

```bash
npm --prefix "$PLUGIN_ROOT" run plan-drop --
```

Pass through user-provided options:

```bash
npm --prefix "$PLUGIN_ROOT" run plan-drop -- "Fall '26" --kind seasonal --date 2026-10-01 --theme "harvest evenings" --motifs pumpkin,moon
npm --prefix "$PLUGIN_ROOT" run plan-drop -- "Cowgirl capsule" --trend <named-trend-uuid>
npm --prefix "$PLUGIN_ROOT" run plan-drop -- --drop <drop-uuid>
npm --prefix "$PLUGIN_ROOT" run plan-drop -- --drop <drop-uuid> --pin-top 2
npm --prefix "$PLUGIN_ROOT" run plan-drop -- --drop <drop-uuid> --attach-design <design-uuid> --json
```

Substitute the resolved absolute path for `$PLUGIN_ROOT` in the actual bash
call. If dependencies are missing, run `npm --prefix "$PLUGIN_ROOT" install`
once.

## Required Environment

- Recommended: `VAYBEL_PAT` is set once in the agent environment.
- Optional fallback: the Claude plugin `vaybel_pat` option.
- Optional: `VAYBEL_MCP_URL` or plugin option `mcp_url` for local/dev MCP.

Do not ask the user to paste a PAT in chat.

The org needs the **Starter plan or higher** — gated calls fail with a `plan_required:` error; surface the upgrade path instead of retrying.

## Behavior

The runner will:

1. Create the drop from a name plus any brief fields (a `--trend` or `--match`
   pins that trend and seeds the brief from it), or open an existing drop with
   `--drop`. Names are unique among planning and live drops; a duplicate fails
   with the existing drop's status.
2. File any `--attach-design` designs into the drop. A design carries its
   listings, shorts, and posts with it.
3. Rank the workspace's trends against the brief (`drop.related_trends`),
   pinned trends first, each with the reasons: shared motifs, words from the
   brief, the seasonal window for seasonal or event drops, lifecycle.
4. Pin trends on request: `--trend`/`--match` on an existing drop, or
   `--pin-top N` for the strongest unpinned suggestions. Pinning is the only
   write beyond creation; it never regenerates or spends credits.
5. Return the drop, its readiness (brief, launch date, products; per product
   design, mockups, live listing), the trends, the concept id to launch from,
   and a dashboard link.

## Rules

- Call only the bundled runner. Do not call Vaybel APIs directly.
- Do not generate designs or concepts from this skill. To launch from a
  suggested trend: `/vaybel:find-trend --match <concept-id>`, then
  `/vaybel:launch-product`, then re-run this skill with `--attach-design`.
- Do not pin trends the user did not ask for; `--pin-top` is opt-in.
- Launching and wrapping a drop stay in the dashboard.

## References

- Drop workflow details: `references/workflow.md`
- Options and boundaries: `references/options.md`
