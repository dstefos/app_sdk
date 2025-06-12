// src/prismic.ts
import * as prismic from "@prismicio/client";
import { htmlAsRichText } from "@prismicio/migrate";
import { config } from "./config.js";
import { EnrichedPage } from "./openai.js";
import { marked } from "marked";

/* ------------------------------------------------------------------ */
/*  ENV EXPECTED                                                      */
/* ------------------------------------------------------------------ */
// PRISMIC_REPO_NAME=my-repo-name
// PRISMIC_WRITE_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
/* ------------------------------------------------------------------ */

export class PrismicService {
  /** Lazily create a write-enabled client */
  private static get writeClient() {
    return prismic.createWriteClient(config.PRISMIC_REPO, {
      writeToken: config.PRISMIC_ACCESS_TOKEN,
    });
  }

  /** Generate a slug from the article title or fallback to UID in the URL */
  private static slugify(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
  }

  /**
   * Push a single EnrichedPage into Prismic under the
   * custom type `enriched_article`.
   */
  public static async createArticle(page: EnrichedPage): Promise<void> {
    console.log(`📝  Pushing "${page.title}" to Prismic…`);

    const migration = prismic.createMigration();

    const fullContent = htmlAsRichText(marked.parse(page.fullcontent),{
    serializer: {
      img: () => null,              // skip all images
    }}).result;
    console.log("Full content converted to Prismic rich text format.");
    console.log(fullContent)
    migration.createDocument(
      {
        type: "enriched_article",
        uid: this.slugify(page.title),
        lang: "en-us",
        tags: page.tags_category,
        data: {
          title: [
            {
              type: "heading1",
              text: page.title,
              spans: [],
            },
          ],
          fullcontent: fullContent,
          summary: [
            {
              type: "paragraph",
              text: page.summary,
              spans: [],
            },
          ],
          key_takeaways: page.key_takeaways.map((t) => ({
            type: "list-item",
            text: t,
            spans: [],
          })),
          source_url: {
            link_type: "Web",
            url: page.url,
          },
        },
      },
      page.title, // title shown in Prismic UI
    );

    // Execute the migration
    console.log(`🚀  Executing migration for "${page.title}"…`)
    console.log("Migration details:", migration);
    console.log("Migration JSON:", JSON.stringify(migration, null, 2));
    return await this.writeClient.migrate(migration, {
      reporter: (event) => console.log("[Prismic]", event.type),
    });

    console.log(`✅  "${page.title}" published to Prismic.`);
  }
}
