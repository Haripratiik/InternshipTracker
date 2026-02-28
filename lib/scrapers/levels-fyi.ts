/**
 * Levels.fyi Internships — scrape internship listings.
 * Rate limiting: 2-8s delay, exponential backoff.
 */
import * as cheerio from "cheerio";
import type { ParsedJob, ScraperResult } from "@/types";
import { checkVisaBlacklist, randomDelay, withRetry } from "./utils";
import { dedupeByCompanyTitleUrl } from "./types";

const BASE = "https://www.levels.fyi";
const SOURCE = "levels_fyi";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`Levels.fyi ${res.status}`);
  return res.text();
}

export async function scrapeLevelsFyi(): Promise<ScraperResult> {
  const jobs: ParsedJob[] = [];
  const errors: string[] = [];
  const url = `${BASE}/internships`;

  await randomDelay(2000, 8000);
  try {
    const html = await withRetry(() => fetchHtml(url));
    const $ = cheerio.load(html);
    $('[class*="job"], [class*="listing"], a[href*="/job"]').each((_, el) => {
      const $el = $(el);
      const title = $el.find("[class*='title'], h3").first().text().trim() || "Intern";
      const company = $el.find("[class*='company'], [class*='Company']").first().text().trim() || "";
      const link = $el.attr("href") ?? $el.find("a").attr("href");
      const urlJob = link ? (link.startsWith("http") ? link : `${BASE}${link}`) : "";
      const desc = $el.text();
      if (company || title) {
        jobs.push({
          title: title || "Intern",
          company: company || "Unknown",
          url: urlJob || BASE,
          description: desc.slice(0, 5000),
          skills: [],
          visaFlag: checkVisaBlacklist(desc),
          rawHtml: $el.html()?.slice(0, 10000),
        });
      }
    });
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  return { jobs: dedupeByCompanyTitleUrl(jobs), errors };
}

export async function testScraper(): Promise<ScraperResult> {
  await randomDelay(1000, 2000);
  return scrapeLevelsFyi();
}
