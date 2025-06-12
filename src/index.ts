import { FirecrawlService } from "./crawl.js";
import { EnrichedPage, OpenAIService } from "./openai.js";
import { PrismicService } from "./prismic.js";
import { loadEnrichedPage, saveEnrichedPage } from "./storage.js";

const TARGET_URL = process.argv[2];
const dummyEnrichedPage: EnrichedPage = {
  title: "Sample Article",
  fullcontent: "This is the full content of the article.",
  summary: "This is a summary of the article.",
  tags_category: ["tag1", "tag2"],
  key_takeaways: ["Takeaway 1", "Takeaway 2"],
  url: "https://example.com/sample-article",
};

if (!TARGET_URL) {
  console.error("Please provide a target URL: `npm start -- <url>`");
  process.exit(1);
}



(async () => {
  try {
    // const loadedEnrichedPage = await loadEnrichedPage("dummyEnrichedPage.json");
    // const jobId = await PrismicService.createArticle(loadedEnrichedPage);
    // console.log(`Published article to Prismic with job ID: ${jobId}`);

    // console.log("Dummy enriched page loaded successfully:", loadedEnrichedPage);
    // saveEnrichedPage(dummyEnrichedPage, "dummyEnrichedPage.json");

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
    // console.log("Enriched Pages:", enrichedPages.map(p => p.title));
    // Now publish each enriched page to Prismic
    console.log("Publishing articles to Prismic...");
    const prismicJobIds = await Promise.all(
      enrichedPages.map(async (page) => {
        console.log(`Publishing article to Prismic: ${page.title}`);
        const jobId = await PrismicService.createArticle(page);
        console.log(`Published article to Prismic with job ID: ${jobId}`);
        return jobId;
      })
    );
    console.log("All articles published to Prismic. Job IDs:", prismicJobIds);
  } catch (err) {
    console.error("Error during crawl:", err);
  }
})();
