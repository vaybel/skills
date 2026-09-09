import { callMCPTool } from "../../client.js";

export type SalesChannelProvider = "etsy" | "shopify" | "tiktok_shop";
export type FulfillmentProviderKey = "printful" | "printify";

export interface SalesChannelIntegration {
  provider: SalesChannelProvider | string;
  status: string;
  store_name: string | null;
  store_id: string | null;
  connected_at: string | null;
}

export interface FulfillmentProviderLink {
  provider: string;
  store_name: string | null;
  store_id: string | null;
}

export interface FulfillmentProviderIntegration {
  provider: FulfillmentProviderKey | string;
  status: string;
  store_name: string | null;
  store_id: string | null;
  // The sales channel this provider fulfills, when the org linked one.
  linked_channel: FulfillmentProviderLink | null;
  connected_at: string | null;
}

export interface SocialAccountIntegration {
  provider: string;
  status: string;
  username: string | null;
  connected_at: string | null;
}

export interface IntegrationList {
  sales_channels: SalesChannelIntegration[];
  fulfillment_providers: FulfillmentProviderIntegration[];
  social_accounts: SocialAccountIntegration[];
}

// Read-only org integration inventory. Needs the integration:read scope
// (Starter plan or higher).
export function listIntegrations(): Promise<IntegrationList> {
  return callMCPTool<IntegrationList>("integration.list");
}
