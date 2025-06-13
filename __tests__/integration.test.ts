/**
 * End-to-end pipeline test (crawl ➜ OpenAI ➜ Prismic)
 * @jest-environment node
*/

const mocks: {
  getPages?:      jest.Mock;
  enrichPage?:    jest.Mock;
  createArticles?:jest.Mock;
} = {};

import { runPipeline } from "../src/pipeline.js";
import type { PageData }     from "../src/crawl.js";
import type { EnrichedPage } from "../src/openai.js";

/* ------------------------------------------------------------------ */
/* Shared handles to the mocks, populated by the factories            */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Module mocks – create fns **inside** each factory                   */
/* ------------------------------------------------------------------ */
jest.mock("../src/crawl.js", () => {
  mocks.getPages = jest.fn();
  return { FirecrawlService: { getCrawlResults: mocks.getPages } };
});

jest.mock("../src/openai.js", () => {
  mocks.enrichPage = jest.fn();
  return { OpenAIService: { enrichPage: mocks.enrichPage } };
});

jest.mock("../src/prismic.js", () => {
  mocks.createArticles = jest.fn();
  return { PrismicService: { createArticles: mocks.createArticles } };
});

/* ------------------------------------------------------------------ */
/* Stub data & behaviour – after mocks are in place                    */
/* ------------------------------------------------------------------ */
const raw: PageData[] = [
  { title: "Post A", author: "Alice", url: "https://a", description: "", content: "aaa" },
  { title: "Post B", author: "Bob",   url: "https://b", description: "", content: "bbb" },
];

const enriched: EnrichedPage[] = raw.map((p, i) => ({
  title: p.title,
  url: p.url,
  fullcontent: p.content,
  summary: `summary ${i}`,
  tags_category: ["tag"],
  key_takeaways: [`take ${i}`],
}));

mocks.getPages!.mockResolvedValue(raw);
mocks.enrichPage!.mockImplementation(async (p: PageData) =>
  enriched.find((e) => e.title === p.title),
);
mocks.createArticles!.mockResolvedValue(undefined);

/* ------------------------------------------------------------------ */
/* Mute console noise                                                  */
/* ------------------------------------------------------------------ */
beforeAll(() => jest.spyOn(console, "log").mockImplementation(() => {}));
afterAll(()  => (console.log as any).mockRestore());

/* ------------------------------------------------------------------ */
/* The test                                                            */
/* ------------------------------------------------------------------ */
describe("pipeline end-to-end", () => {
  beforeEach(() => jest.clearAllMocks());

  it("crawls, enriches, then bulk-publishes every page in one call", async () => {
    await runPipeline("https://example.com");

    expect(mocks.getPages).toHaveBeenCalledWith("https://example.com", 5, 2);
    expect(mocks.enrichPage).toHaveBeenCalledTimes(raw.length);
    expect(mocks.createArticles).toHaveBeenCalledTimes(1);
    expect(mocks.createArticles).toHaveBeenCalledWith(enriched);
  });
});
