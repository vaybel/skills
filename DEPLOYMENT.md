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
- [ ] `./setup --host codex`, `./setup --host claude`, and `./setup --host cursor`
      create symlinks in a clean local account.
- [ ] Live staging run succeeds with a sandbox PAT:
      `npm run launch-product -- "minimal test tee" --quality standard --json`.
- [ ] No docs ask users to paste PATs into chat.
- [ ] README clearly states that only `/vaybel:launch-product` ships in v1.

## GitHub Release

- [ ] Tag `v0.1.0`.
- [ ] Release notes include install commands, required env vars, and known v1
      limits.
- [ ] Attach no secrets, generated mockups, or customer artifacts.

## Claude Code Marketplace

- [ ] `.claude-plugin/marketplace.json` has owner, plugin version, skill path,
      and invoke name.
- [ ] `.claude-plugin/plugin.json` has homepage, repository, license, and
      keywords.
- [ ] Install test:

```text
/plugin marketplace add vaybel/skills
/plugin install vaybel@vaybel
/vaybel:launch-product "washed archive tee graphic"
```

- [ ] Update public docs with the Claude Code install path.

## Codex Plugin

- [ ] `.codex-plugin/plugin.json` points `skills` to `./skills`.
- [ ] `interface.composerIcon` and `interface.logo` files exist.
- [ ] `defaultPrompt` examples map to `/vaybel:launch-product`.
- [ ] Install test from a fresh Codex profile.
- [ ] Confirm the skill can read `SKILL.md` and run `npm run launch-product`.

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
- [ ] Open follow-up issues for `find-trend`, `optimize-product`, and
      `make-video` once public MCP tools exist.
