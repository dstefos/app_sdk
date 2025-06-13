import { runPipeline } from "./pipeline.js";

const TARGET_URL = process.argv[2];

if (!TARGET_URL) {
  console.error("Usage: npm start -- <url>");
  process.exit(1);
}

runPipeline(TARGET_URL).catch((e) => {
  console.error("Pipeline failed:", e);
  process.exit(1);
});