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
  return callMCPTool<ListBlanksResponse>("list_blanks", input);
}
