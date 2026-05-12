import { callMCPTool } from "../../client.js";

export type MockupQuality = "standard" | "pro";

export interface GenerateMockupInput {
  design_id: string;
  quality?: MockupQuality;
}

export interface GenerateMockupResponse {
  task_id: string;
  mockup_ids: string[];
}

export interface Mockup {
  id: string;
  status: "pending" | "running" | "complete" | "failed";
  external_key: string;
  image_url: string | null;
  error: string;
  stage: string;
}

export interface MockupStatus {
  status: "pending" | "running" | "complete" | "failed";
  mockups: Mockup[];
}

export function generateMockup(input: GenerateMockupInput): Promise<GenerateMockupResponse> {
  return callMCPTool<GenerateMockupResponse>("generate_mockup", input);
}

export function getMockupStatus(mockupIds: string[]): Promise<MockupStatus> {
  return callMCPTool<MockupStatus>("get_mockup_status", { mockup_ids: mockupIds });
}

export function waitForMockup(mockupIds: string[], timeoutSec = 300): Promise<MockupStatus> {
  return callMCPTool<MockupStatus>("wait_for_mockup", {
    mockup_ids: mockupIds,
    timeout_sec: timeoutSec,
  });
}
