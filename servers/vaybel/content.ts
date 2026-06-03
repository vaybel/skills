import { callMCPTool } from "../../client.js";

export type ContentFormat = "video" | "slideshow" | "carousel" | "single";
export type SocialChannel = "tiktok" | "instagram" | "youtube" | "x";
export type SalesChannel = "tiktok_shop" | "etsy" | "shopify" | "storefront";

export interface GenerateContentInput {
  listing_id: string;
  archetype?: string;
  short_type?: "lifestyle" | "studio" | string;
  format?: ContentFormat;
  image_urls?: string[];
  target_sales_channel?: SalesChannel | string;
}

export interface GenerateContentResponse {
  handle: string;
  content_id: string;
  task_id: string;
  status: "pending";
  listing_id: string;
  format: string;
  message?: string;
}

export interface ContentStatus {
  status: "pending" | "running" | "complete" | "failed" | string;
  handle?: string;
  task_id?: string;
  resource_id?: string | null;
  done?: boolean;
  content_id: string;
  phase: string;
  progress: number;
  format: string;
  requires_video_assembly: boolean;
  resolved_sales_channel: string;
  video_url: string | null;
  image_urls: string[];
  publishable_image_refs: string[];
  duration_seconds: number | null;
  scenes_count: number;
  error: string;
}

export interface SalesChannelDestination {
  is_live: boolean;
  public_url: string | null;
  listing_id: string | null;
}

export interface SocialDestination {
  sales_channel: string;
  public_url: string | null;
  listing_id: string | null;
  is_live: boolean;
}

export interface ResolveSalesChannelsResponse {
  listing_id: string;
  product_design_uuid: string;
  sales_channels: Record<string, SalesChannelDestination>;
  social_channels: Record<string, SocialDestination | null>;
}

export interface CtaPolicy {
  social_channel: string;
  sales_channel: string;
  cta_phrase: string;
  allow_caption_link: boolean;
  name_sales_platform: boolean;
  link_mechanic: string;
  note: string;
  prompt_guardrails: string[];
}

export interface MarketingPost {
  id: string;
  content_id?: string;
  channel: string;
  text: string;
  hashtags: string[];
  link_url: string | null;
  status: string;
  post_url: string | null;
  external_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created?: boolean;
  [key: string]: unknown;
}

export interface PublishSocialPostResult {
  channel: string;
  status: string;
  publish_url: string | null;
  external_id: string | null;
  error: string | null;
}

export function generateContent(input: GenerateContentInput): Promise<GenerateContentResponse> {
  return callMCPTool<GenerateContentResponse>("content.generate", input);
}

export function getContentStatus(contentId: string): Promise<ContentStatus> {
  return callMCPTool<ContentStatus>("content.get", { handle: contentId });
}

export function waitForContent(contentId: string, timeoutSec = 900): Promise<ContentStatus> {
  return callMCPTool<ContentStatus>("content.get", {
    handle: contentId,
    wait_sec: timeoutSec,
  });
}

export function listContent(input: {
  listing_id?: string;
  page?: number;
  page_size?: number;
} = {}): Promise<{ results: ContentStatus[]; total: number }> {
  return callMCPTool<{ results: ContentStatus[]; total: number }>("content.list", input);
}

export function deleteContent(contentId: string): Promise<{ ok: boolean }> {
  return callMCPTool<{ ok: boolean }>("content.delete", { content_id: contentId });
}

export function resolveSalesChannels(listingId: string): Promise<ResolveSalesChannelsResponse> {
  return callMCPTool<ResolveSalesChannelsResponse>("content.resolve_sales_channels", {
    listing_id: listingId,
  });
}

export function getCtaPolicy(
  socialChannel: SocialChannel | string,
  salesChannel?: SalesChannel | string,
): Promise<CtaPolicy> {
  return callMCPTool<CtaPolicy>("content.get_cta_policy", {
    social_channel: socialChannel,
    sales_channel: salesChannel,
  });
}

export function generateSocialPosts(
  contentId: string,
  channels: Array<SocialChannel | string>,
): Promise<{ content_id: string; posts: MarketingPost[] }> {
  return callMCPTool<{ content_id: string; posts: MarketingPost[] }>(
    "social_post.generate",
    {
      content_id: contentId,
      channels,
    },
  );
}

export function listSocialPosts(contentId: string): Promise<{ content_id: string; posts: MarketingPost[] }> {
  return callMCPTool<{ content_id: string; posts: MarketingPost[] }>(
    "social_post.list",
    { content_id: contentId },
  );
}

export function updateSocialPost(input: {
  post_id: string;
  post_text?: string;
  hashtags?: string[];
  link_url?: string;
}): Promise<MarketingPost> {
  return callMCPTool<MarketingPost>("social_post.update", input);
}

export function publishSocialPosts(input: {
  content_id: string;
  channels: Array<SocialChannel | string>;
  tiktok_settings?: Record<string, unknown>;
}): Promise<{ content_id: string; results: PublishSocialPostResult[] }> {
  return callMCPTool<{ content_id: string; results: PublishSocialPostResult[] }>(
    "social_post.publish",
    input,
  );
}
