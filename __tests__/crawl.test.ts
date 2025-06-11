import { FirecrawlService } from "../src/crawl";
import Firecrawl from "@mendable/firecrawl-js";

jest.mock("@mendable/firecrawl-js");

const mockCrawlId = "fake-job-id";
const mockCrawlResponse = {
    success: true,
    id: mockCrawlId,
};
const mockCompletedStatus = {
    status: "completed",
    data: [
        {
            metadata: {
                title: "Test Article",
                author: "Test Author",
                sourceURL: "https://example.com/blog/test-article",
                description: "This is a test article.",
            },
            markdown: "# Heading\n\nThis is some article content.",
        },
    ],
};

describe("FirecrawlService", () => {
    let mockInstance: any;

    beforeEach(() => {
        jest.useFakeTimers();
        // Clear any prior instances
        (Firecrawl as jest.Mock).mockClear();

        mockInstance = {
            asyncCrawlUrl: jest.fn().mockResolvedValue(mockCrawlResponse),
            checkCrawlStatus: jest.fn()
                .mockResolvedValueOnce({ status: "processing" }) // simulate delay
                .mockResolvedValueOnce(mockCompletedStatus),
        };

        (Firecrawl as jest.Mock).mockImplementation(() => mockInstance);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("should crawl URLs and return structured page data", async () => {
        const pages = await FirecrawlService.getCrawlResults("https://example.com", 5, 2, 0);

        expect(mockInstance.asyncCrawlUrl).toHaveBeenCalled();
        expect(mockInstance.checkCrawlStatus).toHaveBeenCalledTimes(2);
        expect(pages).toHaveLength(1);
        expect(pages[0].title).toBe("Test Article");
        expect(pages[0].url).toBe("https://example.com/blog/test-article");
        expect(pages[0].content).toContain("Heading");
    });

    it("should throw an error if crawl fails", async () => {
        mockInstance.asyncCrawlUrl.mockResolvedValueOnce({ success: false, error: "Boom" });

        await expect(FirecrawlService.getCrawlResults("https://example.com", 5, 2, 0))
            .rejects
            .toThrow("Failed to crawl: Boom");
    });

    it("should throw if crawl status becomes failed", async () => {
        // wipe any previous .mockResolvedValueOnce chain
        mockInstance.checkCrawlStatus.mockReset();

        // now stub the single failure response
        mockInstance.checkCrawlStatus.mockResolvedValue({
            status: "failed",
            error: "Timeout",
        });

        await expect(
            FirecrawlService.getCrawlResults("https://example.com", 5, 2, 0)
        ).rejects.toThrow("Crawl failed: Timeout");
    });

});
