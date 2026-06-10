import { callMCPTool, pollToolUntilDone } from "../../client.js";

export type ListingChannel = "tiktok_shop" | "etsy" | "shopify";

export interface CreateListingInput {
  design_id: string;
  channel: ListingChannel | string;
  gender?: "mens" | "womens";
}

export interface ListingTask {
  handle?: string;
  task_id?: string;
  status?: "pending";
  channel: string;
  category: "listing";
  task_type: "create_listing_draft" | "publish_listing_draft" | string;
  message?: string;
}

export interface ListingTaskStatus {
  status: "pending" | "running" | "complete" | "failed" | string;
  handle?: string;
  task_id?: string;
  resource_id?: string | null;
  done?: boolean;
  task_type: string;
  progress: number;
  message: string;
  listing_id: string | null;
  error: string;
}

export interface ListingIndexResponse {
  results: Array<Record<string, unknown>>;
  total_count: number;
}

export function createListing(input: CreateListingInput): Promise<ListingTask> {
  return callMCPTool<ListingTask>("listing.create", input);
}

export function getListing(listingId: string): Promise<Record<string, unknown>> {
  return callMCPTool<Record<string, unknown>>("listing.get", {
    listing_id: listingId,
  });
}

export function listListings(input: {
  design_id?: string;
  channel?: string;
  status?: string;
  page?: number;
  page_size?: number;
} = {}): Promise<ListingIndexResponse> {
  return callMCPTool<ListingIndexResponse>("listing.list", input);
}

export function updateListing(input: {
  listing_id: string;
  title?: string;
  description?: string;
  tags?: string[];
  // TikTok Shop only - assign a warehouse before listing.publish.
  warehouse_id?: string;
}): Promise<{ ok: boolean; updated_fields: string[] }> {
  return callMCPTool<{ ok: boolean; updated_fields: string[] }>("listing.update", input);
}

export interface TikTokWarehouse {
  warehouse_id: string;
  name: string;
  region: string;
  status: string;
  is_default: boolean;
}

export function listWarehouses(refresh = false): Promise<{ warehouses: TikTokWarehouse[] }> {
  return callMCPTool<{ warehouses: TikTokWarehouse[] }>("listing.list_warehouses", { refresh });
}

export function regenerateListingField(
  listingId: string,
  field: "title" | "description" | "tags",
): Promise<{ field: string; value: string | string[] }> {
  return callMCPTool<{ field: string; value: string | string[] }>(
    "listing.regenerate_field",
    { listing_id: listingId, field },
  );
}

export function publishListing(listingId: string): Promise<ListingTask> {
  return callMCPTool<ListingTask>("listing.publish", { listing_id: listingId });
}

export function deleteListing(listingId: string): Promise<{ ok: boolean; channel: string }> {
  return callMCPTool<{ ok: boolean; channel: string }>("listing.delete", {
    listing_id: listingId,
  });
}

export function getListingTaskStatus(taskId: string): Promise<ListingTaskStatus> {
  return callMCPTool<ListingTaskStatus>("listing.get_generation", { handle: taskId });
}

export function waitForListingTask(taskId: string, timeoutSec = 180): Promise<ListingTaskStatus> {
  return pollToolUntilDone<ListingTaskStatus>(
    "listing.get_generation",
    { handle: taskId },
    timeoutSec,
  );
}
