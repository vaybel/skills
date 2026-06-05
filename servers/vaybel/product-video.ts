import { callMCPTool } from "../../client.js";

export type ProductVideoChannel = "tiktok_shop" | "etsy";

export interface GenerateProductVideoInput {
  design_id: string;
  channels?: ProductVideoChannel[];
}

export interface GenerateProductVideoResponse {
  video_ids: string[];
  channels: ProductVideoChannel[];
  status: "pending" | "complete";
  message?: string;
}

export interface ProductVideo {
  id: string;
  channel: ProductVideoChannel | string;
  video_type: string;
  status: "pending" | "running" | "complete" | "failed" | string;
  video_url: string | null;
  aspect_ratio: string;
  error: string;
}

export interface ProductVideoStatus {
  design_id: string;
  status: "pending" | "running" | "complete" | "failed" | string;
  done?: boolean;
  videos: ProductVideo[];
}

export function generateProductVideo(
  input: GenerateProductVideoInput,
): Promise<GenerateProductVideoResponse> {
  return callMCPTool<GenerateProductVideoResponse>("product_video.generate", input);
}

export function getProductVideoStatus(designId: string): Promise<ProductVideoStatus> {
  return callMCPTool<ProductVideoStatus>("product_video.get", { design_id: designId });
}

export function waitForProductVideo(
  designId: string,
  timeoutSec = 600,
): Promise<ProductVideoStatus> {
  return callMCPTool<ProductVideoStatus>("product_video.get", {
    design_id: designId,
    wait_sec: timeoutSec,
  });
}
