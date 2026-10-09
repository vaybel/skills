import { callMCPTool } from "../../client.js";
import type { DesignPlacementImage } from "./design.js";

export interface WorkspaceDesignCard {
  id: string;
  title: string;
  url: string;
  status: string;
  product_images: DesignPlacementImage[];
}

export interface WorkspaceMockup {
  id: string;
  view: string;
  image_url: string | null;
  url: string;
}

export interface WorkspaceView {
  account_id: string;
  library: { results: WorkspaceDesignCard[]; total: number; page: number; page_size: number };
  search: string;
  // Set when a design_id was passed: that design and its completed mockups.
  selection: {
    design: WorkspaceDesignCard;
    mockups: { results: WorkspaceMockup[]; total: number; page: number; page_size: number };
  } | null;
}

// A read-only view of saved designs and their completed mockups. In a host that
// renders MCP UI this tool also opens the visual panel; here it returns the data.
export function openWorkspace(
  input: { design_id?: string; search?: string; page?: number; mockup_page?: number } = {},
): Promise<WorkspaceView> {
  return callMCPTool<WorkspaceView>("workspace.open", input);
}
