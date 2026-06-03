import { callMCPTool } from "../../client.js";

export type ProviderKey = "printify" | "printful";

export interface OptimizeProvider {
  key: ProviderKey | string;
  name: string;
  shop_id?: string;
  [key: string]: unknown;
}

export interface ProviderProduct {
  external_id: string;
  title: string;
  thumbnail_url: string | null;
  variant_count: number;
  is_imported: boolean;
  existing_design_uuid: string | null;
  is_supported: boolean;
  is_vaybel_origin: boolean;
}

export interface ListProviderProductsInput {
  provider: ProviderKey | string;
  shop_id?: string;
  page?: number;
  page_size?: number;
}

export interface ListProviderProductsResponse {
  results: ProviderProduct[];
  total: number;
  page: number;
  total_pages: number;
}

export interface DuplicateCheck {
  is_imported: boolean;
  existing_design_uuid: string | null;
}

export interface OptimizeTask {
  handle: string;
  task_id: string;
  status: "pending";
  category: "import";
  task_type: "import_optimize_product";
  message?: string;
}

export interface OptimizeTaskStatus {
  status: "pending" | "running" | "complete" | "failed" | string;
  handle?: string;
  task_id?: string;
  resource_id?: string | null;
  done?: boolean;
  progress: number;
  message: string;
  product_design_uuid: string | null;
  listing_uuid: string | null;
  error: string;
}

export interface RefreshListingResponse {
  found: boolean;
  listing_uuid: string | null;
  channel: "tiktok_shop" | "etsy" | "shopify" | null;
  message: string;
}

export function listProviders(): Promise<{ providers: OptimizeProvider[] }> {
  return callMCPTool<{ providers: OptimizeProvider[] }>("optimize.list_providers");
}

export function listProviderProducts(
  input: ListProviderProductsInput,
): Promise<ListProviderProductsResponse> {
  return callMCPTool<ListProviderProductsResponse>("optimize.list_provider_products", input);
}

export function checkDuplicate(provider: string, externalId: string): Promise<DuplicateCheck> {
  return callMCPTool<DuplicateCheck>("optimize.check_duplicate", {
    provider,
    external_id: externalId,
  });
}

export function optimizeProduct(input: {
  provider: string;
  product_id: string;
  shop_id?: string;
}): Promise<OptimizeTask> {
  return callMCPTool<OptimizeTask>("optimize.optimize_product", input);
}

export function refreshListing(designId: string): Promise<RefreshListingResponse> {
  return callMCPTool<RefreshListingResponse>("optimize.refresh_listing", { design_id: designId });
}

export function getOptimizeTaskStatus(taskId: string): Promise<OptimizeTaskStatus> {
  return callMCPTool<OptimizeTaskStatus>("optimize.get", { handle: taskId });
}

export function waitForOptimizeTask(taskId: string, timeoutSec = 300): Promise<OptimizeTaskStatus> {
  return callMCPTool<OptimizeTaskStatus>("optimize.get", {
    handle: taskId,
    wait_sec: timeoutSec,
  });
}
