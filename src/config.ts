import dotenv from "dotenv";
dotenv.config();

export const config = {
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY!,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
};
