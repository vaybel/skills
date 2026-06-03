#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PARENT_DIR="$(dirname "$SOURCE_ROOT")"
STAMP="$(date +%Y%m%d-%H%M%S)"
PROJECT_DIR="${VAYBEL_SMOKE_PROJECT_DIR:-$PARENT_DIR/vaybel-skills-smoke-$STAMP}"
SESSION_NAME="${VAYBEL_SMOKE_SESSION:-vaybel-skills-smoke-$STAMP}"
USE_TMUX="${VAYBEL_SMOKE_TMUX:-auto}"

usage() {
  cat <<EOF
Usage: scripts/smoke/host_install_smoke.sh [--project-dir DIR] [--tmux|--no-tmux]

Creates a clean sibling smoke project, copies this repo without ignored local
artifacts, installs dependencies, validates plugin manifests, validates host
install surfaces, and runs every skill runner in no-token mode.

Optional live checks:
  VAYBEL_PAT=...                         enables read-only live checks
  VAYBEL_SMOKE_ENABLE_WRITES=1           enables launch-product and make-content writes
  VAYBEL_SMOKE_LISTING_ID=<uuid>         required for make-content write smoke
  VAYBEL_SMOKE_LAUNCH_PROMPT=<prompt>    optional launch prompt

Output:
  <project-dir>/logs/*.log
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --project-dir)
      shift
      PROJECT_DIR="${1:-}"
      ;;
    --project-dir=*)
      PROJECT_DIR="${1#--project-dir=}"
      ;;
    --tmux)
      USE_TMUX="1"
      ;;
    --no-tmux)
      USE_TMUX="0"
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

if [ -z "$PROJECT_DIR" ]; then
  echo "--project-dir cannot be empty" >&2
  exit 1
fi

if [ -e "$PROJECT_DIR" ]; then
  echo "$PROJECT_DIR already exists; choose a new --project-dir." >&2
  exit 1
fi

mkdir -p "$PROJECT_DIR"
LOG_DIR="$PROJECT_DIR/logs"
STATUS_DIR="$PROJECT_DIR/status"
PLUGIN_DIR="$PROJECT_DIR/vaybel-skills"
FRESH_PROJECT="$PROJECT_DIR/fresh-project"
mkdir -p "$LOG_DIR" "$STATUS_DIR" "$FRESH_PROJECT"

run_logged() {
  local name="$1"
  shift
  local log="$LOG_DIR/$name.log"
  echo "[$name] starting"
  (
    set -euo pipefail
    "$@"
  ) >"$log" 2>&1
  local status=$?
  echo "$status" >"$STATUS_DIR/$name.status"
  if [ "$status" -eq 0 ]; then
    echo "[$name] ok"
  else
    echo "[$name] failed; see $log" >&2
  fi
  return "$status"
}

copy_repo_without_local_artifacts() {
  local source="$1"
  local target="$2"
  rsync -a \
    --exclude ".git/" \
    --exclude ".env" \
    --exclude ".env.*" \
    --exclude "node_modules/" \
    --exclude "dist/" \
    --exclude ".DS_Store" \
    --exclude "*.log" \
    "$source/" "$target/"
}

task_prepare() {
  copy_repo_without_local_artifacts "$SOURCE_ROOT" "$PLUGIN_DIR"
  cd "$PLUGIN_DIR"
  npm ci
}

task_static() {
  cd "$PLUGIN_DIR"
  npm run validate
  npm run typecheck
  npm run build
  npm audit --omit=dev --audit-level=moderate
  git diff --no-index /dev/null /dev/null >/dev/null 2>&1 || true
}

task_namespace() {
  cd "$PLUGIN_DIR"
  node <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const skills = fs.readdirSync("skills", { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
for (const skill of skills) {
  const text = fs.readFileSync(path.join("skills", skill, "SKILL.md"), "utf8");
  const match = text.match(/^name:\s*(.+)$/m);
  const actual = match && match[1].trim();
  const expected = `vaybel:${skill}`;
  if (actual !== expected) {
    throw new Error(`${skill}: expected name ${expected}, got ${actual}`);
  }
  console.log(`/${expected}`);
}
NODE
}

task_codex_install() {
  local home="$PROJECT_DIR/home-codex"
  mkdir -p "$home"
  cd "$FRESH_PROJECT"
  HOME="$home" "$PLUGIN_DIR/setup" --host codex
  test -L "$home/.codex/plugins/vaybel"
  test "$(readlink "$home/.codex/plugins/vaybel")" = "$PLUGIN_DIR"
  grep -R "^name: vaybel:" "$home/.codex/plugins/vaybel/skills"/*/SKILL.md

  if command -v codex >/dev/null 2>&1; then
    local codex_home="$PROJECT_DIR/codex-home"
    local marketplace="$PROJECT_DIR/codex-marketplace"
    local marketplace_plugin="$marketplace/plugins/vaybel"
    local version
    version="$(tr -d '[:space:]' < "$PLUGIN_DIR/VERSION")"
    mkdir -p "$codex_home" "$marketplace/.agents/plugins" "$marketplace_plugin"
    copy_repo_without_local_artifacts "$PLUGIN_DIR" "$marketplace_plugin"
    cat >"$marketplace/.agents/plugins/marketplace.json" <<'JSON'
{
  "name": "vaybel",
  "interface": {
    "displayName": "Vaybel"
  },
  "plugins": [
    {
      "name": "vaybel",
      "source": {
        "source": "local",
        "path": "./plugins/vaybel"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Design"
    }
  ]
}
JSON
    CODEX_HOME="$codex_home" codex plugin marketplace add "$marketplace"
    local list_output
    list_output="$(CODEX_HOME="$codex_home" codex plugin list --marketplace vaybel)"
    echo "$list_output"
    grep -q "vaybel@vaybel" <<<"$list_output"
    CODEX_HOME="$codex_home" codex plugin add "vaybel@vaybel"
    test -f "$codex_home/plugins/cache/vaybel/vaybel/$version/.codex-plugin/plugin.json"
  fi
}

task_claude_install() {
  if ! command -v claude >/dev/null 2>&1; then
    echo "Claude CLI not installed; skipping."
    return 0
  fi
  local home="$PROJECT_DIR/home-claude"
  mkdir -p "$home"
  cd "$FRESH_PROJECT"
  HOME="$home" claude plugin validate "$PLUGIN_DIR"
  HOME="$home" claude plugin marketplace add "$PLUGIN_DIR"
  HOME="$home" claude plugin install "vaybel@vaybel" --scope local
  HOME="$home" claude plugin list
}

expect_auth_failure() {
  local name="$1"
  shift
  local output
  set +e
  output="$(
    env -u VAYBEL_PAT -u VAYBEL_MCP_TOKEN -u CLAUDE_PLUGIN_OPTION_vaybel_pat \
      "$@" 2>&1
  )"
  local status=$?
  set -e
  echo "$output"
  if [ "$status" -eq 0 ]; then
    echo "$name unexpectedly succeeded without auth" >&2
    return 1
  fi
  if ! grep -q "Set VAYBEL_PAT" <<<"$output"; then
    echo "$name did not emit the expected auth guidance" >&2
    return 1
  fi
}

task_runner_no_token() {
  cd "$PLUGIN_DIR"
  expect_auth_failure find-trend npm run find-trend -- --no-concept --json
  expect_auth_failure analyze-insights npm run analyze-insights -- --json
  expect_auth_failure launch-product npm run launch-product -- "smoke tee" --quality standard --json
  expect_auth_failure optimize-product npm run optimize-product -- --provider printify --product-id smoke --json
  expect_auth_failure make-content npm run make-content -- 00000000-0000-4000-8000-000000000000 --channels tiktok --json
}

task_live_read() {
  cd "$PLUGIN_DIR"
  if [ -z "${VAYBEL_PAT:-}" ] && [ -z "${VAYBEL_MCP_TOKEN:-}" ]; then
    echo "VAYBEL_PAT not set; skipping live read checks."
    return 0
  fi
  npm run find-trend -- --no-concept --json
  npm run analyze-insights -- --json
  npm run optimize-product -- --list --json
}

task_live_write() {
  cd "$PLUGIN_DIR"
  if [ "${VAYBEL_SMOKE_ENABLE_WRITES:-0}" != "1" ]; then
    echo "VAYBEL_SMOKE_ENABLE_WRITES=1 not set; skipping write checks."
    return 0
  fi
  if [ -z "${VAYBEL_PAT:-}" ] && [ -z "${VAYBEL_MCP_TOKEN:-}" ]; then
    echo "VAYBEL_PAT or VAYBEL_MCP_TOKEN is required for write checks." >&2
    return 1
  fi

  local prompt="${VAYBEL_SMOKE_LAUNCH_PROMPT:-minimal smoke test tee graphic}"
  npm run launch-product -- "$prompt" --quality standard --json

  if [ -z "${VAYBEL_SMOKE_LISTING_ID:-}" ]; then
    echo "VAYBEL_SMOKE_LISTING_ID is required for make-content write smoke." >&2
    return 1
  fi
  npm run make-content -- "$VAYBEL_SMOKE_LISTING_ID" --channels tiktok --json
}

write_task_script() {
  local name="$1"
  local function_name="$2"
  local file="$PROJECT_DIR/$name.sh"
  cat >"$file" <<EOF
#!/usr/bin/env bash
set -euo pipefail
source "$PROJECT_DIR/env.sh"
$(declare -f run_logged)
$(declare -f copy_repo_without_local_artifacts)
$(declare -f "$function_name")
$(declare -f expect_auth_failure 2>/dev/null || true)
run_logged "$name" "$function_name"
EOF
  chmod +x "$file"
}

cat >"$PROJECT_DIR/env.sh" <<EOF
export SOURCE_ROOT=$(printf '%q' "$SOURCE_ROOT")
export PROJECT_DIR=$(printf '%q' "$PROJECT_DIR")
export LOG_DIR=$(printf '%q' "$LOG_DIR")
export STATUS_DIR=$(printf '%q' "$STATUS_DIR")
export PLUGIN_DIR=$(printf '%q' "$PLUGIN_DIR")
export FRESH_PROJECT=$(printf '%q' "$FRESH_PROJECT")
export VAYBEL_PAT=$(printf '%q' "${VAYBEL_PAT:-}")
export VAYBEL_MCP_TOKEN=$(printf '%q' "${VAYBEL_MCP_TOKEN:-}")
export VAYBEL_MCP_URL=$(printf '%q' "${VAYBEL_MCP_URL:-}")
export VAYBEL_SMOKE_ENABLE_WRITES=$(printf '%q' "${VAYBEL_SMOKE_ENABLE_WRITES:-0}")
export VAYBEL_SMOKE_LISTING_ID=$(printf '%q' "${VAYBEL_SMOKE_LISTING_ID:-}")
export VAYBEL_SMOKE_LAUNCH_PROMPT=$(printf '%q' "${VAYBEL_SMOKE_LAUNCH_PROMPT:-}")
EOF

echo "Smoke project: $PROJECT_DIR"
echo "Logs: $LOG_DIR"

# Prepare first because every other task depends on the clean copy.
run_logged prepare task_prepare

TASKS=(
  "static:task_static"
  "namespace:task_namespace"
  "codex-install:task_codex_install"
  "claude-install:task_claude_install"
  "runner-no-token:task_runner_no_token"
  "live-read:task_live_read"
  "live-write:task_live_write"
)

if [ "$USE_TMUX" = "auto" ]; then
  if command -v tmux >/dev/null 2>&1; then
    USE_TMUX="1"
  else
    USE_TMUX="0"
  fi
fi

if [ "$USE_TMUX" = "1" ]; then
  if ! command -v tmux >/dev/null 2>&1; then
    echo "tmux requested but not installed." >&2
    exit 1
  fi

  first=1
  for task in "${TASKS[@]}"; do
    name="${task%%:*}"
    fn="${task#*:}"
    write_task_script "$name" "$fn"
    if [ "$first" -eq 1 ]; then
      tmux new-session -d -s "$SESSION_NAME" -n smoke "$PROJECT_DIR/$name.sh; exec bash"
      first=0
    else
      tmux split-window -t "$SESSION_NAME" "$PROJECT_DIR/$name.sh; exec bash"
      tmux select-layout -t "$SESSION_NAME" tiled >/dev/null
    fi
  done

  echo "Started tmux session: $SESSION_NAME"
  echo "Attach with: tmux attach -t $SESSION_NAME"
  while true; do
    done_count="$(find "$STATUS_DIR" -name '*.status' | wc -l | tr -d ' ')"
    if [ "$done_count" -ge "$((${#TASKS[@]} + 1))" ]; then
      break
    fi
    sleep 2
  done
else
  for task in "${TASKS[@]}"; do
    name="${task%%:*}"
    fn="${task#*:}"
    run_logged "$name" "$fn"
  done
fi

failed=0
for status_file in "$STATUS_DIR"/*.status; do
  status="$(cat "$status_file")"
  name="$(basename "$status_file" .status)"
  if [ "$status" -ne 0 ]; then
    echo "FAILED: $name (status $status). Log: $LOG_DIR/$name.log" >&2
    failed=1
  fi
done

if [ "$failed" -ne 0 ]; then
  exit 1
fi

echo "Smoke checks passed."
echo "Project: $PROJECT_DIR"
