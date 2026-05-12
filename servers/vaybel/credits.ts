import { callMCPTool } from "../../client.js";

export interface CheckCreditsInput {
  required?: number;
}

export interface CheckCreditsResponse {
  balance: number;
  required: number;
  sufficient: boolean;
}

export function checkCredits(input: CheckCreditsInput = {}): Promise<CheckCreditsResponse> {
  return callMCPTool<CheckCreditsResponse>("check_credits", input);
}
