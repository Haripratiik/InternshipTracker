/**
 * Handshake — Georgia Tech Handshake portal.
 * Requires session cookie injection (user provides cookie in Settings).
 */
import type { ParsedJob, ScraperResult } from "@/types";
import { randomDelay } from "./utils";
import { dedupeByCompanyTitleUrl } from "./types";

const SOURCE = "handshake";

export async function scrapeHandshake(_cookie?: string): Promise<ScraperResult> {
  const jobs: ParsedJob[] = [];
  const errors: string[] = [];
  if (!_cookie) {
    errors.push("Handshake: set session cookie in Settings to enable scraping");
  } else {
    // TODO: use cookie with fetch/Playwright to hit Handshake job search
    errors.push("Handshake: direct API not public; use browser automation with cookie");
  }
  await randomDelay(2000, 8000);
  return { jobs: dedupeByCompanyTitleUrl(jobs), errors };
}

export async function testScraper(cookie?: string): Promise<ScraperResult> {
  await randomDelay(1000, 2000);
  return scrapeHandshake(cookie);
}
