import { callMCPTool } from "../../client.js";

export type MockupQuality = "standard" | "pro";

export interface GenerateMockupInput {
  design_id: string;
  quality?: MockupQuality;
}

export interface GenerateMockupResponse {
  handle: string | null;
  handles: string[];
  task_id: string;
  mockup_ids: string[];
  status: "pending" | "complete";
  message?: string;
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
  handle?: string | string[];
  resource_id?: string | null;
  progress?: number | null;
  done?: boolean;
  mockups: Mockup[];
}

export function generateMockup(input: GenerateMockupInput): Promise<GenerateMockupResponse> {
  return callMCPTool<GenerateMockupResponse>("mockup.generate_mockup", input);
}

export function getMockupStatus(mockupIds: string[]): Promise<MockupStatus> {
  return callMCPTool<MockupStatus>("mockup.get", { handle: mockupIds });
}

export function waitForMockup(mockupIds: string[], timeoutSec = 300): Promise<MockupStatus> {
  return callMCPTool<MockupStatus>("mockup.get", {
    handle: mockupIds,
    wait_sec: timeoutSec,
  });
}
