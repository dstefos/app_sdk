import Firecrawl from "@mendable/firecrawl-js";
import { config } from "./config";

export interface PageData {
    title: string;
    author?: string | null;
    url: string;
    description: string;
    content: string;
}

export class FirecrawlService {
    private static getApp(): Firecrawl {
        return new Firecrawl({ apiKey: config.FIRECRAWL_API_KEY });
    }

    public static async crawlURLs(siteUrl: string, maxPages:number = 5, maxDepth:number = 2): Promise<string> {
        const app = this.getApp();
        console.log(`Crawling URL: ${siteUrl} with a limit of ${maxPages} pages`);
        const crawlResponse = await app.asyncCrawlUrl(siteUrl, {
            limit: maxPages,
            maxDepth: maxDepth,
            ignoreSitemap: true,
            scrapeOptions: {
                formats: ['markdown'],
            }
        });

        if (!crawlResponse.success) {
            throw new Error(`Failed to crawl: ${crawlResponse.error}`);
        }

        console.log("Crawl job started successfully. Response:");
        console.log(crawlResponse);
        return crawlResponse.id;
    }

    public static async getCrawlStatus(crawlId: string): Promise<any> {
        const app = this.getApp();
        const statusResponse = await app.checkCrawlStatus(crawlId);
        return statusResponse;
    }

    public static async getCrawlResults(siteUrl: string, maxPages: number, maxDepth: number): Promise<PageData[]> {
        const jobId = await this.crawlURLs(siteUrl, maxPages, maxDepth);
        console.log(`Crawl job started with ID: ${jobId}`);

        while (true) {
            console.log(`Waiting for 5 seconds before checking the status...`);
            await new Promise(resolve => setTimeout(resolve, 5000));

            console.log(`Checking status for job ID: ${jobId}`);
            const status = await this.getCrawlStatus(jobId);
            console.log(`Crawl status: ${status.status}`);

            if (status.status === 'completed') {
                console.log("Crawl completed successfully.");
                console.log("Crawl results:", status);
                return this.parseCrawlData(status.data);
            } else if (status.status === 'failed') {
                throw new Error(`Crawl failed: ${status.error}`);
            }

        }
    }

    private static parseCrawlData(data: any): PageData[] {
        return data.map((item: any) => ({
            title: item?.metadata?.title || "No Title",
            author: item?.metadata?.author || null,
            url: item?.metadata?.sourceURL ||  "",
            description: item?.metadata?.description || "",
            content: item?.markdown || "",
        }))
    }

}