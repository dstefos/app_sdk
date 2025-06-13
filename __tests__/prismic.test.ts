/**
 * @jest-environment node
 */

import { PrismicService } from "../src/prismic.js";
import { EnrichedPage } from "../src/openai.js";

/* ------------------------------------------------------------------ */
/* 1. Mock prismic client + migration objects                          */
/* ------------------------------------------------------------------ */

const mockCreateDocument = jest.fn();
const mockMigrate = jest.fn();

jest.mock("@prismicio/client", () => ({
    createMigration: jest.fn(() => ({
        createDocument: mockCreateDocument,
    })),
    createWriteClient: jest.fn(() => ({
        migrate: mockMigrate,
    })),
}));

/* ------------------------------------------------------------------ */
/* 2. Mock htmlAsRichText                                              */
/* ------------------------------------------------------------------ */

jest.mock("@prismicio/migrate", () => ({
    htmlAsRichText: jest.fn(() => ({
        result: [{ type: "paragraph", text: "Rendered rich text", spans: [] }],
    })),
}));

/* ------------------------------------------------------------------ */
/* 3. Mock config                                                      */
/* ------------------------------------------------------------------ */

jest.mock(
    "../src/config.js",
    () => ({
        config: { PRISMIC_REPO: "dummy-repo", PRISMIC_ACCESS_TOKEN: "dummy-token" },
    }),
    { virtual: true },
);

/* ------------------------------------------------------------------ */
/* 4. Silence console noise                                            */
/* ------------------------------------------------------------------ */

beforeAll(() => jest.spyOn(console, "log").mockImplementation(() => { }));
afterAll(() => (console.log as any).mockRestore());

/* ------------------------------------------------------------------ */
/* 5. The actual test                                                  */
/* ------------------------------------------------------------------ */

describe("PrismicService.createArticles", () => {
    const sample: EnrichedPage = {
        title: "Hello World!",
        url: "https://example.com/hello",
        fullcontent: "This is **Markdown**.",
        summary: "Short summary",
        tags_category: ["tag1", "tag2"],
        key_takeaways: ["Take 1", "Take 2"],
    };

    beforeEach(() => jest.clearAllMocks());

    it("builds a migration and executes it once", async () => {
        await PrismicService.createArticles([sample]); // ← bulk API

        expect(mockCreateDocument).toHaveBeenCalledTimes(1);
        const [payload] = mockCreateDocument.mock.calls[0];

        expect(payload.type).toBe("enriched_article");
        expect(payload.uid).toBe("hello-world");
        expect(payload.tags).toEqual(sample.tags_category);
        expect(payload.data.fullcontent[0].text).toBe("Rendered rich text");
        expect(payload.data.summary[0].text).toBe(sample.summary);
        expect(payload.data.key_takeaways).toHaveLength(2);
        expect(payload.data.source_url.url).toBe(sample.url);

        expect(mockMigrate).toHaveBeenCalledTimes(1); // one batch write
    });

    it("batches multiple pages in one migration call", async () => {
        const pages: EnrichedPage[] = [
            sample,
            {
                ...sample,
                title: "Another Post",
                url: "https://example.com/another",
            },
        ];

        await PrismicService.createArticles(pages);

        // one createDocument per page
        expect(mockCreateDocument).toHaveBeenCalledTimes(pages.length);

        // slugs were generated for each
        const slugs = mockCreateDocument.mock.calls.map(([p]) => p.uid);
        expect(slugs).toEqual(["hello-world", "another-post"]);

        // but migrate executed only once
        expect(mockMigrate).toHaveBeenCalledTimes(1);
    });

});
