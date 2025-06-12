import dotenv from "dotenv";
dotenv.config();

export const config = {
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
  PRISMIC_REPO: process.env.PRISMIC_REPO!,
  PRISMIC_ACCESS_TOKEN: process.env.PRISMIC_ACCESS_TOKEN!
};
