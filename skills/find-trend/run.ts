import { closeMCPClient } from "../../client.js";
import {
  generateLaunchConcept,
  getTrendMatch,
  listSeasonalEvents,
  listTrends,
  type TrendMatch,
  type TrendView,
  waitForLaunchConcept,
} from "../../servers/vaybel/index.js";
import {
  dashboardUrl,
  isRecord,
  parsePositiveInt,
  preflightEnvironment,
  readValue,
  stringifyValue,
  truncate,
} from "../shared.js";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_TIMEOUT_SEC = 180;

interface Options {
  view: TrendView;
  productType?: string;
  matchId?: string;
  page: number;
  pageSize: number;
  concept: boolean;
  timeoutSec: number;
  includeSeasonalEvents: boolean;
  json: boolean;
}

interface ConceptProduct {
  product_uuid: string | null;
  title: string;
  technique: string | null;
  concept: string;
  colors: string[];
  design_id: string | null;
}

interface TrendSummary {
  trend: TrendMatch;
  concept_products: ConceptProduct[];
  seasonal_events?: unknown[];
  dashboard_url: string;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  try {
    const summary = await findTrend(options);
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(renderMarkdown(summary));
    }
  } finally {
    await closeMCPClient();
  }
}

async function findTrend(options: Options): Promise<TrendSummary> {
  preflightEnvironment();

  let trend: TrendMatch;
  const seasonalEvents = options.includeSeasonalEvents ? (await listSeasonalEvents()).events : undefined;

  if (options.matchId) {
    trend = await getTrendMatch(options.matchId);
  } else {
    const listInput: {
      view: TrendView;
      page: number;
      page_size: number;
      product_type?: string;
    } = {
      view: options.view,
      page: options.page,
      page_size: options.pageSize,
    };
    if (options.productType) {
      listInput.product_type = options.productType;
    }

    const trends = await listTrends(listInput);
    const selected = trends.results.find((item) => !item.is_dismissed) || trends.results[0];
    if (!selected) {
      throw new Error(
        `No trends found for view=${options.view}, product_type=${options.productType || "any"}`,
      );
    }
    trend = await getTrendMatch(selected.id);
  }

  if (options.concept && !hasLaunchConcept(trend)) {
    const generated = await generateLaunchConcept(trend.id);
    if (generated.dispatched || generated.status === "pending" || generated.status === "running") {
      trend = await waitForLaunchConcept(trend.id, options.timeoutSec);
    } else {
      trend = await getTrendMatch(trend.id);
    }
  }

  const summary: TrendSummary = {
    trend,
    concept_products: extractConceptProducts(trend.launch_concept),
    dashboard_url: dashboardUrl(`/dashboard/trends/concept/${trend.id}`),
  };
  if (seasonalEvents) {
    summary.seasonal_events = seasonalEvents;
  }
  return summary;
}

function hasLaunchConcept(trend: TrendMatch): boolean {
  const value = trend.launch_concept;
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return Boolean(value);
}

function extractConceptProducts(launchConcept: unknown): ConceptProduct[] {
  const concepts = Array.isArray(launchConcept)
    ? launchConcept
    : isRecord(launchConcept)
      ? [launchConcept]
      : [];
  const products: ConceptProduct[] = [];

  for (const concept of concepts) {
    if (!isRecord(concept)) {
      continue;
    }
    const rawProducts = concept.products;
    if (!Array.isArray(rawProducts)) {
      continue;
    }
    for (const rawProduct of rawProducts) {
      if (!isRecord(rawProduct)) {
        continue;
      }
      const prompt = rawProduct.prompt;
      const conceptText = isRecord(prompt)
        ? stringField(prompt, "concept")
        : stringField(rawProduct, "concept");
      products.push({
        product_uuid: stringField(rawProduct, "product_uuid", "productUuid"),
        title: stringField(rawProduct, "title", "name") || "Untitled product",
        technique: stringField(rawProduct, "technique"),
        concept: conceptText || "",
        colors: extractColors(rawProduct.colors),
        design_id: stringField(rawProduct, "design_id", "designId"),
      });
    }
  }
  return products;
}

function extractColors(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      if (isRecord(item)) {
        return stringField(item, "name") || "";
      }
      return "";
    })
    .filter(Boolean);
}

function stringField(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function renderMarkdown(summary: TrendSummary): string {
  const trend = summary.trend;
  const lines = [
    "# Vaybel Trend Summary",
    "",
    `- Trend: ${trend.trend_name}`,
    `- Match: ${trend.id}`,
    `- Product type: ${stringifyValue(trend.product_type)}`,
    `- Opportunity: ${stringifyValue(trend.opportunity)}`,
    `- Demand: ${stringifyValue(trend.demand)}`,
    `- Competition: ${stringifyValue(trend.competition)}`,
  ];

  if (trend.why_it_fits) {
    lines.push(`- Why it fits: ${truncate(trend.why_it_fits, 260)}`);
  }

  lines.push("", "## Launch Concepts");
  if (summary.concept_products.length) {
    for (const product of summary.concept_products.slice(0, 8)) {
      const productBits = [
        product.product_uuid ? `product ${product.product_uuid}` : null,
        product.technique,
        product.colors.length ? `colors: ${product.colors.join(", ")}` : null,
      ].filter(Boolean);
      lines.push(
        `- ${product.title}${productBits.length ? ` (${productBits.join("; ")})` : ""}: ${truncate(product.concept || "No concept text returned.", 240)}`,
      );
      if (product.design_id) {
        lines.push(`  Existing design: ${dashboardUrl(`/dashboard/launch/${product.design_id}`)}`);
      }
    }
  } else {
    lines.push("- No launch products were returned for this trend.");
  }

  if (summary.seasonal_events?.length) {
    lines.push("", "## Seasonal Context");
    for (const event of summary.seasonal_events.slice(0, 5)) {
      if (isRecord(event)) {
        lines.push(`- ${stringifyValue(event.name)} (${stringifyValue(event.event_date)})`);
      }
    }
  }

  lines.push("", `Continue in dashboard: ${summary.dashboard_url}`);
  return lines.join("\n");
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    view: "all",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    concept: true,
    timeoutSec: DEFAULT_TIMEOUT_SEC,
    includeSeasonalEvents: false,
    json: false,
  };
  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--view") {
      const view = readValue(args, ++index, arg);
      if (view !== "all" && view !== "brand" && view !== "seasonal") {
        throw new Error("--view must be one of all, brand, seasonal");
      }
      options.view = view;
    } else if (arg === "--product-type") {
      options.productType = readValue(args, ++index, arg);
    } else if (arg === "--match") {
      options.matchId = readValue(args, ++index, arg);
    } else if (arg === "--page") {
      options.page = parsePositiveInt(readValue(args, ++index, arg), arg, 1000);
    } else if (arg === "--page-size" || arg === "--limit") {
      options.pageSize = parsePositiveInt(readValue(args, ++index, arg), arg, 100);
    } else if (arg === "--timeout") {
      options.timeoutSec = parsePositiveInt(readValue(args, ++index, arg), arg, 600);
    } else if (arg === "--no-concept") {
      options.concept = false;
    } else if (arg === "--seasonal-events") {
      options.includeSeasonalEvents = true;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (!options.productType && positional[0]) {
    options.productType = positional[0];
  }

  return options;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`vaybel-find-trend failed: ${message}`);
  process.exitCode = 1;
});
