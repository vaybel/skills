import { closeMCPClient } from "../../client.js";
import {
  type BrandDNA,
  type CatalogProduct,
  type MockupQuality,
  checkCredits,
  generateDesign,
  generateMockup,
  getBrandDNA,
  getDesignStatus,
  getMockupStatus,
  listBlanks,
} from "../../servers/vaybel/index.js";

const DEFAULT_CATEGORY = "shirt";
const DEFAULT_LIMIT = 10;
const DEFAULT_DESIGN_TIMEOUT = 600;
const DEFAULT_MOCKUP_TIMEOUT = 300;
const DESIGN_CREDITS = 10;
const PRO_MOCKUP_PREFLIGHT_CREDITS = 2;

interface Options {
  prompt: string;
  product?: string;
  category?: string;
  technique?: string;
  search?: string;
  quality: MockupQuality;
  limit: number;
  designTimeoutSec: number;
  mockupTimeoutSec: number;
  json: boolean;
}

interface LaunchSummary {
  product: CatalogProduct | { uuid: string; title: string };
  design: {
    id: string;
    image_url: string | null;
  };
  mockups: Array<{
    id: string;
    external_key: string;
    image_url: string | null;
    status: string;
  }>;
  dashboard_url: string;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  try {
    const summary = await launchProduct(options);
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(renderMarkdown(summary));
    }
  } finally {
    await closeMCPClient();
  }
}

async function launchProduct(options: Options): Promise<LaunchSummary> {
  preflightEnvironment();

  const requiredCredits =
    DESIGN_CREDITS + (options.quality === "pro" ? PRO_MOCKUP_PREFLIGHT_CREDITS : 0);
  const credits = await checkCredits({ required: requiredCredits });
  if (!credits.sufficient) {
    throw new Error(
      `Insufficient credits: balance=${credits.balance}, required=${credits.required}`,
    );
  }

  const [brand, product] = await Promise.all([getBrandDNA(), resolveProduct(options)]);

  const prompt = buildPrompt(options.prompt, brand, product);
  const designTask = await generateDesign({
    product_uuid: product.uuid,
    prompt,
  });

  const design = await pollDesignStatus(designTask.task_id, options.designTimeoutSec);
  if (design.status !== "complete" || !design.design_id) {
    throw new Error(
      `Design did not complete: status=${design.status}, stage=${design.stage || "unknown"}, error=${design.error || "none"}`,
    );
  }

  const mockupTask = await generateMockup({
    design_id: design.design_id,
    quality: options.quality,
  });

  const mockupStatus = mockupTask.task_id
    ? await pollMockupStatus(mockupTask.mockup_ids, options.mockupTimeoutSec)
    : await getMockupStatus(mockupTask.mockup_ids);

  if (mockupStatus.status !== "complete") {
    throw new Error(`Mockups did not complete: status=${mockupStatus.status}`);
  }

  return {
    product,
    design: {
      id: design.design_id,
      image_url: design.image_url,
    },
    mockups: mockupStatus.mockups.map((mockup) => ({
      id: mockup.id,
      external_key: mockup.external_key,
      image_url: mockup.image_url,
      status: mockup.status,
    })),
    dashboard_url: dashboardUrl(design.design_id),
  };
}

async function resolveProduct(options: Options): Promise<CatalogProduct> {
  if (options.product) {
    if (looksLikeUuid(options.product)) {
      return {
        uuid: options.product,
        vaybel_sku: "",
        handle: "",
        name: options.product,
        title: options.product,
        type: "",
        brand: "",
        default_technique: null,
        category: "",
      };
    }

    const bySku = await listBlanks({
      search: options.product,
      limit: options.limit,
    });
    const exact = bySku.products.find(
      (product) => product.vaybel_sku.toLowerCase() === options.product?.toLowerCase(),
    );
    if (exact) {
      return exact;
    }
    if (bySku.products[0]) {
      return bySku.products[0];
    }
    throw new Error(`No catalog product matched --product ${options.product}`);
  }

  const query: {
    search?: string;
    technique?: string;
    category: string;
    limit: number;
  } = {
    category: options.category || DEFAULT_CATEGORY,
    limit: options.limit,
  };
  if (options.search) {
    query.search = options.search;
  }
  if (options.technique) {
    query.technique = options.technique;
  }

  let result = await listBlanks(query);

  if (!result.products[0] && (options.category || "").toLowerCase() === "tee") {
    const teeFallback: {
      search: string;
      technique?: string;
      limit: number;
    } = {
      search: options.search || "tee",
      limit: options.limit,
    };
    if (options.technique) {
      teeFallback.technique = options.technique;
    }
    result = await listBlanks(teeFallback);
  }

  if (!result.products[0]) {
    throw new Error(
      `No catalog products matched category=${options.category || DEFAULT_CATEGORY}, technique=${options.technique || "any"}, search=${options.search || "none"}`,
    );
  }

  return result.products[0];
}

function buildPrompt(prompt: string, brand: BrandDNA, product: CatalogProduct): string {
  const context: string[] = [];
  if (brand.has_brand_kit) {
    if (brand.tone) {
      context.push(`Brand tone: ${brand.tone}`);
    }
    if (brand.colors?.length) {
      context.push(`Brand colors: ${brand.colors.slice(0, 5).join(", ")}`);
    }
    if (brand.brand_description) {
      context.push(`Brand context: ${brand.brand_description.slice(0, 500)}`);
    }
  }
  context.push(`Target blank: ${product.title || product.name || product.uuid}`);

  return [prompt.trim(), ...context].join("\n\n");
}

async function pollDesignStatus(taskId: string, timeoutSec: number) {
  const deadline = Date.now() + timeoutSec * 1000;
  let delayMs = 5000;
  let last = await getDesignStatus(taskId);

  while (last.status !== "complete" && last.status !== "failed" && Date.now() < deadline) {
    await sleep(delayMs);
    delayMs = Math.min(delayMs * 1.5, 20000);
    last = await getDesignStatus(taskId);
  }

  return last;
}

async function pollMockupStatus(mockupIds: string[], timeoutSec: number) {
  const deadline = Date.now() + timeoutSec * 1000;
  let delayMs = 3000;
  let last = await getMockupStatus(mockupIds);

  while (last.status !== "complete" && last.status !== "failed" && Date.now() < deadline) {
    await sleep(delayMs);
    delayMs = Math.min(delayMs * 1.5, 15000);
    last = await getMockupStatus(mockupIds);
  }

  return last;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function renderMarkdown(summary: LaunchSummary): string {
  const productTitle = summary.product.title || summary.product.uuid;
  const designLabel = assetLabel(summary.design.image_url, "Design placement");
  const mockupSections = renderMockupSections(summary.mockups);

  return [
    "# Vaybel Launch Summary",
    "",
    `- Product: ${productTitle}`,
    `- Design: ${assetLink(designLabel, summary.design.image_url, summary.design.id)}`,
    "",
    "## Mockups",
    mockupSections || "- none",
    "",
    `Continue in dashboard: ${summary.dashboard_url}`,
  ].join("\n");
}

function renderMockupSections(mockups: LaunchSummary["mockups"]): string {
  const grouped = new Map<string, LaunchSummary["mockups"]>();
  for (const mockup of mockups) {
    const section = mockupSection(mockup);
    const current = grouped.get(section) || [];
    current.push(mockup);
    grouped.set(section, current);
  }

  const sectionOrder = ["Product Flats", "Detail Close-Ups", "Virtual Try-On", "Lifestyle"];
  return sectionOrder
    .filter((section) => grouped.has(section))
    .map((section) => {
      const lines = sortMockups(grouped.get(section) || [])
        .map((mockup) => `- ${assetLink(mockupLabel(mockup, section), mockup.image_url, mockup.id)}`)
        .join("\n");
      return [`### ${section}`, lines].join("\n");
    })
    .join("\n\n");
}

function mockupSection(mockup: LaunchSummary["mockups"][number]): string {
  const text = searchableMockupText(mockup);
  if (/(detail|close.?up|closeup|graphic|fabric|construction|collage)/i.test(text)) {
    return "Detail Close-Ups";
  }
  if (/(vto|virtual|try.?on|model|worn|wearing|person)/i.test(text)) {
    return "Virtual Try-On";
  }
  if (/(lifestyle|scene|display|flat.?scene|product.?display)/i.test(text)) {
    return "Lifestyle";
  }
  return "Product Flats";
}

function sortMockups(mockups: LaunchSummary["mockups"]): LaunchSummary["mockups"] {
  const order = ["front", "flat", "back", "side 45", "side", "left", "right"];
  return [...mockups].sort((a, b) => {
    const aText = searchableMockupText(a).toLowerCase();
    const bText = searchableMockupText(b).toLowerCase();
    return orderIndex(aText, order) - orderIndex(bText, order);
  });
}

function orderIndex(text: string, order: string[]): number {
  const index = order.findIndex((part) => text.includes(part));
  return index === -1 ? order.length : index;
}

function mockupLabel(mockup: LaunchSummary["mockups"][number], section: string): string {
  const text = searchableMockupText(mockup);
  if (section === "Product Flats") {
    if (hasToken(text, "front")) return "Front Product Flat Image";
    if (hasToken(text, "back")) return "Back Product Flat Image";
    if (/side.?45/i.test(text)) return "Side 45 Product Flat Image";
    if (hasToken(text, "side")) return "Side Product Flat Image";
    return "Product Flat Image";
  }
  if (hasToken(text, "front")) return "Front";
  if (hasToken(text, "back")) return "Back";
  if (/side.?45/i.test(text)) return "Side 45";
  if (hasToken(text, "side")) return "Side";
  if (hasToken(text, "flat")) return "Flat";
  if (/detail|close.?up|closeup/i.test(text)) return "Detail close-up";
  if (/vto|virtual|try.?on/i.test(text)) return "Virtual try-on";
  if (/lifestyle|scene/i.test(text)) return "Lifestyle";
  return titleCase(assetLabel(mockup.image_url || mockup.external_key, "Mockup"));
}

function searchableMockupText(mockup: LaunchSummary["mockups"][number]): string {
  return [mockup.external_key, mockup.image_url, mockup.id].filter(Boolean).join(" ");
}

function hasToken(value: string, token: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${token}([^a-z0-9]|$)`, "i").test(value);
}

function assetLink(label: string, url: string | null, fallbackId: string): string {
  if (!url) {
    return `${label} (${fallbackId})`;
  }
  return `[${label}](${url})`;
}

function assetLabel(urlOrKey: string | null, fallback: string): string {
  if (!urlOrKey) {
    return fallback;
  }
  const basename = urlOrKey.split("?")[0]?.split("/").pop() || urlOrKey;
  const withoutExt = basename.replace(/\.[a-z0-9]+$/i, "");
  const parts = withoutExt
    .replace(/[a-f0-9]{8,}(-[a-f0-9]{4,})*/gi, "")
    .split(/[_\-\s]+/)
    .filter(Boolean);
  const normalizedParts = parts.map((part) => part.toLowerCase());
  if (normalizedParts.includes("front")) {
    return "Cropped front placement";
  }
  if (normalizedParts.includes("back")) {
    return "Cropped back placement";
  }
  return parts.length ? titleCase(parts.join(" ")) : fallback;
}

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    prompt: "",
    quality: "pro",
    limit: DEFAULT_LIMIT,
    designTimeoutSec: DEFAULT_DESIGN_TIMEOUT,
    mockupTimeoutSec: DEFAULT_MOCKUP_TIMEOUT,
    json: false,
  };

  const promptParts: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--product") {
      options.product = readValue(args, ++index, arg);
    } else if (arg === "--category") {
      options.category = readValue(args, ++index, arg);
    } else if (arg === "--technique") {
      options.technique = readValue(args, ++index, arg);
    } else if (arg === "--search") {
      options.search = readValue(args, ++index, arg);
    } else if (arg === "--quality") {
      const quality = readValue(args, ++index, arg);
      if (quality !== "standard" && quality !== "pro") {
        throw new Error(`--quality must be 'pro' or 'standard' (got '${quality}')`);
      }
      options.quality = quality;
    } else if (arg === "--limit") {
      options.limit = Number(readValue(args, ++index, arg));
    } else if (arg === "--design-timeout") {
      options.designTimeoutSec = Number(readValue(args, ++index, arg));
    } else if (arg === "--mockup-timeout") {
      options.mockupTimeoutSec = Number(readValue(args, ++index, arg));
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      promptParts.push(arg);
    }
  }

  options.prompt = promptParts.join(" ").trim();
  if (!options.prompt) {
    throw new Error("Prompt is required.");
  }
  if (!Number.isFinite(options.limit) || options.limit < 1 || options.limit > 100) {
    throw new Error("--limit must be between 1 and 100");
  }

  return options;
}

function readValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

function preflightEnvironment(): void {
  if (
    !process.env.VAYBEL_PAT &&
    !process.env.VAYBEL_MCP_TOKEN &&
    !process.env.CLAUDE_PLUGIN_OPTION_vaybel_pat
  ) {
    throw new Error("Set VAYBEL_PAT or configure the Vaybel PAT plugin option before running this skill.");
  }
}

function dashboardUrl(designId: string): string {
  const base = process.env.VAYBEL_APP_URL || process.env.CLAUDE_PLUGIN_OPTION_app_url || "https://vaybel.com";
  return `${base.replace(/\/$/, "")}/dashboard/launch/${designId}`;
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`vaybel-launch-product failed: ${message}`);
  process.exitCode = 1;
});
