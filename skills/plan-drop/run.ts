import { closeMCPClient } from "../../client.js";
import {
  attachToDrop,
  createDrop,
  getDrop,
  pinTrend,
  relatedTrends,
  type CreateDropInput,
  type DropBrief,
  type DropDetail,
  type DropKind,
  type RelatedTrend,
} from "../../servers/vaybel/index.js";
import {
  dashboardUrl,
  parseCsv,
  parsePositiveInt,
  preflightEnvironment,
  readValue,
  stringifyValue,
  truncate,
} from "../shared.js";

const DEFAULT_LIMIT = 6;
const KINDS: DropKind[] = ["seasonal", "capsule", "trend", "event", "other"];

interface Options {
  name?: string;
  dropId?: string;
  kind?: DropKind;
  targetDate?: string;
  brief: DropBrief;
  trendId?: string;
  matchId?: string;
  pinTop: number;
  attachDesignIds: string[];
  limit: number;
  json: boolean;
}

interface PlanSummary {
  drop: DropDetail;
  created: boolean;
  pinned_now: string[];
  suggestions: RelatedTrend[];
  dashboard_url: string;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  try {
    const summary = await planDrop(options);
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(renderMarkdown(summary));
    }
  } finally {
    await closeMCPClient();
  }
}

async function planDrop(options: Options): Promise<PlanSummary> {
  preflightEnvironment();

  const pinnedNow: string[] = [];
  let drop: DropDetail;
  let created = false;

  if (options.dropId) {
    drop = await getDrop(options.dropId);
    // Pins on an existing drop go through pin_trend, which seeds only empty brief keys.
    if (options.trendId || options.matchId) {
      drop = await pinTrend(drop.id, {
        ...(options.trendId ? { trend_id: options.trendId } : {}),
        ...(options.matchId ? { trend_match_id: options.matchId } : {}),
      });
      pinnedNow.push(options.trendId ?? options.matchId ?? "");
    }
  } else {
    if (!options.name) {
      throw new Error("Give the drop a name (positional) or open an existing one with --drop <uuid>.");
    }
    const input: CreateDropInput = { name: options.name };
    if (options.kind) input.kind = options.kind;
    if (options.targetDate) input.target_date = options.targetDate;
    if (Object.keys(options.brief).length) input.brief = options.brief;
    if (options.trendId) input.trend_id = options.trendId;
    if (options.matchId) input.trend_match_id = options.matchId;
    drop = await createDrop(input);
    created = true;
  }

  for (const designId of options.attachDesignIds) {
    drop = await attachToDrop(drop.id, "design", designId);
  }

  let related = await relatedTrends(drop.id, options.limit);
  if (options.pinTop > 0) {
    const candidates = related.results.filter((trend) => !trend.pinned).slice(0, options.pinTop);
    for (const trend of candidates) {
      drop = await pinTrend(drop.id, { trend_id: trend.id });
      pinnedNow.push(trend.id);
    }
    if (candidates.length) {
      related = await relatedTrends(drop.id, options.limit);
    }
  }

  return {
    drop,
    created,
    pinned_now: pinnedNow.filter(Boolean),
    suggestions: related.results,
    dashboard_url: dashboardUrl(`/dashboard/drops/${drop.id}`),
  };
}

function renderMarkdown(summary: PlanSummary): string {
  const { drop } = summary;
  const readiness = drop.readiness;
  const lines = [
    `# ${summary.created ? "Drop created" : "Drop"}: ${drop.name}`,
    "",
    `- Status: ${drop.status} (${drop.kind})${drop.target_date ? ` | launches ${drop.target_date}` : ""}`,
    `- Readiness: ${readiness.percent}% (${readiness.required_done} of ${readiness.required_total} steps)`,
    `- Products: ${readiness.counts.products} (${readiness.counts.listings_live} live, ${readiness.counts.mockups_ready} with mockups)`,
  ];

  const brief = drop.brief || {};
  const briefBits = [
    brief.theme ? `theme: ${truncate(brief.theme, 120)}` : null,
    brief.mood ? `mood: ${truncate(brief.mood, 80)}` : null,
    brief.motifs?.length ? `motifs: ${brief.motifs.join(", ")}` : null,
    brief.palette?.length ? `palette: ${brief.palette.join(", ")}` : null,
  ].filter(Boolean);
  lines.push(`- Brief: ${briefBits.length ? briefBits.join(" | ") : "empty - add one so trends can be matched"}`);

  const missing = [
    !readiness.checks.brief ? "brief" : null,
    !readiness.checks.target_date ? "launch date" : null,
    !readiness.checks.products ? "first product" : null,
  ].filter(Boolean);
  if (missing.length) {
    lines.push(`- Still missing: ${missing.join(", ")}`);
  }

  const pinned = summary.suggestions.filter((trend) => trend.pinned);
  const suggested = summary.suggestions.filter((trend) => !trend.pinned);

  lines.push("", "## Pinned trends");
  if (pinned.length) {
    for (const trend of pinned) {
      lines.push(renderTrend(trend));
    }
  } else {
    lines.push("- none yet");
  }

  lines.push("", "## Trends that fit this drop");
  if (suggested.length) {
    for (const trend of suggested) {
      lines.push(renderTrend(trend));
    }
    lines.push(
      "",
      `Pin one with: npm run plan-drop -- --drop ${drop.id} --trend <trend-id>`,
      "Generate from one: /vaybel:find-trend --match <concept-id>, then /vaybel:launch-product, then",
      `file the design with: npm run plan-drop -- --drop ${drop.id} --attach-design <design-id>`,
    );
  } else {
    lines.push("- No trends fit this brief yet. Write a brief with motifs, or run /vaybel:find-trend.");
  }

  if (readiness.products_detail.length) {
    lines.push("", "## Products");
    for (const product of readiness.products_detail.slice(0, 10)) {
      const steps = [
        product.design_ready ? "design" : null,
        product.mockups_ready ? "mockups" : null,
        product.listing_live ? `live (${product.live_channels.join(", ") || "channel"})` : null,
      ].filter(Boolean);
      lines.push(`- ${product.title}: ${steps.length ? steps.join(", ") : "not started"}`);
    }
  }

  lines.push("", `Open the drop: ${summary.dashboard_url}`);
  return lines.join("\n");
}

function renderTrend(trend: RelatedTrend): string {
  const bits = [
    trend.lifecycle_stage,
    `fit ${stringifyValue(trend.score)}`,
    trend.reasons.length ? trend.reasons.join("; ") : null,
    trend.concept_match_id
      ? `concept ${trend.has_concept ? "ready" : "not generated"}: ${trend.concept_match_id}`
      : null,
  ].filter(Boolean);
  return `- ${trend.name} (${trend.id}) - ${bits.join(" | ")}`;
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    brief: {},
    pinTop: 0,
    attachDesignIds: [],
    limit: DEFAULT_LIMIT,
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
    } else if (arg === "--drop") {
      options.dropId = readValue(args, ++index, arg);
    } else if (arg === "--kind") {
      const kind = readValue(args, ++index, arg);
      if (!KINDS.includes(kind as DropKind)) {
        throw new Error(`--kind must be one of ${KINDS.join(", ")}`);
      }
      options.kind = kind as DropKind;
    } else if (arg === "--date") {
      const date = readValue(args, ++index, arg);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error("--date must be YYYY-MM-DD");
      }
      options.targetDate = date;
    } else if (arg === "--theme") {
      options.brief.theme = readValue(args, ++index, arg);
    } else if (arg === "--moment") {
      options.brief.moment = readValue(args, ++index, arg);
    } else if (arg === "--mood") {
      options.brief.mood = readValue(args, ++index, arg);
    } else if (arg === "--direction") {
      options.brief.instructions = readValue(args, ++index, arg);
    } else if (arg === "--motifs") {
      options.brief.motifs = parseCsv(readValue(args, ++index, arg));
    } else if (arg === "--palette") {
      options.brief.palette = parseCsv(readValue(args, ++index, arg));
    } else if (arg === "--trend") {
      options.trendId = readValue(args, ++index, arg);
    } else if (arg === "--match") {
      options.matchId = readValue(args, ++index, arg);
    } else if (arg === "--pin-top") {
      options.pinTop = parsePositiveInt(readValue(args, ++index, arg), arg, 12);
    } else if (arg === "--attach-design") {
      options.attachDesignIds.push(readValue(args, ++index, arg));
    } else if (arg === "--limit") {
      options.limit = parsePositiveInt(readValue(args, ++index, arg), arg, 12);
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length) {
    options.name = positional.join(" ");
  }
  if (options.trendId && options.matchId) {
    throw new Error("Pass --trend or --match, not both.");
  }

  return options;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`vaybel-plan-drop failed: ${message}`);
  process.exitCode = 1;
});
