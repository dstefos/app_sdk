import { FirecrawlService } from "./crawl";
import { OpenAIService } from "./openai";

const TARGET_URL = process.argv[2];

if (!TARGET_URL) {
  console.error("Please provide a target URL: `npm start -- <url>`");
  process.exit(1);
}

(async () => {
  try {
    console.log(`Crawling: ${TARGET_URL}`);
    const crawlData = await FirecrawlService.getCrawlResults(TARGET_URL, 5, 2);
    console.log(`Crawl started successfully. Data:`, crawlData);

    const enrichedPages = await Promise.all(
      crawlData.map(async (page) => {
        const enriched = await OpenAIService.enrichPage(page);
        console.log(`Enriched page: ${enriched.title}`);
        console.log(`Summary: ${enriched.summary}`);
        console.log(`Tags: ${enriched.tags_category.join(", ")}`);
        console.log(`Key Takeaways: ${enriched.key_takeaways.join("\n")}`);
        console.log(`URL: ${enriched.url}`);
        return enriched;
      })
    );
    console.log("All pages enriched successfully.");
    console.log("Enriched Pages:", enrichedPages);
} catch (err) {
    console.error("Error during crawl:", err);
  }
})();
