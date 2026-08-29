// @ts-check
import fs from "node:fs";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

/**
 * Skill metadata written by scripts/sync-docs.mjs. The sidebar is derived from
 * it so adding a skill to skills/ is the only edit needed to publish one.
 */
const skillIndexUrl = new URL("./src/generated/skills.json", import.meta.url);
if (!fs.existsSync(skillIndexUrl)) {
  throw new Error("Missing src/generated/skills.json. Run `npm run sync` in docs-site/ first.");
}
const { skills } = JSON.parse(fs.readFileSync(skillIndexUrl, "utf8"));

const skillItems = skills.map((skill) =>
  skill.references.length === 0
    ? { slug: `skills/${skill.slug}` }
    : {
        label: skill.title,
        collapsed: true,
        items: [
          { slug: `skills/${skill.slug}`, label: "Overview" },
          ...skill.references.map((name) => ({ slug: `skills/${skill.slug}/${name}` })),
        ],
      },
);

const SITE = "https://vaybel.github.io/skills";

export default defineConfig({
  site: "https://vaybel.github.io",
  base: "/skills",
  integrations: [
    starlight({
      title: "Vaybel Skills",
      description:
        "Agent skills that run print-on-demand workflows — trend discovery, product launch, provider optimization, social content, and insights — through the public Vaybel MCP server.",
      logo: {
        src: "./src/assets/vaybel-icon.svg",
        alt: "Vaybel",
      },
      favicon: "/favicon.svg",
      head: [
        // Social preview card; regenerate with `node scripts/make-og.mjs`.
        { tag: "meta", attrs: { property: "og:image", content: `${SITE}/og.png` } },
        { tag: "meta", attrs: { property: "og:image:width", content: "1200" } },
        { tag: "meta", attrs: { property: "og:image:height", content: "630" } },
        { tag: "meta", attrs: { name: "twitter:image", content: `${SITE}/og.png` } },
        { tag: "link", attrs: { rel: "preconnect", href: "https://fonts.googleapis.com" } },
        {
          tag: "link",
          attrs: { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
        },
        {
          tag: "link",
          attrs: {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
          },
        },
      ],
      customCss: ["./src/styles/custom.css"],
      components: {
        // Wraps the default footer to add the vaybel.com call to action.
        Footer: "./src/components/Footer.astro",
      },
      editLink: {
        baseUrl: "https://github.com/vaybel/skills/edit/main/docs-site/",
      },
      lastUpdated: true,
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/vaybel/skills",
        },
      ],
      sidebar: [
        { label: "Start here", items: [{ autogenerate: { directory: "start" } }] },
        { label: "Skills", items: skillItems },
        { label: "Cookbook", slug: "cookbook" },
        { label: "Project", collapsed: true, items: [{ autogenerate: { directory: "project" } }] },
      ],
    }),
  ],
});
