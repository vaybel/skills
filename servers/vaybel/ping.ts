import { callMCPTool } from "../../client.js";

export interface PingInput {
  echo?: string;
}

export interface PingResponse {
  echo: string;
}

export function ping(input: PingInput = {}): Promise<PingResponse> {
  return callMCPTool<PingResponse>("ping", input);
}
