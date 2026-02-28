/**
 * LinkedIn Jobs — search results for each role keyword with pagination.
 * Requires careful rate limiting (2-8s + backoff). LinkedIn may block; use sparingly.
 * Stub: full implementation would use Puppeteer/Playwright with session.
 */
import type { ParsedJob, ScraperResult } from "@/types";
import { randomDelay } from "./utils";
import { dedupeByCompanyTitleUrl } from "./types";

const SOURCE = "linkedin";

export async function scrapeLinkedIn(): Promise<ScraperResult> {
  const jobs: ParsedJob[] = [];
  const errors: string[] = [];
  // LinkedIn requires authenticated session or official API for job search.
  // Placeholder: in production, use Playwright with user cookie or LinkedIn API.
  errors.push("LinkedIn scraper: provide session cookie in Settings for full scrape");
  await randomDelay(2000, 8000);
  return { jobs: dedupeByCompanyTitleUrl(jobs), errors };
}

export async function testScraper(): Promise<ScraperResult> {
  await randomDelay(1000, 2000);
  return { jobs: [], errors: ["LinkedIn test: requires browser session"] };
}
