import { callMCPTool } from "../../client.js";

export interface GenerateDesignInput {
  product_uuid: string;
  prompt: string;
  variant_group_uuid?: string;
}

export interface GenerateDesignResponse {
  handle: string;
  task_id: string;
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
  return callMCPTool<GenerateDesignResponse>("design.generate_design", input);
}

export function getDesignStatus(taskId: string): Promise<DesignStatus> {
  return callMCPTool<DesignStatus>("design.get", { handle: taskId });
}

export function waitForDesign(taskId: string, timeoutSec = 300): Promise<DesignStatus> {
  return callMCPTool<DesignStatus>("design.get", {
    handle: taskId,
    wait_sec: timeoutSec,
  });
}
