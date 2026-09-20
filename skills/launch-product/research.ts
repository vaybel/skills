import { closeMCPClient } from "../../client.js";
import { compareBlanks, getBlank, listBlanks, type BlankSection } from "../../servers/vaybel/index.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (!key || !["--products", "--section", "--offset", "--search", "--category", "--technique"].includes(key) || !value || value.startsWith("--")) {
      throw new Error("Use --search/--category/--technique to discover blanks, or --products UUID[,UUID] --section overview|materials|sizing|construction.");
    }
    options[key] = value;
  }
  const section = options["--section"] || "overview";
  if (!["overview", "materials", "sizing", "construction"].includes(section)) throw new Error("Unknown research section.");
  const offset = Number(options["--offset"] || 0);
  if (!Number.isInteger(offset) || offset < 0 || offset > 10000) throw new Error("Offset must be an integer from 0 to 10000.");
  const ids = options["--products"]?.split(",").map(id => id.trim());
  if (ids && (ids.some(id => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) || ids.length > 4 || new Set(ids).size !== ids.length)) {
    throw new Error("Provide one to four distinct full product UUIDs from discovery.");
  }
  try {
    const result = ids
      ? ids.length === 1
        ? await getBlank({ product_id: ids[0]!, section: section as BlankSection, offset })
        : await compareBlanks({ product_ids: ids, section: section as BlankSection, offset })
      : await listBlanks({ ...Object.fromEntries(["search", "category", "technique"].flatMap(key => options[`--${key}`] ? [[key, options[`--${key}`]]] : [])), limit: 20 });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await closeMCPClient();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
