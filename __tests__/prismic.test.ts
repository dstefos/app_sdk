/**
 * @jest-environment node
 */

import { PrismicService } from "../src/prismic.js";
import { EnrichedPage } from "../src/openai.js";
import { marked } from "marked";

/* ------------------------------------------------------------------ */
/* 1. Mock prismic client + migration objects                          */
/* ------------------------------------------------------------------ */

const mockCreateDocument = jest.fn();
const mockMigrate      = jest.fn();

jest.mock("@prismicio/client", () => ({
  /* createMigration returns an object with createDocument() */
  createMigration: jest.fn(() => ({
    createDocument: mockCreateDocument,
  })),

  /* createWriteClient returns an object with migrate() */
  createWriteClient: jest.fn(() => ({
    migrate: mockMigrate,
  })),
}));

/* ------------------------------------------------------------------ */
/* 2. Mock htmlAsRichText to return deterministic JSON                 */
/* ------------------------------------------------------------------ */

jest.mock("@prismicio/migrate", () => ({
  htmlAsRichText: jest.fn(() => ({
    result: [
      { type: "paragraph", text: "Rendered rich text", spans: [] },
    ],
  })),
}));

/* ------------------------------------------------------------------ */
/* 3. Provide dummy ENV in place of config values                      */
/* ------------------------------------------------------------------ */

/* 3. Provide dummy ENV via factory mock */
jest.mock("../src/config.js", () => ({
  config: {
    PRISMIC_REPO: "dummy-repo",
    PRISMIC_ACCESS_TOKEN: "dummy-token",
  },
}), { virtual: true });


/* ------------------------------------------------------------------ */
/* 4. Silence console noise during test runs                           */
/* ------------------------------------------------------------------ */

beforeAll(() => jest.spyOn(console, "log").mockImplementation(() => {}));
afterAll(() => (console.log as any).mockRestore());

/* ------------------------------------------------------------------ */
/* 5. The actual tests                                                 */
/* ------------------------------------------------------------------ */

describe("PrismicService.createArticle", () => {
  const sample: EnrichedPage = {
    title: "Hello World!",
    url: "https://example.com/hello",
    fullcontent: "This is **Markdown**.",
    summary: "Short summary",
    tags_category: ["tag1", "tag2"],
    key_takeaways: ["Take 1", "Take 2"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a Prismic migration document with expected fields", async () => {
    await PrismicService.createArticle(sample);

    /* slug should be 'hello-world' (max-50 chars, kebab-case) */
    expect(mockCreateDocument).toHaveBeenCalledTimes(1);
    const [payload] = mockCreateDocument.mock.calls[0];

    expect(payload.type).toBe("enriched_article");
    expect(payload.uid).toBe("hello-world");
    expect(payload.tags).toEqual(sample.tags_category);
    expect(payload.data.fullcontent[0].text).toBe("Rendered rich text");
    expect(payload.data.summary[0].text).toBe(sample.summary);
    expect(payload.data.key_takeaways).toHaveLength(2);
    expect(payload.data.source_url.url).toBe(sample.url);

    /* migration executed exactly once */
    expect(mockMigrate).toHaveBeenCalledTimes(1);
  });
});
