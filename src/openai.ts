import { config } from "./config.js";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export interface PageData {
  title: string;
  url: string;
  description: string;
  content: string;
}

export interface EnrichedPage {
  title: string;
  url: string;
  fullcontent: string;
  summary: string;
  tags_category: string[];
  key_takeaways: string[];
}

export class OpenAIService {
  static async enrichPage(page: PageData): Promise<EnrichedPage> {
    const prompt = `
You are an assistant that analyzes blog content.

Given the following blog post content, return the following:
1. A concise 3-4 sentence summary.
2. A list of 3–5 tags or categories that describe the content.
3. 3 key takeaways (in bullet points).

Respond ONLY in JSON with the following keys:
{
  "summary": "...",
  "tags_category": ["...", "..."],
  "key_takeaways": ["...", "..."]
}

CONTENT:
---
${page.content}
`;

    console.log("Analyzing page:", page.title);
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    
    console.log("OpenAI response received for:", page.title);
    let parsed: any;
    try {
      parsed = JSON.parse(response.choices[0].message.content || "{}");
    } catch (err) {
      console.error("Failed to parse OpenAI response:", err);
      throw err;
    }

    return {
      title: page.title,
      url: page.url,
      fullcontent: page.content,
      summary: parsed.summary || "",
      tags_category: parsed.tags_category || [],
      key_takeaways: parsed.key_takeaways || [],
    };
  }
}
