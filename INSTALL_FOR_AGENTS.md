# Install For Agents

Use this when an agent is asked to install Vaybel Skills.

## Preferred: Claude Code Marketplace

Use this path when Claude Code supports plugins in the user's environment:

```text
/plugin marketplace add vaybel/skills
/plugin install vaybel@vaybel
```

Tell the user to configure the sensitive `vaybel_pat` plugin option with a PAT
from Vaybel `Dashboard -> Settings -> MCP` only if they do not already expose
`VAYBEL_PAT` to Claude Code. Preferred setup is one shared `VAYBEL_PAT` used by
both the Vaybel MCP server and this skill. Do not ask them to paste the token in
chat.

Then invoke:

```text
/vaybel:launch-product "<idea>"
```

## Fallback: Local Clone

1. Confirm Node.js 20+ is available:

```bash
node --version
```

2. Clone and install:

```bash
git clone https://github.com/vaybel/skills.git
cd skills
npm install
./setup
```

3. Confirm auth is configured:

```bash
test -n "$VAYBEL_PAT"
```

4. Validate the repository:

```bash
npm run validate
npm run typecheck
```

5. Ask the user for a product idea and invoke:

```text
/vaybel:launch-product "<idea>"
```

Do not ask the user for their PAT in chat. Have them set `VAYBEL_PAT` in their
shell or agent environment.
