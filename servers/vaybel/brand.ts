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

export interface SetBrandDNAInput {
  brand_description?: string;
  colors?: string[];
  typography?: string;
  tone?: string;
  product_types?: string[];
  niches?: Array<string | { name: string }>;
  // A preset may be passed as just `{ key, is_preset: true }`.
  audiences?: Array<Partial<BrandAudience> & { key: string }>;
  user_brand_input?: string;
  logo?: { logo_url?: string; logo_s3_key?: string; logo_description?: string };
}

export interface SetBrandDNAResponse {
  brand_description: string;
  colors: string[];
  typography: string;
  tone: string;
  product_types: string[];
  niches: BrandNiche[];
  audiences: BrandAudience[];
  trend_pipeline_requested: boolean;
}

// brand_dna.set replaces the whole profile: every field left out is saved
// empty, except the logo. Read brand_dna.get first and pass back what should stay.
export function setBrandDNA(input: SetBrandDNAInput): Promise<SetBrandDNAResponse> {
  return callMCPTool<SetBrandDNAResponse>("brand_dna.set", input);
}

export interface AudiencePreset {
  key: string;
  label: string;
  age_range: string;
  gender_options: AudienceGender[];
  ethnicity_options: string[];
  description: string;
}

export function listAudiencePresets(): Promise<{ presets: AudiencePreset[] }> {
  return callMCPTool<{ presets: AudiencePreset[] }>("brand_dna.list_audience_presets");
}
