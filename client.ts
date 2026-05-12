import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const DEFAULT_MCP_URL = "https://mcp.vaybel.com/";
const CLIENT_NAME = "vaybel-skills";
const CLIENT_VERSION = "0.1.0";

let clientPromise: Promise<Client> | null = null;

export type ToolInput = object;

export class VaybelMCPError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VaybelMCPError";
  }
}

export async function callMCPTool<T>(name: string, input: ToolInput = {}): Promise<T> {
  const client = await getClient();
  const result = await client.callTool({
    name,
    arguments: compactInput(input),
  });

  return unwrapToolResult<T>(name, result);
}

export async function closeMCPClient(): Promise<void> {
  if (!clientPromise) {
    return;
  }
  const client = await clientPromise;
  clientPromise = null;
  await client.close();
}

async function getClient(): Promise<Client> {
  if (clientPromise) {
    return clientPromise;
  }

  clientPromise = connectClient();
  return clientPromise;
}

async function connectClient(): Promise<Client> {
  const token =
    process.env.VAYBEL_PAT ||
    process.env.VAYBEL_MCP_TOKEN ||
    process.env.CLAUDE_PLUGIN_OPTION_vaybel_pat;
  if (!token) {
    throw new VaybelMCPError(
      "Missing Vaybel auth. Set VAYBEL_PAT to a PAT from Dashboard -> Settings -> MCP.",
    );
  }

  const url = new URL(
    process.env.VAYBEL_MCP_URL || process.env.CLAUDE_PLUGIN_OPTION_mcp_url || DEFAULT_MCP_URL,
  );
  const transport = new StreamableHTTPClientTransport(url, {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const client = new Client(
    {
      name: CLIENT_NAME,
      version: CLIENT_VERSION,
    },
    {
      capabilities: {},
    },
  );

  await client.connect(transport as Parameters<Client["connect"]>[0]);
  return client;
}

function compactInput(input: ToolInput): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter((entry): entry is [string, unknown] => entry[1] !== undefined),
  );
}

function unwrapToolResult<T>(name: string, result: unknown): T {
  const payload = result as {
    isError?: boolean;
    content?: Array<{ type: string; text?: string }>;
    structuredContent?: unknown;
  };

  if (payload.isError) {
    throw new VaybelMCPError(renderToolError(name, payload.content));
  }

  if (payload.structuredContent !== undefined) {
    return payload.structuredContent as T;
  }

  const textContent = payload.content?.find((item) => item.type === "text" && item.text)?.text;
  if (!textContent) {
    return payload as T;
  }

  try {
    return JSON.parse(textContent) as T;
  } catch {
    return textContent as T;
  }
}

function renderToolError(name: string, content: Array<{ type: string; text?: string }> | undefined): string {
  const message = content?.find((item) => item.type === "text" && item.text)?.text;
  return `${name} failed${message ? `: ${message}` : ""}`;
}
