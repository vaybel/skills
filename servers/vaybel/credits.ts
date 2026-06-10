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
  return callMCPTool<CheckCreditsResponse>("credits.check", input);
}

export interface CreditCost {
  action: string;
  label: string;
  credits: number;
}

export function listCosts(): Promise<{ costs: CreditCost[] }> {
  return callMCPTool<{ costs: CreditCost[] }>("credits.list_costs");
}

export interface CreditUsageRow {
  action: string;
  label: string;
  credits_used: number;
  status: string;
  description: string;
  tool: string | null;
  billing_mode: string;
  created_at: string;
}

export function listUsage(input: {
  days?: number;
  page?: number;
  page_size?: number;
} = {}): Promise<{ results: CreditUsageRow[]; total: number }> {
  return callMCPTool<{ results: CreditUsageRow[]; total: number }>("credits.list_usage", input);
}
