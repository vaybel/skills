export function preflightEnvironment(): void {
  if (
    !process.env.VAYBEL_PAT &&
    !process.env.VAYBEL_MCP_TOKEN &&
    !process.env.CLAUDE_PLUGIN_OPTION_vaybel_pat
  ) {
    throw new Error("Set VAYBEL_PAT or configure the Vaybel PAT plugin option before running this skill.");
  }
}

export function readValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}

export function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parsePositiveInt(value: string, flag: string, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) {
    throw new Error(`${flag} must be an integer between 1 and ${max}`);
  }
  return parsed;
}

export function dashboardUrl(path: string): string {
  const base = process.env.VAYBEL_APP_URL || process.env.CLAUDE_PLUGIN_OPTION_app_url || "https://vaybel.com";
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function stringifyValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "n/a";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

export function truncate(value: string, max = 220): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 3)}...`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
