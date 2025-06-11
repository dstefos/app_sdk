import { FirecrawlService } from "./crawl";

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
} catch (err) {
    console.error("Error during crawl:", err);
  }
})();
