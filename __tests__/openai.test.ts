import { OpenAIService } from "../src/openai";
import { OpenAI } from "openai";

// Mock OpenAI's chat API
jest.mock("openai", () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  summary: "This is a mock summary.",
                  tags_category: ["DevOps", "API", "Content"],
                  key_takeaways: ["Point 1", "Point 2", "Point 3"]
                })
              }
            }]
          })
        }
      }
    }))
  };
});

describe("OpenAIService", () => {
  it("should enrich a page with AI-generated metadata", async () => {
    const enriched = await OpenAIService.enrichPage({
      title: "Mock Page",
      url: "https://example.com/blog/post",
      description: "desc",
      content: "Some blog content about dev stuff"
    });

    expect(enriched.title).toBe("Mock Page");
    expect(enriched.summary).toContain("mock summary");
    expect(enriched.tags_category).toContain("DevOps");
    expect(enriched.key_takeaways.length).toBeGreaterThan(0);
  });
});
