import { closeMCPClient } from "../../client.js";
import {
  generateLaunchConcept,
  getTrend,
  getTrendMatch,
  listSeasonalEvents,
  listTrends,
  type NamedTrendDetail,
  type TrendKeywordChild,
  type TrendLifecycle,
  type TrendMatch,
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
const LIFECYCLES: TrendLifecycle[] = ["emerging", "rising", "peak", "declining"];

interface Options {
  lifecycle?: TrendLifecycle;
  trendType?: string;
  productType?: string;
  trendId?: string;
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
  // Named trend (the primary unit). Null only on the --match keyword-direct path.
  trend: NamedTrendDetail | null;
  // The keyword row the launch concept was generated against.
  keyword: TrendMatch | null;
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

  const seasonalEvents = options.includeSeasonalEvents
    ? (await listSeasonalEvents()).events
    : undefined;

  // Keyword-direct path: the caller already knows which keyword row to
  // concept against (e.g. from a previous run's drill-down).
  if (options.matchId) {
    const keyword = await ensureConcept(options.matchId, options);
    return buildSummary(null, keyword, seasonalEvents);
  }

  let trend: NamedTrendDetail;
  if (options.trendId) {
    trend = await getTrend(options.trendId);
  } else {
    const listInput: {
      lifecycle?: string;
      trend_type?: string;
      page: number;
      page_size: number;
    } = {
      page: options.page,
      page_size: options.pageSize,
    };
    if (options.lifecycle) {
      listInput.lifecycle = options.lifecycle;
    }
    if (options.trendType) {
      listInput.trend_type = options.trendType;
    }

    const trends = await listTrends(listInput);
    const selected = trends.results[0];
    if (!selected) {
      throw new Error(
        `No named trends found (lifecycle=${options.lifecycle || "any"}, type=${options.trendType || "any"}). ` +
          "Trends are produced by the weekly pipeline - make sure Brand DNA is set up, or re-run later.",
      );
    }
    trend = await getTrend(selected.id);
  }

  let keyword: TrendMatch | null = null;
  if (options.concept) {
    const child = pickKeyword(trend, options.productType);
    if (child) {
      keyword = await ensureConcept(child.id, options);
    }
  }

  return buildSummary(trend, keyword, seasonalEvents);
}

// Concept generation is keyword-scoped: prefer a keyword matching the
// requested product type, else the strongest one (the server orders the
// children by search volume).
function pickKeyword(
  trend: NamedTrendDetail,
  productType?: string,
): TrendKeywordChild | null {
  const keywords = trend.keywords || [];
  if (!keywords.length) {
    return null;
  }
  if (productType) {
    const match = keywords.find((keyword) => keyword.product_type === productType);
    if (match) {
      return match;
    }
  }
  return keywords[0] ?? null;
}

async function ensureConcept(matchId: string, options: Options): Promise<TrendMatch> {
  let keyword = await getTrendMatch(matchId);
  if (!options.concept || hasLaunchConcept(keyword)) {
    return keyword;
  }

  const generated = await generateLaunchConcept(matchId);
  if (generated.dispatched || generated.status === "pending" || generated.status === "running") {
    keyword = await waitForLaunchConcept(matchId, options.timeoutSec);
  } else {
    keyword = await getTrendMatch(matchId);
  }
  return keyword;
}

function buildSummary(
  trend: NamedTrendDetail | null,
  keyword: TrendMatch | null,
  seasonalEvents: unknown[] | undefined,
): TrendSummary {
  const conceptSource = keyword?.launch_concept ?? trend?.launch_concept;
  const summary: TrendSummary = {
    trend,
    keyword,
    concept_products: extractConceptProducts(conceptSource),
    dashboard_url: dashboardUrl("/dashboard/find-trend"),
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
  const lines = ["# Vaybel Trend Summary", ""];

  if (summary.trend) {
    const trend = summary.trend;
    lines.push(
      `- Trend: ${trend.name}`,
      `- Story: ${truncate(trend.one_line || "", 200)}`,
      `- Lifecycle: ${trend.lifecycle_stage} (${stringifyValue(trend.trend_type)})`,
      `- Score: ${stringifyValue(trend.trend_score)} | Search volume: ${stringifyValue(trend.total_search_volume)} | Keywords: ${stringifyValue(trend.cluster_size)}`,
    );
    if (trend.why_now) {
      lines.push(`- Why now: ${truncate(trend.why_now, 260)}`);
    }
    if (trend.design_direction) {
      lines.push(`- Design direction: ${truncate(trend.design_direction, 260)}`);
    }
  }

  if (summary.keyword) {
    const keyword = summary.keyword;
    lines.push(
      "",
      "## Concept Keyword",
      `- ${keyword.trend_name} (${stringifyValue(keyword.product_type)}) - id ${keyword.id}`,
      `- Opportunity: ${stringifyValue(keyword.opportunity)} | Demand: ${stringifyValue(keyword.demand)} | Competition: ${stringifyValue(keyword.competition)}`,
    );
    if (keyword.why_it_fits) {
      lines.push(`- Why it fits: ${truncate(keyword.why_it_fits, 260)}`);
    }
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
    lines.push("- No launch concept yet (pass a keyword with --match, or re-run with --timeout for slow generations).");
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
    } else if (arg === "--lifecycle") {
      const lifecycle = readValue(args, ++index, arg);
      if (!LIFECYCLES.includes(lifecycle as TrendLifecycle)) {
        throw new Error(`--lifecycle must be one of ${LIFECYCLES.join(", ")}`);
      }
      options.lifecycle = lifecycle as TrendLifecycle;
    } else if (arg === "--type") {
      options.trendType = readValue(args, ++index, arg);
    } else if (arg === "--view") {
      throw new Error(
        "--view is gone: trends are named clusters now. Filter with --lifecycle (emerging|rising|peak|declining) or --type.",
      );
    } else if (arg === "--product-type") {
      options.productType = readValue(args, ++index, arg);
    } else if (arg === "--trend" || arg === "--trend-id") {
      options.trendId = readValue(args, ++index, arg);
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
