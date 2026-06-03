import { callMCPTool } from "../../client.js";

export type InsightRange = "7d" | "28d";
export type InsightChannel = "all" | "tiktok" | "etsy" | "shopify" | "instagram";
export type InsightSort = "gmv" | "orders" | "views";

export interface InsightKpis {
  orders?: number;
  gmv?: number;
  gmv_cents?: number;
  views?: number;
  cvr?: number;
  [key: string]: unknown;
}

export interface InsightOverview {
  has_data: boolean;
  kpis: InsightKpis;
  deltas: Record<string, unknown>;
  per_channel: Array<Record<string, unknown>>;
  insights: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface DesignPerformanceRow {
  product_design_id?: string;
  design_id?: string;
  title?: string;
  views?: number;
  orders?: number;
  gmv?: number;
  gmv_cents?: number;
  [key: string]: unknown;
}

export interface DesignPerformanceResponse {
  results: DesignPerformanceRow[];
  caveat: string;
  total: number;
  page: number;
  page_size: number;
}

export interface GuidanceSnapshot {
  next_action: {
    key?: string;
    title?: string;
    reason?: string;
    confidence?: number;
    requires_credits?: boolean;
    [key: string]: unknown;
  } | null;
  stage: Record<string, unknown>;
  revenue: Record<string, unknown>;
  streak: Record<string, unknown>;
  [key: string]: unknown;
}

export function getInsightOverview(input: {
  range?: InsightRange | string;
  channel?: InsightChannel | string;
} = {}): Promise<InsightOverview> {
  return callMCPTool<InsightOverview>("insight.get_overview", input);
}

export function listDesignPerformance(input: {
  range?: InsightRange | string;
  sort?: InsightSort | string;
  page?: number;
  page_size?: number;
} = {}): Promise<DesignPerformanceResponse> {
  return callMCPTool<DesignPerformanceResponse>("insight.list_design_performance", input);
}

export function getInsightGuidance(): Promise<GuidanceSnapshot> {
  return callMCPTool<GuidanceSnapshot>("insight.get_guidance");
}
