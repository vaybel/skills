#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const errors = [];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function readJson(file) {
  return JSON.parse(read(file));
}

function exists(file) {
  return fs.existsSync(path.join(root, file));
}

function fail(message) {
  errors.push(message);
}

function parseFrontmatter(file) {
  const text = read(file);
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    fail(`${file}: missing YAML frontmatter`);
    return {};
  }

  const data = {};
  const lines = match[1].split("\n");
  let currentKey = null;
  for (const line of lines) {
    const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      currentKey = keyMatch[1];
      const value = keyMatch[2];
      if (value === "|") {
        data[currentKey] = "";
      } else {
        data[currentKey] = stripQuotes(value);
      }
      continue;
    }
    if (currentKey && line.startsWith("  ")) {
      data[currentKey] = `${data[currentKey] || ""}\n${line.trimEnd()}`;
    }
  }
  return data;
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function listSkillDirs() {
  const skillsDir = path.join(root, "skills");
  if (!fs.existsSync(skillsDir)) {
    fail("skills/ directory missing");
    return [];
  }
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `skills/${entry.name}`);
}

function validateVersions(skillDirs) {
  const version = read("VERSION").trim();
  const pkg = readJson("package.json");
  if (pkg.version !== version) {
    fail(`package.json version ${pkg.version} != VERSION ${version}`);
  }

  for (const file of [
    ".claude-plugin/plugin.json",
    ".codex-plugin/plugin.json",
    ".cursor-plugin/plugin.json",
  ]) {
    const manifest = readJson(file);
    if (manifest.version !== version) {
      fail(`${file} version ${manifest.version} != VERSION ${version}`);
    }
  }

  const marketplace = readJson(".claude-plugin/marketplace.json");
  const pluginVersion = marketplace.plugins?.[0]?.version;
  if (pluginVersion !== version) {
    fail(`.claude-plugin/marketplace.json plugins[0].version ${pluginVersion} != VERSION ${version}`);
  }

  for (const dir of skillDirs) {
    const frontmatter = parseFrontmatter(`${dir}/SKILL.md`);
    if (frontmatter.version !== version) {
      fail(`${dir}/SKILL.md version ${frontmatter.version} != VERSION ${version}`);
    }
  }
}

function validateSkills(skillDirs) {
  for (const dir of skillDirs) {
    const skillFile = `${dir}/SKILL.md`;
    if (!exists(skillFile)) {
      fail(`${skillFile} missing`);
      continue;
    }
    if (!exists(`${dir}/run.ts`)) {
      fail(`${dir}/run.ts missing`);
    }

    const text = read(skillFile);
    const lineCount = text.split("\n").length;
    if (lineCount > 300) {
      fail(`${skillFile} has ${lineCount} lines; max is 300`);
    }

    const frontmatter = parseFrontmatter(skillFile);
    for (const key of ["name", "version", "description", "argument-hint", "allowed-tools"]) {
      if (!frontmatter[key]) {
        fail(`${skillFile}: frontmatter missing ${key}`);
      }
    }
    if (!String(frontmatter.description || "").includes("Use when")) {
      fail(`${skillFile}: description must include Use when trigger text`);
    }
    if (!String(frontmatter.description || "").includes("NOT for")) {
      fail(`${skillFile}: description must include NOT for boundary text`);
    }
    const tools = String(frontmatter["allowed-tools"] || "");
    if (!tools.includes("Bash(npm *)") || !tools.includes("Read")) {
      fail(`${skillFile}: allowed-tools must include Bash(npm *) and Read`);
    }
    if (tools.includes("Bash(vb") || tools.includes("curl")) {
      fail(`${skillFile}: allowed-tools must not allow Vaybel CLI or curl`);
    }
  }
}

function validateMarketplace(skillDirs) {
  const marketplace = readJson(".claude-plugin/marketplace.json");
  const plugin = marketplace.plugins?.[0];
  if (marketplace.name !== "vaybel") {
    fail(".claude-plugin/marketplace.json name must be vaybel");
  }
  if (plugin?.name !== "vaybel") {
    fail(".claude-plugin/marketplace.json plugins[0].name must be vaybel");
  }
  if (plugin?.source !== "./") {
    fail(".claude-plugin/marketplace.json plugins[0].source must be ./");
  }
  if (plugin?.skills) {
    fail(".claude-plugin/marketplace.json must not include plugins[0].skills; Claude discovers skills from the installed plugin");
  }

  for (const dir of skillDirs) {
    const frontmatter = parseFrontmatter(`${dir}/SKILL.md`);
    if (!frontmatter.name) {
      fail(`${dir}/SKILL.md missing skill name for /vaybel:<skill-name>`);
    }
  }
}

function validateClaudePlugin() {
  const plugin = readJson(".claude-plugin/plugin.json");
  if (plugin.skills !== "./skills/") {
    fail(".claude-plugin/plugin.json skills must be ./skills/");
  }
  if (!plugin.userConfig?.vaybel_pat?.sensitive) {
    fail(".claude-plugin/plugin.json must define sensitive userConfig.vaybel_pat");
  }
  if (plugin.userConfig?.vaybel_pat?.required) {
    fail(".claude-plugin/plugin.json userConfig.vaybel_pat must be optional; VAYBEL_PAT is the canonical secret");
  }
}

function validateReferences(skillDirs) {
  for (const dir of skillDirs) {
    const skillFile = `${dir}/SKILL.md`;
    const text = read(skillFile);
    const refs = [...text.matchAll(/references\/[a-zA-Z0-9_.\/-]+\.md/g)].map((match) => match[0]);
    for (const ref of refs) {
      if (!exists(`${dir}/${ref}`)) {
        fail(`${skillFile} references missing file ${ref}`);
      }
    }

    const refDir = path.join(root, dir, "references");
    if (!fs.existsSync(refDir)) {
      continue;
    }
    for (const file of fs.readdirSync(refDir).filter((name) => name.endsWith(".md"))) {
      if (!text.includes(file)) {
        fail(`${dir}/references/${file} is not linked from SKILL.md`);
      }
    }
  }
}

function validateForbiddenPatterns() {
  const checkedDirs = ["client.ts", "servers", "skills"];
  const files = walk(checkedDirs).filter((file) => /\.(md|ts|tsx|js|mjs|json|ya?ml)$/.test(file));
  const patterns = [
    { regex: /\bvb\s+/, label: "Vaybel CLI call" },
    { regex: /\bcurl\b/, label: "curl call" },
    { regex: /api\.vaybel\.com/, label: "private API host" },
    { regex: /\/api\//, label: "private REST path" },
  ];

  for (const file of files) {
    const text = read(file);
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        fail(`${file}: forbidden ${pattern.label}`);
      }
    }
  }
}

function validateAssets() {
  const codex = readJson(".codex-plugin/plugin.json");
  for (const key of ["composerIcon", "logo"]) {
    const value = codex.interface?.[key];
    if (value && !exists(value.replace(/^\.\//, ""))) {
      fail(`.codex-plugin/plugin.json interface.${key} points to missing ${value}`);
    }
  }
}

function validateWrappers() {
  const expectedTools = [
    "get_brand_dna",
    "list_blanks",
    "check_credits",
    "generate_design",
    "get_design_status",
    "wait_for_design",
    "generate_mockup",
    "get_mockup_status",
    "wait_for_mockup",
  ];
  const wrapperText = walk(["servers/vaybel"]).map(read).join("\n");
  for (const tool of expectedTools) {
    if (!wrapperText.includes(tool)) {
      fail(`servers/vaybel wrappers do not reference ${tool}`);
    }
  }
}

function walk(entries) {
  const files = [];
  for (const entry of entries) {
    const full = path.join(root, entry);
    if (!fs.existsSync(full)) {
      continue;
    }
    const stat = fs.statSync(full);
    if (stat.isFile()) {
      files.push(entry);
    } else if (stat.isDirectory()) {
      for (const child of fs.readdirSync(full)) {
        files.push(...walk([path.join(entry, child)]));
      }
    }
  }
  return files;
}

const skillDirs = listSkillDirs();
validateVersions(skillDirs);
validateSkills(skillDirs);
validateMarketplace(skillDirs);
validateClaudePlugin();
validateReferences(skillDirs);
validateForbiddenPatterns();
validateAssets();
validateWrappers();

if (errors.length) {
  for (const error of errors) {
    console.error(`ERROR: ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${skillDirs.length} skill(s), manifests, wrappers, assets, and references.`);
