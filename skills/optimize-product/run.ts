import { closeMCPClient } from "../../client.js";
import {
  checkDuplicate,
  listProviderProducts,
  listProviders,
  optimizeProduct,
  refreshListing,
  waitForOptimizeTask,
  type DuplicateCheck,
  type OptimizeProvider,
  type OptimizeTaskStatus,
  type ProviderProduct,
} from "../../servers/vaybel/index.js";
import {
  dashboardUrl,
  parsePositiveInt,
  preflightEnvironment,
  readValue,
  stringifyValue,
  truncate,
} from "../shared.js";

const DEFAULT_TIMEOUT_SEC = 300;
const DEFAULT_PAGE_SIZE = 20;

interface Options {
  provider?: string;
  productId?: string;
  shopId?: string;
  designId?: string;
  list: boolean;
  force: boolean;
  refresh: boolean;
  page: number;
  pageSize: number;
  timeoutSec: number;
  json: boolean;
}

type Summary =
  | {
      mode: "providers";
      providers: OptimizeProvider[];
    }
  | {
      mode: "provider_products";
      provider: string;
      products: ProviderProduct[];
      total: number;
      page: number;
      total_pages: number;
    }
  | {
      mode: "already_imported";
      provider: string;
      product_id: string;
      duplicate: DuplicateCheck;
      refresh?: Awaited<ReturnType<typeof refreshListing>>;
      dashboard_url: string | null;
    }
  | {
      mode: "imported";
      provider: string;
      product_id: string;
      task_id: string;
      status: OptimizeTaskStatus;
      dashboard_url: string | null;
    }
  | {
      mode: "refreshed";
      design_id: string;
      refresh: Awaited<ReturnType<typeof refreshListing>>;
      dashboard_url: string;
    };

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  try {
    const summary = await runOptimize(options);
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(renderMarkdown(summary));
    }
  } finally {
    await closeMCPClient();
  }
}

async function runOptimize(options: Options): Promise<Summary> {
  preflightEnvironment();

  if (options.refresh && options.designId) {
    const refreshed = await refreshListing(options.designId);
    return {
      mode: "refreshed",
      design_id: options.designId,
      refresh: refreshed,
      dashboard_url: dashboardUrl(`/dashboard/optimize/${options.designId}`),
    };
  }

  if (!options.provider) {
    const providers = await listProviders();
    if (options.list) {
      return { mode: "providers", providers: providers.providers };
    }
    throw new Error(
      `--provider is required. Connected providers: ${providers.providers.map((p) => p.key).join(", ") || "none"}`,
    );
  }

  if (options.list || !options.productId) {
    const input: {
      provider: string;
      page: number;
      page_size: number;
      shop_id?: string;
    } = {
      provider: options.provider,
      page: options.page,
      page_size: options.pageSize,
    };
    if (options.shopId) {
      input.shop_id = options.shopId;
    }
    const products = await listProviderProducts(input);
    return {
      mode: "provider_products",
      provider: options.provider,
      products: products.results,
      total: products.total,
      page: products.page,
      total_pages: products.total_pages,
    };
  }

  const duplicate = await checkDuplicate(options.provider, options.productId);
  if (duplicate.is_imported && duplicate.existing_design_uuid && !options.force) {
    const refreshed = options.refresh ? await refreshListing(duplicate.existing_design_uuid) : undefined;
    const summary: Summary = {
      mode: "already_imported",
      provider: options.provider,
      product_id: options.productId,
      duplicate,
      dashboard_url: dashboardUrl(`/dashboard/optimize/${duplicate.existing_design_uuid}`),
    };
    if (refreshed) {
      summary.refresh = refreshed;
    }
    return summary;
  }

  const input: { provider: string; product_id: string; shop_id?: string } = {
    provider: options.provider,
    product_id: options.productId,
  };
  if (options.shopId) {
    input.shop_id = options.shopId;
  }
  const task = await optimizeProduct(input);
  const status = await waitForOptimizeTask(task.task_id, options.timeoutSec);
  if (status.status === "failed" || status.status === "cancelled") {
    throw new Error(`Optimize task ${status.status}: ${status.error || status.message || "no error returned"}`);
  }

  return {
    mode: "imported",
    provider: options.provider,
    product_id: options.productId,
    task_id: task.task_id,
    status,
    dashboard_url: status.product_design_uuid
      ? dashboardUrl(`/dashboard/optimize/${status.product_design_uuid}`)
      : null,
  };
}

function renderMarkdown(summary: Summary): string {
  if (summary.mode === "providers") {
    return [
      "# Vaybel Optimize Providers",
      "",
      ...summary.providers.map((provider) => {
        const shop = provider.shop_id ? `, shop ${provider.shop_id}` : "";
        return `- ${provider.name || provider.key} (${provider.key}${shop})`;
      }),
    ].join("\n");
  }

  if (summary.mode === "provider_products") {
    return [
      "# Vaybel Provider Products",
      "",
      `- Provider: ${summary.provider}`,
      `- Page: ${summary.page} of ${summary.total_pages}`,
      `- Total: ${summary.total}`,
      "",
      ...summary.products.slice(0, 20).map((product) => {
        const state = product.is_imported
          ? `imported as ${product.existing_design_uuid || "existing design"}`
          : product.is_supported
            ? "ready"
            : "unsupported";
        return `- ${product.title} (${product.external_id}) - ${state}`;
      }),
    ].join("\n");
  }

  if (summary.mode === "already_imported") {
    const lines = [
      "# Vaybel Optimize Summary",
      "",
      `- Provider: ${summary.provider}`,
      `- Product: ${summary.product_id}`,
      `- Status: already imported`,
      `- Existing design: ${summary.duplicate.existing_design_uuid}`,
    ];
    if (summary.refresh) {
      lines.push(`- Listing refresh: ${summary.refresh.message}`);
    }
    if (summary.dashboard_url) {
      lines.push("", `Continue in dashboard: ${summary.dashboard_url}`);
    }
    return lines.join("\n");
  }

  if (summary.mode === "refreshed") {
    return [
      "# Vaybel Optimize Refresh",
      "",
      `- Design: ${summary.design_id}`,
      `- Found listing: ${summary.refresh.found ? "yes" : "no"}`,
      `- Channel: ${stringifyValue(summary.refresh.channel)}`,
      `- Listing: ${stringifyValue(summary.refresh.listing_uuid)}`,
      `- Message: ${summary.refresh.message}`,
      "",
      `Continue in dashboard: ${summary.dashboard_url}`,
    ].join("\n");
  }

  const status = summary.status;
  return [
    "# Vaybel Optimize Summary",
    "",
    `- Provider: ${summary.provider}`,
    `- Product: ${summary.product_id}`,
    `- Task: ${summary.task_id}`,
    `- Status: ${status.status}`,
    `- Progress: ${stringifyValue(status.progress)}`,
    `- Message: ${truncate(status.message || "n/a", 200)}`,
    `- Design: ${stringifyValue(status.product_design_uuid)}`,
    `- Listing: ${stringifyValue(status.listing_uuid)}`,
    "",
    summary.dashboard_url ? `Continue in dashboard: ${summary.dashboard_url}` : "Dashboard link will be available after the design is created.",
  ].join("\n");
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    list: false,
    force: false,
    refresh: false,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    timeoutSec: DEFAULT_TIMEOUT_SEC,
    json: false,
  };
  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }
    if (arg === "--json") {
      options.json = true;
    } else if (arg === "--provider") {
      options.provider = readValue(args, ++index, arg);
    } else if (arg === "--product-id" || arg === "--product") {
      options.productId = readValue(args, ++index, arg);
    } else if (arg === "--shop-id") {
      options.shopId = readValue(args, ++index, arg);
    } else if (arg === "--design-id") {
      options.designId = readValue(args, ++index, arg);
    } else if (arg === "--list") {
      options.list = true;
    } else if (arg === "--force") {
      options.force = true;
    } else if (arg === "--refresh-listing") {
      options.refresh = true;
    } else if (arg === "--page") {
      options.page = parsePositiveInt(readValue(args, ++index, arg), arg, 1000);
    } else if (arg === "--page-size" || arg === "--limit") {
      options.pageSize = parsePositiveInt(readValue(args, ++index, arg), arg, 100);
    } else if (arg === "--timeout") {
      options.timeoutSec = parsePositiveInt(readValue(args, ++index, arg), arg, 600);
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (!options.provider && positional[0]) {
    options.provider = positional[0];
  }
  if (!options.productId && positional[1]) {
    options.productId = positional[1];
  }

  return options;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`vaybel-optimize-product failed: ${message}`);
  process.exitCode = 1;
});
