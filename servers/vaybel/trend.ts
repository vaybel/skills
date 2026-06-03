import { callMCPTool } from "../../client.js";

export type TrendView = "all" | "brand" | "seasonal";

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

export interface ListTrendsInput {
  view?: TrendView;
  product_type?: string;
  page?: number;
  page_size?: number;
}

export interface ListTrendsResponse {
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

export function listTrends(input: ListTrendsInput = {}): Promise<ListTrendsResponse> {
  return callMCPTool<ListTrendsResponse>("trend.list_trends", input);
}

export function getTrendMatch(matchId: string): Promise<TrendMatch> {
  return callMCPTool<TrendMatch>("trend.get_trend_match", { match_id: matchId });
}

export function generateLaunchConcept(matchId: string): Promise<GenerateLaunchConceptResponse> {
  return callMCPTool<GenerateLaunchConceptResponse>("trend.generate_launch_concept", {
    match_id: matchId,
  });
}

export function waitForLaunchConcept(matchId: string, timeoutSec = 180): Promise<TrendMatch> {
  return callMCPTool<TrendMatch>("trend.get", {
    handle: matchId,
    wait_sec: timeoutSec,
  });
}

export function submitTrendFeedback(input: SubmitTrendFeedbackInput): Promise<{ status: string }> {
  return callMCPTool<{ status: string }>("trend.submit_trend_feedback", input);
}

export function listSeasonalEvents(): Promise<{ events: SeasonalEvent[] }> {
  return callMCPTool<{ events: SeasonalEvent[] }>("trend.list_seasonal_events");
}
