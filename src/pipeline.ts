import { FirecrawlService } from "./crawl.js";
import { OpenAIService } from "./openai.js";
import { PrismicService } from "./prismic.js";

/** Crawl → enrich → bulk-publish */
export async function runPipeline(
    url: string,
    maxPages = 5,
    maxDepth = 2,
): Promise<void> {
    console.log(`Starting pipeline for URL: ${url}`);
    const raw = await FirecrawlService.getCrawlResults(url, maxPages, maxDepth);

    console.log(`Enriching ${raw.length} pages with OpenAI...`);
    const enriched = await Promise.all(
        raw.map((p) => OpenAIService.enrichPage(p)),
    );

    console.log(`All pages enriched successfully. Publishing to Prismic...`);
    await PrismicService.createArticles(enriched);
}
