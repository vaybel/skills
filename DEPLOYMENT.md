# Deployment Checklist

Use this checklist before publishing `github.com/vaybel/skills` to common
agent marketplaces.

## Preflight

- [ ] Repo is public at `https://github.com/vaybel/skills`.
- [ ] Default branch is `main`.
- [ ] `VERSION`, `package.json`, skill frontmatter, and plugin manifests match.
- [ ] `npm ci` succeeds.
- [ ] `npm run validate` succeeds.
- [ ] `npm run typecheck` succeeds.
- [ ] `npm run build` succeeds.
- [ ] `npm audit --omit=dev --audit-level=moderate` succeeds.
- [ ] Clean host-install smoke succeeds:
      `scripts/smoke/host_install_smoke.sh`.
- [ ] Live read-only smoke succeeds with a sandbox PAT:
      `VAYBEL_PAT=... scripts/smoke/host_install_smoke.sh`.
- [ ] Live write smoke succeeds only against sandbox data:
      `VAYBEL_PAT=... VAYBEL_SMOKE_ENABLE_WRITES=1 VAYBEL_SMOKE_LISTING_ID=<listing-id> scripts/smoke/host_install_smoke.sh`.
- [ ] No docs ask users to paste PATs into chat.
- [ ] README lists all shipped workflow and insight skills.

## GitHub Release

- [ ] Tag `v0.1.0`.
- [ ] Release notes include install commands, required env vars, and known v1
      limits.
- [ ] Attach no secrets, generated mockups, or customer artifacts.

## Claude Code Marketplace

- [ ] `.claude-plugin/marketplace.json` has owner, plugin version, skill path,
      and invoke name.
- [ ] `.claude-plugin/plugin.json` has homepage, repository, license, keywords,
      `skills`, and sensitive `vaybel_pat` user config.
- [ ] Install test:

```text
/plugin marketplace add vaybel/skills
/plugin install vaybel@vaybel
/vaybel:launch-product "washed archive tee graphic"
```

- [ ] Confirm the install prompts for `vaybel_pat`, and the runner accepts the
      resulting `CLAUDE_PLUGIN_OPTION_vaybel_pat` environment value.
- [ ] Update public docs with the Claude Code install path.

## Codex Plugin

- [ ] `.codex-plugin/plugin.json` points `skills` to `./skills`.
- [ ] `interface.composerIcon` and `interface.logo` files exist.
- [ ] `defaultPrompt` examples map to shipped skills.
- [ ] Install test from a fresh Codex profile.
- [ ] Confirm the skills can read `SKILL.md` and run a bundled npm runner.

## Cursor Plugin

- [ ] `.cursor-plugin/plugin.json` validates as JSON.
- [ ] `name`, `displayName`, `publisher`, category, repository, and license are
      populated.
- [ ] Install test from a fresh Cursor profile or plugin dev install.
- [ ] Confirm the repo root remains available to the skill so `client.ts` and
      `servers/vaybel` can be imported.

## npx/Agent Skills Registry

- [ ] Confirm registry requirements for repo layout and manifest location.
- [ ] Confirm shared root files are included; standalone skill-folder install is
      not supported for v1.
- [ ] Document that `npm install` must run once after clone/install.
- [ ] Test:

```bash
npx skills add vaybel/skills
```

## Smithery, MCP Directories, and Tool Catalogs

Vaybel Skills are not an MCP server listing. Directory entries should point to
the existing MCP server and cross-link the skills repo:

- [ ] MCP endpoint listing stays `https://mcp.vaybel.com/`.
- [ ] Skills repo is described as the code-execution companion layer.
- [ ] Canonical sentence is consistent:
      "Vaybel turns apparel ideas into designs and mockups through a public MCP
      server and agent skills."

## Post-Publish

- [ ] Verify install instructions from a clean machine.
- [ ] Verify `VAYBEL_PAT` auth failure message is clear.
- [ ] Verify staging happy path after publish.
- [ ] Add marketplace URLs to README and Vaybel MCP docs.
- [ ] Re-run one safe smoke for each shipped skill after publish.
