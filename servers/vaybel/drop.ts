import { callMCPTool } from "../../client.js";

// Drops (drop.*) - a seller's themed release: a brief on top of Brand DNA, the
// designs and listings filed into it, pinned trends, and derived readiness.

export type DropStatus = "planning" | "live" | "wrapped";
export type DropKind = "seasonal" | "capsule" | "trend" | "event" | "other";

export interface DropBrief {
  theme?: string;
  moment?: string;
  mood?: string;
  instructions?: string;
  palette?: string[];
  motifs?: string[];
}

export interface DropSummary {
  id: string;
  name: string;
  kind: DropKind | string;
  status: DropStatus | string;
  brief: DropBrief;
  target_date: string | null;
  launched_at: string | null;
  wrapped_at: string | null;
  product_count: number;
  readiness_percent: number | null;
  is_ready: boolean | null;
  [key: string]: unknown;
}

export interface DropReadiness {
  percent: number;
  is_ready: boolean;
  required_total: number;
  required_done: number;
  checks: { brief: boolean; target_date: boolean; products: boolean };
  counts: {
    products: number;
    designs_ready: number;
    mockups_ready: number;
    listings_live: number;
    content_ready: number;
  };
  channel_groups: { channel: string; status: string; external_id: string; error: string }[];
  products_detail: {
    design_uuid: string;
    title: string;
    design_ready: boolean;
    mockups_ready: boolean;
    listing_live: boolean;
    content_ready: boolean;
    live_channels: string[];
    [key: string]: unknown;
  }[];
}

export interface DropDetail extends DropSummary {
  trends: { id: string; name: string }[];
  trend_matches: { id: string; trend_name: string; product_type: string }[];
  readiness: DropReadiness;
  listings: { id: string; title: string; status: string; channel: string; design_uuid: string }[];
  shorts: { id: string; format: string; phase: string; listing_uuid: string }[];
  posts: { id: number; platform: string; status: string; post_url: string | null }[];
}

export interface ListDropsInput {
  status?: DropStatus | string;
  page?: number;
  page_size?: number;
  include_readiness?: boolean;
}

export interface ListDropsResponse {
  results: DropSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateDropInput {
  name: string;
  kind?: DropKind | string;
  brief?: DropBrief;
  target_date?: string;
  trend_id?: string;
  trend_match_id?: string;
}

export interface UpdateDropInput {
  name?: string;
  kind?: DropKind | string;
  brief?: DropBrief;
  target_date?: string;
  status?: "live" | "wrapped";
}

export type DropEntityType = "design" | "listing" | "short" | "post";

// A trend ranked against the drop's brief, with the reasons a seller can read.
export interface RelatedTrend {
  id: string;
  name: string;
  one_line: string;
  lifecycle_stage: string;
  trend_type: string;
  trend_score: number;
  seed_group: string;
  breakout_count: number;
  motifs: string[];
  score: number;
  reasons: string[];
  pinned: boolean;
  // The keyword row whose launch concept opens the design flow (find-trend --match).
  concept_match_id: string | null;
  has_concept: boolean;
}

export interface RelatedTrendsResponse {
  drop: { id: string; name: string };
  results: RelatedTrend[];
}

export function listDrops(input: ListDropsInput = {}): Promise<ListDropsResponse> {
  return callMCPTool<ListDropsResponse>("drop.list", input);
}

export function getDrop(dropId: string): Promise<DropDetail> {
  return callMCPTool<DropDetail>("drop.get", { drop_id: dropId });
}

export function createDrop(input: CreateDropInput): Promise<DropDetail> {
  return callMCPTool<DropDetail>("drop.create", input);
}

export function updateDrop(dropId: string, input: UpdateDropInput): Promise<DropDetail> {
  return callMCPTool<DropDetail>("drop.update", { drop_id: dropId, ...input });
}

export function attachToDrop(
  dropId: string,
  entityType: DropEntityType,
  entityId: string,
  remove = false,
): Promise<DropDetail> {
  return callMCPTool<DropDetail>("drop.attach", {
    drop_id: dropId,
    entity_type: entityType,
    entity_id: entityId,
    remove,
  });
}

export function relatedTrends(dropId: string, limit = 6): Promise<RelatedTrendsResponse> {
  return callMCPTool<RelatedTrendsResponse>("drop.related_trends", { drop_id: dropId, limit });
}

export function pinTrend(
  dropId: string,
  pin: { trend_id?: string; trend_match_id?: string },
  remove = false,
): Promise<DropDetail> {
  return callMCPTool<DropDetail>("drop.pin_trend", { drop_id: dropId, ...pin, remove });
}
