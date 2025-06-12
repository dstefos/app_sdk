import { promises as fs } from "fs";
import path from "path";
import type { EnrichedPage } from "./openai.js";

const ensureDir = async (filePath: string) => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
};

/**
 * Persist an EnrichedPage to `filename` (JSON UTF-8).
 */
export async function saveEnrichedPage(
  page: EnrichedPage,
  filename: string,
): Promise<void> {
  const filePath = path.resolve(filename);
  await ensureDir(filePath);
  await fs.writeFile(filePath, JSON.stringify(page, null, 2), "utf8");
}

/**
 * Load an EnrichedPage from `filename`.
 * Throws if file does not exist or JSON is invalid.
 */
export async function loadEnrichedPage(
  filename: string,
): Promise<EnrichedPage> {
  const filePath = path.resolve(filename);
  const data = await fs.readFile(filePath, "utf8");
  return JSON.parse(data) as EnrichedPage;
}
