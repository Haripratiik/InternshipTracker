/**
 * Run a single scraper test (e.g. GitHub or Simplify) for development.
 * Usage: npx tsx lib/scrapers/run-test.ts [github|simplify]
 */
import { testScraper as testScraperGitHub } from "./github-repos";
import { testScraper as testScraperSimplify } from "./simplify";

const which = process.argv[2] ?? "github";

async function main() {
  if (which === "github") {
    const result = await testScraperGitHub();
    console.log("GitHub repo test:", JSON.stringify(result, null, 2));
  } else if (which === "simplify") {
    const result = await testScraperSimplify();
    console.log("Simplify test:", JSON.stringify(result, null, 2));
  } else {
    console.log("Usage: npx tsx lib/scrapers/run-test.ts [github|simplify]");
  }
}

main().catch(console.error);
