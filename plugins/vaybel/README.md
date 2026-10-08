# ChatGPT Vaybel package

Build with `npm run package:chatgpt`; verify with `npm run test:chatgpt-package`.
The portable ZIP root contains `plugin.json`, `mcp.json`, `skills/` and `assets/`.
It connects the hosted Vaybel MCP through the host's OAuth flow. It contains no PAT,
local runner dependency, account secrets, generated customer data or node_modules.

Native workflow sources live with the existing workflows at
`skills/<workflow>/references/chatgpt.md`. Existing local runner installations keep
their current manifests, commands and credentials. This is a host-specific package
of the same public MCP workflows, not another backend.

The square icon is copied from Platform's `frontend/apps/vaybel/public/icon-256x256.png`.
Existing wide SVG brand artwork remains unchanged for its existing consumers.

Status: local package preparation, not submitted or live-qualified. The manifest
carries the listing fields and draft review cases the submission page asked for on
October 8: five positive and three negative cases, checked against the public tool
names but not yet run on a review account. Before upload, complete the
experience-lab gates, run every review case on the review account and correct the
wording to what was observed, and add `review.demo_recording_url` with the actual
walkthrough. Provide reviewer access through the secure portal. Do not put
credentials or reviewer instructions in the ZIP. Use a version bump when preparing
a release.

The backend workspace extension is a separate deployment. This package does not
claim that a sidebar or event subscription exists before that deployment and host
acceptance. New MCP tools also require the host's metadata review/scan.

Local validation on October 4: six native skills pass the skill validator; existing
repository validation and TypeScript typecheck pass; the ZIP allowlist/auth/assets
test passes. The manifest and MCP configuration also pass the published Agent
Plugins 1.0.0 schemas fetched through Chrome MCP. Privacy, terms and contact URLs
were verified live and added to the listing. Portable schemas do not validate the
OpenAI extension object or establish portal review or live host acceptance.
