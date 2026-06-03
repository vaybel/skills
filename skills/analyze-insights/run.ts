import { closeMCPClient } from "../../client.js";
import {
  checkCredits,
  getInsightGuidance,
  getInsightOverview,
  listDesignPerformance,
  type CheckCreditsResponse,
  type DesignPerformanceResponse,
  type GuidanceSnapshot,
  type InsightChannel,
  type InsightOverview,
  type InsightRange,
  type InsightSort,
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

const DEFAULT_RANGE: InsightRange = "28d";
const DEFAULT_CHANNEL: InsightChannel = "all";
const DEFAULT_SORT: InsightSort = "gmv";
const DEFAULT_PAGE_SIZE = 10;

interface Options {
  range: InsightRange;
  channel: InsightChannel;
  sort: InsightSort;
  pageSize: number;
  includeDesigns: boolean;
  includeGuidance: boolean;
  includeCredits: boolean;
  json: boolean;
}

interface InsightsSummary {
  range: InsightRange;
  channel: InsightChannel;
  overview: InsightOverview;
  guidance: GuidanceSnapshot | null;
  design_performance: DesignPerformanceResponse | null;
  credits: CheckCreditsResponse | null;
  dashboard_url: string;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  try {
    const summary = await analyzeInsights(options);
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(renderMarkdown(summary));
    }
  } finally {
    await closeMCPClient();
  }
}

async function analyzeInsights(options: Options): Promise<InsightsSummary> {
  preflightEnvironment();

  const [overview, guidance, designPerformance, credits] = await Promise.all([
    getInsightOverview({ range: options.range, channel: options.channel }),
    options.includeGuidance ? getInsightGuidance() : Promise.resolve(null),
    options.includeDesigns
      ? listDesignPerformance({
          range: options.range,
          sort: options.sort,
          page_size: options.pageSize,
        })
      : Promise.resolve(null),
    options.includeCredits ? checkCredits() : Promise.resolve(null),
  ]);

  return {
    range: options.range,
    channel: options.channel,
    overview,
    guidance,
    design_performance: designPerformance,
    credits,
    dashboard_url: dashboardUrl("/dashboard/insights"),
  };
}

function renderMarkdown(summary: InsightsSummary): string {
  const lines = [
    "# Vaybel Insights Summary",
    "",
    `- Range: ${summary.range}`,
    `- Channel: ${summary.channel}`,
    `- Has data: ${summary.overview.has_data ? "yes" : "no"}`,
  ];

  if (summary.credits) {
    lines.push(
      `- Credits: ${summary.credits.balance === null ? "not billed to org" : summary.credits.balance}`,
    );
  }

  lines.push("", "## KPIs");
  const kpis = summary.overview.kpis || {};
  lines.push(`- Orders: ${metric(kpis, "orders")}`);
  lines.push(`- GMV: ${moneyMetric(kpis)}`);
  lines.push(`- Views: ${metric(kpis, "views")}`);
  lines.push(`- CVR: ${percentMetric(kpis, "cvr")}`);

  const deltas = summary.overview.deltas || {};
  if (Object.keys(deltas).length) {
    lines.push("", "## Deltas");
    for (const [key, value] of Object.entries(deltas).slice(0, 8)) {
      lines.push(`- ${label(key)}: ${deltaValue(value)}`);
    }
  }

  if (summary.overview.per_channel?.length) {
    lines.push("", "## Channels");
    for (const row of summary.overview.per_channel.slice(0, 6)) {
      lines.push(
        `- ${stringifyValue(row.channel || row.name)}: ${metric(row, "orders")} orders, ${moneyMetric(row)} GMV, ${metric(row, "views")} views`,
      );
    }
  }

  if (summary.overview.insights?.length) {
    lines.push("", "## Narrative Insights");
    for (const insight of summary.overview.insights.slice(0, 6)) {
      const severity = insight.severity ? ` (${stringifyValue(insight.severity)})` : "";
      lines.push(`- ${stringifyValue(insight.type)}${severity}: ${truncate(stringifyValue(insight.message), 260)}`);
    }
  }

  if (summary.guidance?.next_action) {
    const action = summary.guidance.next_action;
    lines.push("", "## Next Action");
    lines.push(`- ${stringifyValue(action.title || action.key)}: ${truncate(stringifyValue(action.reason), 260)}`);
    if (action.confidence !== undefined) {
      lines.push(`- Confidence: ${stringifyValue(action.confidence)}`);
    }
    if (action.requires_credits !== undefined) {
      lines.push(`- Requires credits: ${action.requires_credits ? "yes" : "no"}`);
    }
  }

  if (summary.guidance) {
    lines.push("", "## Usage State");
    lines.push(`- Stage: ${compactRecord(summary.guidance.stage)}`);
    lines.push(`- Revenue: ${compactRecord(summary.guidance.revenue)}`);
    lines.push(`- Streak: ${compactRecord(summary.guidance.streak)}`);
  }

  if (summary.design_performance?.results.length) {
    lines.push("", "## Top Designs");
    for (const design of summary.design_performance.results.slice(0, summary.design_performance.page_size)) {
      const id = design.product_design_id || design.design_id || "unknown";
      lines.push(
        `- ${truncate(design.title || id, 90)}: ${metric(design, "orders")} orders, ${moneyMetric(design)} GMV, ${metric(design, "views")} views`,
      );
    }
    if (summary.design_performance.caveat) {
      lines.push(`- Caveat: ${summary.design_performance.caveat}`);
    }
  }

  lines.push("", `Open dashboard: ${summary.dashboard_url}`);
  return lines.join("\n");
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    range: DEFAULT_RANGE,
    channel: DEFAULT_CHANNEL,
    sort: DEFAULT_SORT,
    pageSize: DEFAULT_PAGE_SIZE,
    includeDesigns: true,
    includeGuidance: true,
    includeCredits: true,
    json: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--range") {
      options.range = parseRange(readValue(args, ++index, arg));
    } else if (arg === "--channel") {
      options.channel = parseChannel(readValue(args, ++index, arg));
    } else if (arg === "--sort") {
      options.sort = parseSort(readValue(args, ++index, arg));
    } else if (arg === "--limit" || arg === "--page-size") {
      options.pageSize = parsePositiveInt(readValue(args, ++index, arg), arg, 100);
    } else if (arg === "--no-designs") {
      options.includeDesigns = false;
    } else if (arg === "--no-guidance") {
      options.includeGuidance = false;
    } else if (arg === "--no-credits") {
      options.includeCredits = false;
    } else if (!arg.startsWith("--")) {
      options.channel = parseChannel(arg);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function parseRange(value: string): InsightRange {
  if (value === "7d" || value === "28d") {
    return value;
  }
  throw new Error("--range must be 7d or 28d");
}

function parseChannel(value: string): InsightChannel {
  if (value === "all" || value === "tiktok" || value === "etsy" || value === "shopify" || value === "instagram") {
    return value;
  }
  throw new Error("--channel must be one of all, tiktok, etsy, shopify, instagram");
}

function parseSort(value: string): InsightSort {
  if (value === "gmv" || value === "orders" || value === "views") {
    return value;
  }
  throw new Error("--sort must be one of gmv, orders, views");
}

function metric(row: Record<string, unknown>, key: string): string {
  return stringifyValue(row[key]);
}

function moneyMetric(row: Record<string, unknown>): string {
  const cents = numberValue(row.gmv_cents);
  if (cents !== null) {
    return `$${(cents / 100).toFixed(2)}`;
  }
  const dollars = numberValue(row.gmv);
  if (dollars !== null) {
    return `$${dollars.toFixed(2)}`;
  }
  return "n/a";
}

function percentMetric(row: Record<string, unknown>, key: string): string {
  const value = numberValue(row[key]);
  if (value === null) {
    return "n/a";
  }
  return value <= 1 ? `${(value * 100).toFixed(2)}%` : `${value.toFixed(2)}%`;
}

function deltaValue(value: unknown): string {
  const parsed = numberValue(value);
  if (parsed === null) {
    return stringifyValue(value);
  }
  return `${parsed > 0 ? "+" : ""}${parsed.toFixed(2)}%`;
}

function compactRecord(value: unknown): string {
  if (!isRecord(value)) {
    return stringifyValue(value);
  }
  const parts = Object.entries(value)
    .slice(0, 5)
    .map(([key, item]) => `${label(key)}=${stringifyValue(item)}`);
  return parts.length ? parts.join(", ") : "n/a";
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

function label(value: string): string {
  return value.replace(/_/g, " ");
}

main().catch(async (error: unknown) => {
  await closeMCPClient();
  const message = error instanceof Error ? error.message : String(error);
  console.error(`vaybel-analyze-insights failed: ${message}`);
  process.exit(1);
});
