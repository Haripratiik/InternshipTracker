/**
 * Google search fallback for firms without a detected scraper.
 * Query: "<firm name> internship 2025 2026 site:careers.<firm>.com OR site:jobs.<firm>.com"
 */
import type { ParsedJob, ScraperResult } from "@/types";
import { USER_PROFILE } from "@/lib/config/profile";
import { randomDelay } from "./utils";
import { dedupeByCompanyTitleUrl } from "./types";

const SOURCE = "google_fallback";

function slug(firm: string): string {
  return firm.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
}

export async function scrapeGoogleFallback(): Promise<ScraperResult> {
  const jobs: ParsedJob[] = [];
  const errors: string[] = [];
  const firms = USER_PROFILE.targetFirms.slice(0, 5);

  for (const firm of firms) {
    await randomDelay(2000, 8000);
    const s = slug(firm);
    const query = encodeURIComponent(
      `"${firm}" internship 2025 2026 site:careers.${s}.com OR site:jobs.${s}.com`
    );
    const url = `https://www.google.com/search?q=${query}`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      const html = await res.text();
      const linkMatches = html.matchAll(/href="(\/url\?q=)?(https?:\/\/[^"]+)"/g);
      const links = new Set<string>();
      for (const m of Array.from(linkMatches)) {
        const raw = m[2];
        if (raw && !raw.includes("google.com")) links.add(raw);
      }
      for (const link of Array.from(links).slice(0, 3)) {
        jobs.push({
          title: "Intern",
          company: firm,
          url: link,
          description: undefined,
          skills: [],
          visaFlag: false,
        });
      }
    } catch (e) {
      errors.push(`${firm}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { jobs: dedupeByCompanyTitleUrl(jobs), errors };
}

export async function testScraper(): Promise<ScraperResult> {
  await randomDelay(1000, 2000);
  return { jobs: [], errors: ["Google fallback: rate limit; run full scrape sparingly"] };
}
