import { callMCPTool } from "../../client.js";

export interface CatalogProduct {
  uuid: string;
  vaybel_sku: string;
  handle: string;
  name: string;
  title: string;
  type: string;
  brand: string;
  default_technique: string | null;
  category: string;
  product_tier?: string;
  genders?: string[];
  research?: {
    status: "available" | "not_available" | "published_research_snapshot";
    slug?: string;
    url?: string;
  };
}

export interface ListBlanksInput {
  search?: string;
  technique?: string;
  category?: string;
  limit?: number;
}

export interface ListBlanksResponse {
  products: CatalogProduct[];
  count: number;
}

export function listBlanks(input: ListBlanksInput = {}): Promise<ListBlanksResponse> {
  return callMCPTool<ListBlanksResponse>("catalog.list_blanks", input);
}

export type BlankSection = "overview" | "materials" | "sizing" | "construction";

export interface BlankDetail extends CatalogProduct {
  launch_url: string;
  research: {
    status: "published_research_snapshot" | "not_available";
    slug?: string;
    revision?: string;
    researched_at?: string | null;
    url?: string;
    selection_summary?: {
      suitable_for: Array<{ text: string; claim_ids: string[]; kind: string }>;
      tradeoffs: Array<{ text: string; claim_ids: string[]; kind: string }>;
      limitations: string;
    };
    data?: Record<string, unknown>;
    pagination?: Record<string, { total: number; next_offset: number | null }>;
    evidence_pagination?: { total: number; next_offset: number | null };
    claims?: Array<Record<string, unknown>>;
    sources?: Array<Record<string, unknown>>;
    conflicts?: Array<Record<string, unknown>>;
    gaps?: Array<Record<string, unknown>>;
  };
  measurement_tables?: Array<Record<string, unknown>>;
}

export function getBlank(input: { product_id: string; section?: BlankSection; offset?: number }): Promise<{ product: BlankDetail }> {
  return callMCPTool("catalog.get_blank", input);
}

export function compareBlanks(input: { product_ids: string[]; section?: BlankSection; offset?: number }): Promise<{ products: BlankDetail[]; section: BlankSection }> {
  return callMCPTool("catalog.compare_blanks", input);
}
