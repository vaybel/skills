#!/usr/bin/env node
/**
 * Generate Starlight pages from the repository's canonical sources.
 *
 * The site never stores a second copy of the docs. Every page under a
 * generated directory is rebuilt from skills/, the plugin manifests, and the
 * root Markdown files, so the published site cannot drift from the skills it
 * documents. Generated output is gitignored.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteRoot, "..");
const docsRoot = path.join(siteRoot, "src", "content", "docs");
const blobBase = "https://github.com/vaybel/skills/blob/main";

/** Directories under src/content/docs/ that this script owns and rewrites. */
const GENERATED_DIRS = ["skills", "start", "project", "cookbook.md"];

function readRepo(file) {
  return fs.readFileSync(path.join(repoRoot, file), "utf8");
}

function writePage(relPath, frontmatter, body) {
  const target = path.join(docsRoot, relPath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const yaml = Object.entries(frontmatter)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join("\n");
  fs.writeFileSync(target, `---\n${yaml}\n---\n\n${body.trimStart()}`);
  return relPath;
}

/** Minimal frontmatter reader for the flat, hand-written SKILL.md dialect. */
function splitFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { data: {}, body: text };

  const data = {};
  let key = null;
  for (const line of match[1].split("\n")) {
    const keyMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (keyMatch) {
      key = keyMatch[1];
      const value = keyMatch[2].trim();
      data[key] = value === "|" || value === ">" ? "" : unquote(value);
      continue;
    }
    if (key && /^\s+\S/.test(line)) {
      data[key] = `${data[key] ? `${data[key]} ` : ""}${line.trim()}`;
    }
  }
  return { data, body: text.slice(match[0].length) };
}

function unquote(value) {
  const trimmed = value.trim();
  const quoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  return quoted ? trimmed.slice(1, -1) : trimmed;
}

/** Drop a leading `# Heading` so Starlight's own title is not duplicated. */
function stripTitle(body) {
  return body.replace(/^\s*#\s+.*\n+/, "");
}

function titleCase(slug) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** First sentence of a skill description, used as the page/card summary. */
function firstSentence(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  const stop = clean.search(/\.\s/);
  return stop === -1 ? clean : clean.slice(0, stop + 1);
}

function clearGenerated() {
  for (const entry of GENERATED_DIRS) {
    fs.rmSync(path.join(docsRoot, entry), { recursive: true, force: true });
  }
}

function listSkills() {
  const skillsDir = path.join(repoRoot, "skills");
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/**
 * Rewrite `references/foo.md` links so they resolve to the generated
 * reference pages instead of 404ing against the repo layout.
 */
function linkReferences(body, slug, base) {
  return body.replace(/`references\/([a-zA-Z0-9_-]+)\.md`/g, (_, name) => {
    return `[${titleCase(name)}](${base}/skills/${slug}/${name}/)`;
  });
}

function syncSkills(base) {
  const written = [];
  for (const slug of listSkills()) {
    const skillPath = `skills/${slug}/SKILL.md`;
    const { data, body } = splitFrontmatter(readRepo(skillPath));
    const summary = firstSentence(data.description || "");
    const hint = data["argument-hint"] || "";

    const header = [
      `<div class="vb-invoke">`,
      ``,
      `<p class="vb-invoke-label">Invoke</p>`,
      ``,
      "```text wrap",
      `/${data.name}${hint ? ` ${hint}` : ""}`,
      "```",
      ``,
      `</div>`,
      ``,
      `**When to use it.** ${(data.description || "").replace(/\s+/g, " ").trim()}`,
      ``,
      `Everything below is the skill's instruction file as the agent receives it.`,
      ``,
    ].join("\n");

    written.push(
      writePage(
        `skills/${slug}.md`,
        {
          title: titleCase(slug),
          description: summary,
          editUrl: `${blobBase}/${skillPath}`,
          sidebar: { order: SKILL_ORDER.indexOf(slug) + 1 },
        },
        `${header}\n${linkReferences(stripTitle(body), slug, base)}`,
      ),
    );

    const refDir = path.join(repoRoot, "skills", slug, "references");
    if (!fs.existsSync(refDir)) continue;

    for (const file of fs.readdirSync(refDir).filter((n) => n.endsWith(".md"))) {
      const name = file.replace(/\.md$/, "");
      const refPath = `skills/${slug}/references/${file}`;
      const refBody = readRepo(refPath);
      const heading = refBody.match(/^\s*#\s+(.*)$/m);
      written.push(
        writePage(
          `skills/${slug}/${name}.md`,
          {
            title: heading ? heading[1].trim() : titleCase(name),
            description: `${titleCase(slug)} reference: ${titleCase(name)}.`,
            editUrl: `${blobBase}/${refPath}`,
          },
          stripTitle(refBody),
        ),
      );
    }
  }
  return written;
}

/**
 * Root Markdown files that become site pages verbatim.
 *
 * DEPLOYMENT.md is deliberately excluded: it is an internal release runbook,
 * useful in the repo but not something to publish as a navigable docs page.
 */
const ROOT_PAGES = [
  {
    source: "INSTALL.md",
    target: "start/install.md",
    title: "Install",
    description: "Install Vaybel Skills through the Claude Code marketplace or a local clone.",
    order: 1,
  },
  {
    source: "INSTALL_FOR_AGENTS.md",
    target: "start/for-agents.md",
    title: "Install for agents",
    description: "Instructions an agent can follow when asked to install Vaybel Skills.",
    order: 2,
  },
  {
    source: "COOKBOOK.md",
    target: "cookbook.md",
    title: "Cookbook",
    description: "Copy-paste recipes for the most common Vaybel workflows.",
  },
  {
    source: "CONTRIBUTING.md",
    target: "project/contributing.md",
    title: "Contributing",
    description: "Rules and checks for changing Vaybel Skills.",
    order: 1,
  },
  {
    source: "SECURITY.md",
    target: "project/security.md",
    title: "Security",
    description: "How to report vulnerabilities and how secrets are handled.",
    order: 2,
  },
];

function syncRootPages() {
  return ROOT_PAGES.map(({ source, target, title, description, order }) =>
    writePage(
      target,
      {
        title,
        description,
        editUrl: `${blobBase}/${source}`,
        ...(order ? { sidebar: { order } } : {}),
      },
      stripTitle(readRepo(source)),
    ),
  );
}

/** Order used for both the sidebar and the home-page skill cards. */
const SKILL_ORDER = ["find-trend", "launch-product", "optimize-product", "make-content", "analyze-insights"];

/**
 * Skill metadata consumed by astro.config.mjs and the home page, so the
 * sidebar and cards stay in step with skills/ without a second edit.
 */
function writeSkillIndex() {
  const skills = listSkills()
    .map((slug) => {
      const { data } = splitFrontmatter(readRepo(`skills/${slug}/SKILL.md`));
      return {
        slug,
        name: data.name,
        title: titleCase(slug),
        summary: firstSentence(data.description || ""),
        argumentHint: data["argument-hint"] || "",
        references: referenceNames(slug),
      };
    })
    .sort((a, b) => SKILL_ORDER.indexOf(a.slug) - SKILL_ORDER.indexOf(b.slug));

  const version = readRepo("VERSION").trim();
  const target = path.join(siteRoot, "src", "generated", "skills.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify({ version, skills }, null, 2)}\n`);
  return skills;
}

function referenceNames(slug) {
  const refDir = path.join(repoRoot, "skills", slug, "references");
  if (!fs.existsSync(refDir)) return [];
  return fs
    .readdirSync(refDir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.replace(/\.md$/, ""))
    .sort();
}

const base = process.env.SITE_BASE ?? "/skills";
clearGenerated();
const skills = writeSkillIndex();
const pages = [...syncSkills(base), ...syncRootPages()];
console.log(`Synced ${skills.length} skill(s) into ${pages.length} generated page(s).`);
