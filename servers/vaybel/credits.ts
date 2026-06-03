import { callMCPTool } from "../../client.js";

export interface CheckCreditsInput {
  required?: number;
}

export interface CheckCreditsResponse {
  balance: number | null;
  required: number;
  sufficient: boolean;
  billing_mode?: string;
}

export function checkCredits(input: CheckCreditsInput = {}): Promise<CheckCreditsResponse> {
  return callMCPTool<CheckCreditsResponse>("credits.check_credits", input);
}
