import { callMCPTool, pollToolUntilDone } from "../../client.js";

export interface GenerateDesignInput {
  product_uuid: string;
  prompt: string;
  variant_group_uuid?: string;
}

export interface GenerateDesignResponse {
  handle: string;
  task_id?: string;
  status: "pending";
  message?: string;
}

export interface DesignStatus {
  status: "pending" | "running" | "complete" | "failed";
  handle?: string;
  task_id?: string;
  resource_id?: string | null;
  done?: boolean;
  design_id: string | null;
  progress: number | null;
  stage: string;
  image_url: string | null;
  error: string;
}

export function generateDesign(input: GenerateDesignInput): Promise<GenerateDesignResponse> {
  return callMCPTool<GenerateDesignResponse>("design.generate", input);
}

export function getDesignStatus(taskId: string): Promise<DesignStatus> {
  return callMCPTool<DesignStatus>("design.get_generation", { handle: taskId });
}

export function waitForDesign(taskId: string, timeoutSec = 300): Promise<DesignStatus> {
  return pollToolUntilDone<DesignStatus>("design.get_generation", { handle: taskId }, timeoutSec);
}

export interface EditDesignInput {
  design_id: string;
  instruction: string;
  // Omit to keep the base design's colorway.
  variant_group_uuid?: string;
}

// design.edit saves a new design linked to the base; the base is kept.
export function editDesign(input: EditDesignInput): Promise<GenerateDesignResponse> {
  return callMCPTool<GenerateDesignResponse>("design.edit", input);
}

export interface DesignPlacementImage {
  placement: string;
  image_url: string;
}

export interface Design {
  id: string;
  url: string;
  title: string;
  type: string;
  generation_status: string;
  generation_stage: string;
  generation_progress: number | null;
  generation_error: string;
  prompt: string;
  catalog_product: { uuid: string; title: string; vaybel_sku: string } | null;
  catalog_variant_group_uuid: string | null;
  master_design_uuid: string | null;
  referenced_product_design_uuid: string | null;
  trend_match_uuid: string | null;
  created_at: string;
}

export type DesignImageView = "product" | "artwork";

export interface DesignDetail extends Design {
  // The design on the garment, front first. Empty when no preview is saved.
  product_images: DesignPlacementImage[];
  // Raw artwork for each placement.
  images: DesignPlacementImage[];
  image_view: DesignImageView;
}

export interface DesignPage {
  results: Design[];
  total: number;
  page: number;
  page_size: number;
}

export function getDesign(
  designId: string,
  imageView: DesignImageView = "product",
): Promise<DesignDetail> {
  return callMCPTool<DesignDetail>("design.get", { design_id: designId, image_view: imageView });
}

export function listDesigns(
  input: { page?: number; page_size?: number; search?: string } = {},
): Promise<DesignPage> {
  return callMCPTool<DesignPage>("design.list", input);
}

// Earlier edits and colorway siblings of one design, oldest first.
export function getDesignHistory(designId: string): Promise<{ results: Design[] }> {
  return callMCPTool<{ results: Design[] }>("design.get_history", { design_id: designId });
}

export type FeedbackValue = "like" | "dislike" | null;
export type DesignFeedbackReason =
  | "not_what_i_asked"
  | "wrong_style"
  | "low_quality"
  | "text_off"
  | "other";

export interface DesignFeedback {
  feedback: FeedbackValue;
  reason: DesignFeedbackReason | null;
  note: string;
}

// Replaces the caller's earlier rating of the design; `feedback: null` removes it.
export function submitDesignFeedback(input: {
  design_id: string;
  feedback: FeedbackValue;
  reason?: DesignFeedbackReason;
  note?: string;
}): Promise<DesignFeedback> {
  return callMCPTool<DesignFeedback>("design.submit_feedback", input);
}
