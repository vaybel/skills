import { closeMCPClient } from "../../client.js";
import {
  type BrandDNA,
  type CatalogProduct,
  type MockupGender,
  type MockupKind,
  type MockupQuality,
  checkCredits,
  generateDesign,
  generateMockup,
  getBrandDNA,
  listBlanks,
  waitForDesign,
  waitForMockup,
} from "../../servers/vaybel/index.js";

const DEFAULT_CATEGORY = "shirt";
const DEFAULT_LIMIT = 10;
const DEFAULT_DESIGN_TIMEOUT = 600;
const DEFAULT_MOCKUP_TIMEOUT = 300;
const DESIGN_CREDITS = 10;
const MOCKUP_CREDIT_UNIT = 2;
const FLAT_MOCKUP_COUNT = 2;
const VTO_MOCKUP_COUNT = 3;
const DETAIL_CLOSEUP_COUNT = 3;
const LISTING_MINIMUM_MOCKUPS = 5;

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
  mockup_plan: MockupPlanSummary;
  mockups: Array<{
    id: string;
    external_key: string;
    image_url: string | null;
    status: string;
  }>;
  dashboard_url: string;
}

interface MockupPlan {
  kinds: MockupKind[];
  audience_key: string;
  audience_label: string;
  gender?: MockupGender;
  expected_count: number;
  detail_closeups: "included" | "skipped_for_aop";
}

interface MockupPlanSummary extends MockupPlan {
  listing_minimum: number;
  completed_count: number;
  listing_ready: boolean;
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

  const [brand, product] = await Promise.all([getBrandDNA(), resolveProduct(options)]);
  const mockupPlan = buildMockupPlan(product, brand);
  const requiredCredits = DESIGN_CREDITS + estimateMockupCredits(mockupPlan);
  const credits = await checkCredits({ required: requiredCredits });
  if (!credits.sufficient) {
    throw new Error(
      `Insufficient credits: balance=${credits.balance}, required=${credits.required}`,
    );
  }

  const prompt = buildPrompt(options.prompt, brand, product);
  const designTask = await generateDesign({
    product_uuid: product.uuid,
    prompt,
  });

  const design = await waitForDesign(designTask.task_id, options.designTimeoutSec);
  if (design.status !== "complete" || !design.design_id) {
    throw new Error(
      `Design did not complete: status=${design.status}, stage=${design.stage || "unknown"}, error=${design.error || "none"}`,
    );
  }

  const mockupTask = await generateMockup({
    design_id: design.design_id,
    kinds: mockupPlan.kinds,
    audience_key: mockupPlan.audience_key,
    ...(mockupPlan.gender ? { gender: mockupPlan.gender } : {}),
    quality: options.quality,
  });

  const mockupStatus = await waitForMockup(mockupTask.mockup_ids, options.mockupTimeoutSec);

  if (mockupStatus.status !== "complete") {
    throw new Error(`Mockups did not complete: status=${mockupStatus.status}`);
  }

  const mockups = mockupStatus.mockups.map((mockup) => ({
    id: mockup.id,
    external_key: mockup.external_key,
    image_url: mockup.image_url,
    status: mockup.status,
  }));
  const completedCount = listingReadyMockupCount(mockups);
  if (completedCount < LISTING_MINIMUM_MOCKUPS) {
    throw new Error(
      `Listing mockup minimum not met: expected at least ${LISTING_MINIMUM_MOCKUPS} completed image mockups, got ${completedCount}`,
    );
  }

  return {
    product,
    design: {
      id: design.design_id,
      image_url: design.image_url,
    },
    mockup_plan: {
      ...mockupPlan,
      listing_minimum: LISTING_MINIMUM_MOCKUPS,
      completed_count: completedCount,
      listing_ready: completedCount >= LISTING_MINIMUM_MOCKUPS,
    },
    mockups,
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
  if (isAopProduct(product)) {
    context.push(
      "AOP direction: create a full-garment, edge-to-edge all-over-print suitable for front and back flats. Avoid a single centered chest graphic unless the user explicitly asks for placement art.",
    );
  }

  return [prompt.trim(), ...context].join("\n\n");
}

function buildMockupPlan(product: CatalogProduct, brand: BrandDNA): MockupPlan {
  const audience = selectVtoAudience(product, brand);
  if (!audience) {
    throw new Error(
      "Listing-ready mockups require a Brand DNA audience with VTO-compatible gender options. Add or update an audience in Vaybel Brand Kit, then rerun.",
    );
  }

  const kinds: MockupKind[] = ["flat", "vto"];
  const includeDetailCloseups = !isAopProduct(product);
  if (includeDetailCloseups) {
    kinds.push("detail_closeup");
  }

  const plan: MockupPlan = {
    kinds,
    audience_key: audience.key,
    audience_label: audience.label,
    expected_count:
      FLAT_MOCKUP_COUNT + VTO_MOCKUP_COUNT + (includeDetailCloseups ? DETAIL_CLOSEUP_COUNT : 0),
    detail_closeups: includeDetailCloseups ? "included" : "skipped_for_aop",
  };
  if (audience.gender) {
    plan.gender = audience.gender;
  }
  return plan;
}

function selectVtoAudience(
  product: CatalogProduct,
  brand: BrandDNA,
): { key: string; label: string; gender?: MockupGender } | null {
  const audiences = (brand.audiences || []).filter((audience) => audience.key);
  if (!audiences.length) {
    return null;
  }

  const productGenders = normalizedVtoGenders(product.genders);
  for (const audience of audiences) {
    const audienceGenders = normalizedVtoGenders(audience.gender_options);
    if (!audienceGenders.length) {
      continue;
    }

    if (!productGenders.length) {
      return {
        key: audience.key,
        label: audience.label || audience.key,
      };
    }

    const overlap = productGenders.filter((gender) => audienceGenders.includes(gender));
    if (overlap.length) {
      const selection: { key: string; label: string; gender?: MockupGender } = {
        key: audience.key,
        label: audience.label || audience.key,
      };
      const gender = overlap.length === 1 ? overlap[0] : undefined;
      if (gender) {
        selection.gender = gender;
      }
      return selection;
    }
  }

  return null;
}

function normalizedVtoGenders(values: Array<string | undefined> | undefined): MockupGender[] {
  const genders: MockupGender[] = [];
  for (const value of values || []) {
    if (isUnisexGenderValue(value)) {
      for (const gender of ["men", "women"] as const) {
        if (!genders.includes(gender)) {
          genders.push(gender);
        }
      }
      continue;
    }

    const normalized = normalizeVtoGender(value);
    if (normalized && !genders.includes(normalized)) {
      genders.push(normalized);
    }
  }
  return genders;
}

function isUnisexGenderValue(value: string | undefined): boolean {
  return /^(unisex|all[-_\s]?gender|all|any)$/i.test((value || "").trim());
}

function normalizeVtoGender(value: string | undefined): MockupGender | null {
  const normalized = (value || "").trim().toLowerCase();
  if (["men", "mens", "men's", "male", "males"].includes(normalized)) {
    return "men";
  }
  if (["women", "womens", "women's", "female", "females", "ladies"].includes(normalized)) {
    return "women";
  }
  return null;
}

function estimateMockupCredits(plan: MockupPlan): number {
  return plan.expected_count * MOCKUP_CREDIT_UNIT;
}

function listingReadyMockupCount(mockups: LaunchSummary["mockups"]): number {
  return mockups.filter((mockup) => mockup.status === "complete" && Boolean(mockup.image_url)).length;
}

function isAopProduct(product: CatalogProduct): boolean {
  const technique = (product.default_technique || "").toLowerCase();
  const searchable = [
    product.vaybel_sku,
    product.handle,
    product.name,
    product.title,
    product.type,
    product.category,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    technique === "cut-sew" ||
    technique === "direct-to-fabric" ||
    /\baop\b|all[- ]over[- ]print|cut[- ]sew/.test(searchable)
  );
}

function renderMarkdown(summary: LaunchSummary): string {
  const productTitle = summary.product.title || summary.product.uuid;
  const mockupSections = renderMockupSections(summary.mockups);
  const plan = summary.mockup_plan;

  return [
    "# Vaybel Launch Summary",
    "",
    `- Product: ${productTitle}`,
    `- Design: ${designLink(summary.design)}`,
    `- Mockup plan: ${mockupPlanLabel(plan)}`,
    `- Listing-ready mockups: ${plan.completed_count}/${plan.listing_minimum}`,
    "",
    "## Mockups",
    mockupSections || "- none",
    "",
    `Continue in dashboard: ${summary.dashboard_url}`,
  ].join("\n");
}

function mockupPlanLabel(plan: MockupPlanSummary): string {
  const parts = ["front/back product flats", "3 VTO"];
  if (plan.detail_closeups === "included") {
    parts.push("DTG/detail close-ups");
  }
  const audience = plan.gender
    ? `${plan.audience_label} (${plan.audience_key}, ${plan.gender})`
    : `${plan.audience_label} (${plan.audience_key}, server-selected gender)`;
  return `${parts.join(" + ")} via ${audience}`;
}

function designLink(design: LaunchSummary["design"]): string {
  if (!design.image_url) {
    return `Generated design (${design.id})`;
  }
  return `[Generated design](${design.image_url})`;
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
  if (
    normalizedParts.length &&
    normalizedParts.every((part) => ["default", "design", "image"].includes(part))
  ) {
    return fallback;
  }
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
