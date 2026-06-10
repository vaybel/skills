import { callMCPTool, pollToolUntilDone } from "../../client.js";

export type TrendLifecycle = "emerging" | "rising" | "peak" | "declining";
export type KeywordView = "all" | "brand" | "seasonal";

// Named trends (trend.list / trend.get) - the primary feed

export interface NamedTrend {
  id: string;
  name: string;
  one_line: string;
  lifecycle_stage: TrendLifecycle | string;
  trend_type: string;
  trend_score: number;
  total_search_volume: number;
  peak_search_volume: number;
  cluster_size: number;
  breakout_count: number;
  suggested_product_types: string[];
  seed_group: string;
  first_seen_at?: string;
  [key: string]: unknown;
}

export interface TrendKeywordChild {
  id: string;
  keyword: string;
  product_type: string;
  search_volume: number | null;
  competition: number | null;
  opportunity: number | null;
}

export interface NamedTrendDetail extends NamedTrend {
  why_now: string;
  design_direction: string;
  mean_velocity?: number | null;
  max_velocity?: number | null;
  mean_competition?: number | null;
  interest_history?: number[];
  // Concept generation is keyword-scoped: pick a keyword id from here and
  // pass it to generateLaunchConcept().
  keywords: TrendKeywordChild[];
  has_concept: boolean;
  launch_concept: unknown;
}

export interface ListNamedTrendsInput {
  lifecycle?: TrendLifecycle | string;
  trend_type?: string;
  page?: number;
  page_size?: number;
}

export interface ListNamedTrendsResponse {
  results: NamedTrend[];
  total: number;
  page: number;
  page_size: number;
  view_counts: Record<string, number>;
}

export function listTrends(input: ListNamedTrendsInput = {}): Promise<ListNamedTrendsResponse> {
  return callMCPTool<ListNamedTrendsResponse>("trend.list", input);
}

export function getTrend(trendId: string): Promise<NamedTrendDetail> {
  return callMCPTool<NamedTrendDetail>("trend.get", { trend_id: trendId });
}

// Keyword rows (trend.list_keywords / trend.get_keyword)

export interface TrendMatch {
  id: string;
  trend_name: string;
  seed_group: string;
  product_type: string;
  search_volume?: number | null;
  demand?: number | null;
  competition?: number | null;
  opportunity?: number | null;
  component_scores?: Record<string, unknown>;
  why_it_fits?: string;
  has_concept?: boolean;
  is_dismissed?: boolean;
  launch_concept?: unknown;
  created_at?: string;
  [key: string]: unknown;
}

export interface ListKeywordsInput {
  view?: KeywordView;
  product_type?: string;
  page?: number;
  page_size?: number;
}

export interface ListKeywordsResponse {
  results: TrendMatch[];
  total: number;
  page: number;
  page_size: number;
  view_counts: {
    all: number;
    brand: number;
    seasonal: number;
    [key: string]: number;
  };
}

export function listKeywords(input: ListKeywordsInput = {}): Promise<ListKeywordsResponse> {
  return callMCPTool<ListKeywordsResponse>("trend.list_keywords", input);
}

export function getTrendMatch(matchId: string): Promise<TrendMatch> {
  return callMCPTool<TrendMatch>("trend.get_keyword", { match_id: matchId });
}

// Launch concepts (keyword-scoped)

export interface GenerateLaunchConceptResponse {
  handle?: string;
  resource_id?: string | null;
  status: "cached" | "generating" | "pending" | "running" | "complete" | "failed";
  done?: boolean;
  match_id: string;
  launch_concept: unknown;
  dispatched: boolean;
  message?: string;
}

export function generateLaunchConcept(matchId: string): Promise<GenerateLaunchConceptResponse> {
  return callMCPTool<GenerateLaunchConceptResponse>("trend.generate_concept", {
    match_id: matchId,
  });
}

export function waitForLaunchConcept(matchId: string, timeoutSec = 180): Promise<TrendMatch> {
  return pollToolUntilDone<TrendMatch & { status?: string; done?: boolean }>(
    "trend.get_generation",
    { handle: matchId },
    timeoutSec,
  );
}

// Feedback + seasonal calendar

export interface SubmitTrendFeedbackInput {
  match_id: string;
  action:
    | "viewed"
    | "saved"
    | "dismissed"
    | "created_concept"
    | "created_product"
    | "listed_product";
  product_id?: string;
  revenue_30d?: number;
  units_sold_30d?: number;
  conversion_rate?: number;
}

export function submitTrendFeedback(input: SubmitTrendFeedbackInput): Promise<{ status: string }> {
  return callMCPTool<{ status: string }>("trend.submit_feedback", input);
}

export interface SeasonalEvent {
  name: string;
  event_date?: string;
  year?: number;
  resolved_start?: string;
  resolved_end?: string;
  country?: string;
  pod_relevance?: string;
  prep_lead_weeks?: number;
  design_themes?: string[];
  audience_affinity?: string[];
  product_affinity?: string[];
  mood_tags?: string[];
  gift_driven?: boolean;
  historical_volume_multiplier?: number;
  counter_themes?: string[];
  [key: string]: unknown;
}

export function listSeasonalEvents(): Promise<{ events: SeasonalEvent[] }> {
  return callMCPTool<{ events: SeasonalEvent[] }>("trend.list_seasonal_events");
}
