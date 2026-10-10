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

Status: prepared for directory submission. The manifest carries the listing fields
and the review cases the submission page asks for: five positive and three negative
cases. All eight were run on the review account on October 9 and their wording
matches what was observed. `review.demo_recording_url` links the recorded
walkthrough of those cases. Provide reviewer access through the secure portal. Do
not put credentials or reviewer instructions in the ZIP. Use a version bump when
preparing a release.

The backend workspace extension is a separate deployment. This package does not
claim that a sidebar or event subscription exists before that deployment and host
acceptance. New MCP tools also require the host's metadata review/scan.

Local validation on October 4: six native skills pass the skill validator; existing
repository validation and TypeScript typecheck pass; the ZIP allowlist/auth/assets
test passes. The manifest and MCP configuration also pass the published Agent
Plugins 1.0.0 schemas fetched through Chrome MCP. Privacy, terms and contact URLs
were verified live and added to the listing. Portable schemas do not validate the
OpenAI extension object or establish portal review or live host acceptance.
