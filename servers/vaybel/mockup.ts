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

export type MockupFeedback = "like" | "dislike" | null;

// A saved mockup, as mockup.list, mockup.get and mockup.show return it. This
// is not the polling row above: the image is in `image`, and `status` is the
// stored value, `CREATED` for a finished mockup.
export interface SavedMockup {
  id: string;
  view?: string | null;
  external_key?: string;
  type?: string;
  image: string | null;
  video: string | null;
  status: "PREPARING" | "QUEUED" | "GENERATING" | "CREATED" | "FAILED" | string;
  selected?: boolean;
  feedback?: MockupFeedback;
  created_at?: string;
  step_message: string;
  error_message: string;
  // The design's mockups page in the app.
  url?: string;
}

export interface MockupPage {
  results: SavedMockup[];
  total: number;
  page: number;
  page_size: number;
}

export function listMockups(
  designId: string,
  input: { status?: string; group?: string; page?: number; page_size?: number } = {},
): Promise<MockupPage> {
  return callMCPTool<MockupPage>("mockup.list", { design_id: designId, ...input });
}

export function getMockup(mockupId: string): Promise<SavedMockup> {
  return callMCPTool<SavedMockup>("mockup.get", { mockup_id: mockupId });
}

// Returns the finished mockups for 1-20 ids. In a host that renders MCP UI this
// tool also draws the gallery; here it returns the same records.
export function showMockups(mockupIds: string[]): Promise<{ results: SavedMockup[]; total: number }> {
  return callMCPTool<{ results: SavedMockup[]; total: number }>("mockup.show", {
    mockup_ids: mockupIds,
  });
}

// Generates a finished or failed mockup again in place: the new image replaces
// the current one. Free; follow the returned handle with waitForMockup.
export function retryMockup(
  mockupId: string,
  feedback?: string,
): Promise<{ mockup_id: string; handle: string; status: "pending" }> {
  return callMCPTool<{ mockup_id: string; handle: string; status: "pending" }>("mockup.retry", {
    mockup_id: mockupId,
    ...(feedback === undefined ? {} : { feedback }),
  });
}

// Replaces the mockup's saved rating; `null` removes it.
export function submitMockupFeedback(
  mockupId: string,
  feedback: MockupFeedback,
): Promise<SavedMockup> {
  return callMCPTool<SavedMockup>("mockup.submit_feedback", { mockup_id: mockupId, feedback });
}

// Selected mockups are the ones listing.create puts on a listing.
export function updateMockupSelection(mockupId: string, selected: boolean): Promise<SavedMockup> {
  return callMCPTool<SavedMockup>("mockup.update_selection", { mockup_id: mockupId, selected });
}
