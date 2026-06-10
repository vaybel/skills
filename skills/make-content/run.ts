import { closeMCPClient } from "../../client.js";
import {
  generateContent,
  generateSocialPosts,
  publishSocialPosts,
  waitForContent,
  type ContentFormat,
  type ContentStatus,
  type MarketingPost,
  type PublishSocialPostResult,
  type SocialChannel,
} from "../../servers/vaybel/index.js";
import {
  dashboardUrl,
  parseCsv,
  parsePositiveInt,
  preflightEnvironment,
  readValue,
  stringifyValue,
  truncate,
} from "../shared.js";

const DEFAULT_ARCHETYPE = "graphic_led";
const DEFAULT_SCENE_TYPE = "lifestyle";
const DEFAULT_FORMAT: ContentFormat = "video";
const DEFAULT_TIMEOUT_SEC = 900;

interface Options {
  listingId?: string;
  format: ContentFormat;
  archetype: string;
  sceneType: string;
  imageUrls: string[];
  targetSalesChannel?: string;
  channels: string[];
  publish: boolean;
  timeoutSec: number;
  json: boolean;
}

interface ContentSummary {
  generation: {
    content_id: string;
    listing_id: string;
    format: string;
  };
  status: ContentStatus;
  social_posts: MarketingPost[];
  publish_results: PublishSocialPostResult[];
  dashboard_url: string;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  try {
    const summary = await makeContent(options);
    if (options.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(renderMarkdown(summary));
    }
  } finally {
    await closeMCPClient();
  }
}

async function makeContent(options: Options): Promise<ContentSummary> {
  preflightEnvironment();
  if (!options.listingId) {
    throw new Error("Listing id is required.");
  }
  if (
    (options.format === "slideshow" || options.format === "carousel" || options.format === "single") &&
    !options.imageUrls.length
  ) {
    throw new Error(`--format ${options.format} requires at least one --image-url`);
  }
  if (options.format === "single" && options.imageUrls.length > 1) {
    throw new Error("--format single accepts at most one --image-url");
  }
  if (options.publish && !options.channels.length) {
    throw new Error("--publish requires --channels");
  }

  const input: {
    listing_id: string;
    archetype: string;
    scene_type: string;
    format: ContentFormat;
    image_urls?: string[];
    target_sales_channel?: string;
  } = {
    listing_id: options.listingId,
    archetype: options.archetype,
    scene_type: options.sceneType,
    format: options.format,
  };
  if (options.imageUrls.length) {
    input.image_urls = options.imageUrls;
  }
  if (options.targetSalesChannel) {
    input.target_sales_channel = options.targetSalesChannel;
  }

  const generation = await generateContent(input);
  const status = await waitForContent(generation.content_id, options.timeoutSec);
  if (status.status === "failed") {
    throw new Error(`Content generation failed: ${status.error || status.phase || "no error returned"}`);
  }

  let socialPosts: MarketingPost[] = [];
  let publishResults: PublishSocialPostResult[] = [];
  if (options.channels.length && status.status === "complete") {
    const social = await generateSocialPosts(generation.content_id, options.channels);
    socialPosts = social.posts;
    if (options.publish) {
      const published = await publishSocialPosts({
        content_id: generation.content_id,
        channels: options.channels,
      });
      publishResults = published.results;
    }
  }

  return {
    generation: {
      content_id: generation.content_id,
      listing_id: generation.listing_id,
      format: generation.format,
    },
    status,
    social_posts: socialPosts,
    publish_results: publishResults,
    dashboard_url: dashboardUrl(`/dashboard/promote/${options.listingId}`),
  };
}

function renderMarkdown(summary: ContentSummary): string {
  const lines = [
    "# Vaybel Content Summary",
    "",
    `- Listing: ${summary.generation.listing_id}`,
    `- Content: ${summary.generation.content_id}`,
    `- Format: ${summary.generation.format}`,
    `- Status: ${summary.status.status}`,
    `- Phase: ${summary.status.phase}`,
    `- Progress: ${stringifyValue(summary.status.progress)}`,
  ];

  if (summary.status.video_url) {
    lines.push(`- Video: ${summary.status.video_url}`);
  }
  if (summary.status.publishable_image_refs.length) {
    lines.push(`- Images: ${summary.status.publishable_image_refs.join(", ")}`);
  }
  if (summary.status.status !== "complete") {
    lines.push("- Social drafts were not generated because content is not complete yet.");
  }

  if (summary.social_posts.length) {
    lines.push("", "## Social Drafts");
    for (const post of summary.social_posts) {
      const hashtags = post.hashtags.length ? ` #${post.hashtags.join(" #")}` : "";
      lines.push(`- ${post.channel}: ${truncate(post.text, 220)}${hashtags}`);
    }
  }

  if (summary.publish_results.length) {
    lines.push("", "## Publish Results");
    for (const result of summary.publish_results) {
      lines.push(
        `- ${result.channel}: ${result.status}${result.publish_url ? ` (${result.publish_url})` : ""}${result.error ? ` - ${result.error}` : ""}`,
      );
    }
  }

  lines.push("", `Continue in dashboard: ${summary.dashboard_url}`);
  return lines.join("\n");
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    format: DEFAULT_FORMAT,
    archetype: DEFAULT_ARCHETYPE,
    sceneType: DEFAULT_SCENE_TYPE,
    imageUrls: [],
    channels: [],
    publish: false,
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
    } else if (arg === "--listing" || arg === "--listing-id") {
      options.listingId = readValue(args, ++index, arg);
    } else if (arg === "--format") {
      const format = readValue(args, ++index, arg);
      if (format !== "video" && format !== "slideshow" && format !== "carousel" && format !== "single") {
        throw new Error("--format must be one of video, slideshow, carousel, single");
      }
      options.format = format;
    } else if (arg === "--archetype") {
      options.archetype = readValue(args, ++index, arg);
    } else if (arg === "--scene-type" || arg === "--short-type") {
      // --short-type kept as a deprecated alias for the old flag name.
      options.sceneType = readValue(args, ++index, arg);
    } else if (arg === "--image-url") {
      options.imageUrls.push(readValue(args, ++index, arg));
    } else if (arg === "--images") {
      options.imageUrls.push(...parseCsv(readValue(args, ++index, arg)));
    } else if (arg === "--target-sales-channel") {
      options.targetSalesChannel = readValue(args, ++index, arg);
    } else if (arg === "--channel") {
      options.channels.push(readValue(args, ++index, arg));
    } else if (arg === "--channels") {
      options.channels.push(...parseCsv(readValue(args, ++index, arg)));
    } else if (arg === "--publish") {
      options.publish = true;
    } else if (arg === "--timeout") {
      options.timeoutSec = parsePositiveInt(readValue(args, ++index, arg), arg, 1800);
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (!options.listingId && positional[0]) {
    options.listingId = positional[0];
  }
  options.channels = normalizeChannels(options.channels);
  return options;
}

function normalizeChannels(channels: string[]): SocialChannel[] {
  const allowed = new Set(["tiktok", "instagram", "youtube", "x"]);
  const normalized = [...new Set(channels.map((channel) => channel.trim().toLowerCase()).filter(Boolean))];
  for (const channel of normalized) {
    if (!allowed.has(channel)) {
      throw new Error("--channels may include only tiktok, instagram, youtube, x");
    }
  }
  return normalized as SocialChannel[];
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`vaybel-make-content failed: ${message}`);
  process.exitCode = 1;
});
