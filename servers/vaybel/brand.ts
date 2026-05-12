import { callMCPTool } from "../../client.js";

export interface BrandDNA {
  has_brand_kit: boolean;
  brand_description: string;
  user_brand_input: string;
  colors: string[];
  typography: string;
  tone: string;
  product_types: string[];
  logo_url: string | null;
  logo_description: string | null;
}

export function getBrandDNA(): Promise<BrandDNA> {
  return callMCPTool<BrandDNA>("get_brand_dna");
}
