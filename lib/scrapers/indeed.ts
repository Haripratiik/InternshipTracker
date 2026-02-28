/**
 * Indeed — search queries combining role titles + "intern".
 * Rate limiting: 2-8s delay, exponential backoff.
 */
import * as cheerio from "cheerio";
import type { ParsedJob, ScraperResult } from "@/types";
import { USER_PROFILE } from "@/lib/config/profile";
import { checkVisaBlacklist, randomDelay, withRetry } from "./utils";
import { dedupeByCompanyTitleUrl } from "./types";

const BASE = "https://www.indeed.com";
const SOURCE = "indeed";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`Indeed ${res.status}`);
  return res.text();
}

function buildQueries(): string[] {
  const roles = USER_PROFILE.targetRoles.slice(0, 5);
  return roles.map((r) => `${encodeURIComponent(r)} intern`);
}

export async function scrapeIndeed(): Promise<ScraperResult> {
  const allJobs: ParsedJob[] = [];
  const errors: string[] = [];
  const queries = buildQueries();

  for (const q of queries) {
    await randomDelay(2000, 8000);
    try {
      const url = `${BASE}/jobs?q=${q}`;
      const html = await withRetry(() => fetchHtml(url));
      const $ = cheerio.load(html);
      $('.job_seen_beacon, [data-jk], [class*="jobcard"]').each((_, el) => {
        const $el = $(el);
        const title = $el.find("h2 a, [class*='jobTitle']").first().text().trim() || "Intern";
        const company = $el.find("[class*='companyName']").first().text().trim() || "";
        const link = $el.find("h2 a").attr("href");
        const urlJob = link ? (link.startsWith("http") ? link : `${BASE}${link}`) : "";
        const location = $el.find("[class*='companyLocation']").first().text().trim();
        const desc = $el.text();
        if (company || title) {
          allJobs.push({
            title: title || "Intern",
            company: company || "Unknown",
            location: location || undefined,
            url: urlJob || BASE,
            description: desc.slice(0, 5000),
            skills: [],
            visaFlag: checkVisaBlacklist(desc),
            rawHtml: $el.html()?.slice(0, 15000),
          });
        }
      });
    } catch (e) {
      errors.push(`Indeed ${q}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { jobs: dedupeByCompanyTitleUrl(allJobs), errors };
}

export async function testScraper(): Promise<ScraperResult> {
  await randomDelay(1000, 2000);
  const errors: string[] = [];
  try {
    const url = `${BASE}/jobs?q=software+intern`;
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const jobs: ParsedJob[] = [];
    $('.job_seen_beacon, [data-jk]').slice(0, 3).each((_, el) => {
      const $el = $(el);
      jobs.push({
        title: $el.find("h2 a").first().text().trim() || "Intern",
        company: $el.find("[class*='companyName']").first().text().trim() || "Unknown",
        url: BASE,
        skills: [],
        visaFlag: false,
      });
    });
    return { jobs, errors };
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
    return { jobs: [], errors };
  }
}
