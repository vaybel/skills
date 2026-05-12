import { callMCPTool } from "../../client.js";

export interface GenerateDesignInput {
  product_uuid: string;
  prompt: string;
  variant_group_uuid?: string;
}

export interface GenerateDesignResponse {
  task_id: string;
}

export interface DesignStatus {
  status: "pending" | "running" | "complete" | "failed";
  design_id: string | null;
  progress: number | null;
  stage: string;
  image_url: string | null;
  error: string;
}

export function generateDesign(input: GenerateDesignInput): Promise<GenerateDesignResponse> {
  return callMCPTool<GenerateDesignResponse>("generate_design", input);
}

export function getDesignStatus(taskId: string): Promise<DesignStatus> {
  return callMCPTool<DesignStatus>("get_design_status", { task_id: taskId });
}

export function waitForDesign(taskId: string, timeoutSec = 300): Promise<DesignStatus> {
  return callMCPTool<DesignStatus>("wait_for_design", {
    task_id: taskId,
    timeout_sec: timeoutSec,
  });
}
