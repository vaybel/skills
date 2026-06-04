import { callMCPTool } from "../../client.js";

export type AudienceGender = "men" | "women" | string;

export interface BrandAudience {
  key: string;
  label: string;
  gender_options: AudienceGender[];
  ethnicity_options?: string[];
  age_range?: {
    min: number | null;
    max: number | null;
  };
}

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
  audiences?: BrandAudience[];
}

export function getBrandDNA(): Promise<BrandDNA> {
  return callMCPTool<BrandDNA>("brand_dna.get_brand_dna");
}
