import { callMCPTool, pollToolUntilDone } from "../../client.js";

export interface VirtualModel {
  id: string;
  audience_key: string;
  audience_label: string;
  gender: string;
  ethnicity: string;
  age: number | string | null;
  // `CREATED` models can be used for virtual try-on mockups.
  status: "DRAFT" | "CREATED" | "FAILED" | string;
  image_url: string | null;
}

export interface VirtualModelPage {
  results: VirtualModel[];
  total: number;
  page: number;
  page_size: number;
}

export interface GenerateVirtualModelsResponse {
  // `null` when every gender in the audience already had a model - nothing to poll.
  handle: string | null;
  audience_key: string;
  status: "pending" | "complete";
  credit_units: number;
  virtual_model_ids: string[];
  message?: string;
}

export interface VirtualModelStatus {
  handle: string;
  status: "pending" | "running" | "complete" | "failed";
  progress?: number | null;
  done?: boolean;
  virtual_models: VirtualModel[];
}

export function listVirtualModels(
  input: { audience_key?: string; status?: string; page?: number; page_size?: number } = {},
): Promise<VirtualModelPage> {
  return callMCPTool<VirtualModelPage>("virtual_model.list", input);
}

// Generates one model for each gender in the audience that has none; one credit per model.
export function generateVirtualModels(audienceKey: string): Promise<GenerateVirtualModelsResponse> {
  return callMCPTool<GenerateVirtualModelsResponse>("virtual_model.generate", {
    audience_key: audienceKey,
  });
}

export function getVirtualModelStatus(handle: string): Promise<VirtualModelStatus> {
  return callMCPTool<VirtualModelStatus>("virtual_model.get_generation", { handle });
}

export function waitForVirtualModels(handle: string, timeoutSec = 300): Promise<VirtualModelStatus> {
  return pollToolUntilDone<VirtualModelStatus>("virtual_model.get_generation", { handle }, timeoutSec);
}
