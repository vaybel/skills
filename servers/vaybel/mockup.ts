import { callMCPTool, pollToolUntilDone } from "../../client.js";

export type MockupQuality = "standard" | "pro";
export type MockupKind = "flat" | "detail_closeup" | "vto";
export type MockupGender = "men" | "women";

export interface GenerateMockupInput {
  design_id: string;
  kinds?: MockupKind[];
  audience_key?: string;
  gender?: MockupGender;
  quality?: MockupQuality;
}

export interface GenerateMockupResponse {
  // `null` when every requested mockup already existed (status "complete") -
  // the existing ids are in `mockup_ids`, nothing to poll.
  handle: string | null;
  status: "pending" | "complete";
  credit_units: number;
  mockup_ids: string[];
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
  handle?: string;
  resource_id?: string | null;
  progress?: number | null;
  done?: boolean;
  mockups: Mockup[];
}

export function generateMockup(input: GenerateMockupInput): Promise<GenerateMockupResponse> {
  return callMCPTool<GenerateMockupResponse>("mockup.generate", input);
}

export function getMockupStatus(handle: string): Promise<MockupStatus> {
  return callMCPTool<MockupStatus>("mockup.get_generation", { handle });
}

export function waitForMockup(handle: string, timeoutSec = 300): Promise<MockupStatus> {
  return pollToolUntilDone<MockupStatus>("mockup.get_generation", { handle }, timeoutSec);
}

export function listMockups(designId: string): Promise<{ results: Mockup[] }> {
  return callMCPTool<{ results: Mockup[] }>("mockup.list", { design_id: designId });
}
