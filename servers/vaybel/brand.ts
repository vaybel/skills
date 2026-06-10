import { callMCPTool } from "../../client.js";

export type AudienceGender = "men" | "women" | string;

export interface BrandAudience {
  key: string;
  label: string;
  gender_options: AudienceGender[];
  ethnicity_options?: string[];
  // "min-max" string - the exact shape brand_dna.set accepts back.
  age_range?: string;
  description?: string;
  is_preset?: boolean;
  created_at?: string;
}

export interface BrandNiche {
  name: string;
  is_preset: boolean;
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
  // Pass these back through brand_dna.set to keep them - omitting niches
  // there replaces them with [].
  niches?: BrandNiche[];
}

export function getBrandDNA(): Promise<BrandDNA> {
  return callMCPTool<BrandDNA>("brand_dna.get");
}
