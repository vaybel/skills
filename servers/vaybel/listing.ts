import { callMCPTool } from "../../client.js";

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
  return callMCPTool<ListingTask>("listing.create_listing", input);
}

export function getListing(listingId: string): Promise<Record<string, unknown>> {
  return callMCPTool<Record<string, unknown>>("listing.get_listing", {
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
  return callMCPTool<ListingIndexResponse>("listing.list_listings", input);
}

export function updateListing(input: {
  listing_id: string;
  title?: string;
  description?: string;
  tags?: string[];
}): Promise<{ ok: boolean; updated_fields: string[] }> {
  return callMCPTool<{ ok: boolean; updated_fields: string[] }>("listing.update_listing", input);
}

export function regenerateListingField(
  listingId: string,
  field: "title" | "description" | "tags",
): Promise<{ field: string; value: string | string[] }> {
  return callMCPTool<{ field: string; value: string | string[] }>(
    "listing.regenerate_listing_field",
    { listing_id: listingId, field },
  );
}

export function publishListing(listingId: string): Promise<ListingTask> {
  return callMCPTool<ListingTask>("listing.publish_listing", { listing_id: listingId });
}

export function deleteListing(listingId: string): Promise<{ ok: boolean; channel: string }> {
  return callMCPTool<{ ok: boolean; channel: string }>("listing.delete_listing", {
    listing_id: listingId,
  });
}

export function getListingTaskStatus(taskId: string): Promise<ListingTaskStatus> {
  return callMCPTool<ListingTaskStatus>("listing.get", { handle: taskId });
}

export function waitForListingTask(taskId: string, timeoutSec = 180): Promise<ListingTaskStatus> {
  return callMCPTool<ListingTaskStatus>("listing.get", {
    handle: taskId,
    wait_sec: timeoutSec,
  });
}
