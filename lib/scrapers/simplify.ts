/**
 * Simplify Jobs — https://simplify.jobs public job board.
 * Rate limiting: 2-8s delay, exponential backoff. Saves raw HTML for debugging.
 */
import * as cheerio from "cheerio";
import type { ParsedJob, ScraperResult } from "@/types";
import { checkVisaBlacklist, randomDelay, withRetry } from "./utils";
import { dedupeByCompanyTitleUrl } from "./types";

const BASE_URL = "https://www.simplify.jobs";
const SOURCE = "simplify";

async function fetchPage(url: string): Promise<{ html: string; $: cheerio.CheerioAPI }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`Simplify ${res.status}: ${url}`);
  const html = await res.text();
  return { html, $: cheerio.load(html) };
}

function parseJobFromCard(
  $: cheerio.CheerioAPI,
  el: unknown,
  rawHtml: string
): ParsedJob | null {
  const $el = $(el as Parameters<typeof $>[0]);
  const title =
    $el.find('[data-testid="job-title"], .job-title, h3, [class*="title"]').first().text().trim() ||
    "Intern";
  const company =
    $el.find('[data-testid="company-name"], .company-name, [class*="company"]').first().text().trim() || "";
  const location =
    $el.find('[data-testid="job-location"], .location, [class*="location"]').first().text().trim() || "";
  const link = $el.find('a[href*="/p/"], a[href*="/job"]').attr("href");
  const url = link ? (link.startsWith("http") ? link : `${BASE_URL}${link}`) : "";
  const desc = $el.text();
  const visaFlag = checkVisaBlacklist(desc);

  if (!company && !title) return null;

  return {
    title: title || "Intern",
    company: company || "Unknown",
    location: location || undefined,
    url: url || BASE_URL,
    description: desc.slice(0, 5000) || undefined,
    skills: [],
    visaFlag,
    rawHtml: rawHtml.slice(0, 50000),
  };
}

export async function scrapeSimplify(): Promise<ScraperResult> {
  const allJobs: ParsedJob[] = [];
  const errors: string[] = [];
  const searchPaths = [
    "/jobs?q=intern",
    "/jobs?q=software+intern",
    "/jobs?q=quant+intern",
    "/jobs?q=research+intern",
  ];

  for (const path of searchPaths) {
    await randomDelay(2000, 8000);
    try {
      const fullUrl = `${BASE_URL}${path}`;
      const { html, $ } = await withRetry(() => fetchPage(fullUrl));

      const selectors = [
        '[data-testid="job-card"]',
        "article[class*='job']",
        "[class*='JobCard']",
        ".job-card",
        "a[href*='/p/']",
      ];

      let found = false;
      for (const sel of selectors) {
        const cards = $(sel).toArray();
        if (cards.length > 0) {
          for (const card of cards) {
            const raw = $(card).html() ?? "";
            const job = parseJobFromCard($, card, raw);
            if (job && job.url) {
              allJobs.push(job);
              found = true;
            }
          }
          if (found) break;
        }
      }

      if (!found && $("body").length) {
        const links = $('a[href*="/p/"]').toArray();
        for (const a of links.slice(0, 30)) {
          const $a = $(a);
          const href = $a.attr("href");
          const url = href ? (href.startsWith("http") ? href : `${BASE_URL}${href}`) : "";
          const title = $a.text().trim() || "Intern";
          const parent = $a.closest("div, article, li");
          const company = parent.find("[class*='company'], [class*='Company']").first().text().trim() || "Unknown";
          const location = parent.find("[class*='location'], [class*='Location']").first().text().trim();
          allJobs.push({
            title,
            company,
            location: location || undefined,
            url: url || BASE_URL,
            description: undefined,
            skills: [],
            visaFlag: false,
            rawHtml: parent.html()?.slice(0, 10000),
          });
        }
      }
    } catch (e) {
      errors.push(`Simplify ${path}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const deduped = dedupeByCompanyTitleUrl(allJobs);
  return { jobs: deduped, errors };
}

export async function testScraper(): Promise<ScraperResult> {
  await randomDelay(1000, 2000);
  const errors: string[] = [];
  try {
    const { html, $ } = await fetchPage(`${BASE_URL}/jobs?q=intern`);
    const links = $('a[href*="/p/"]').toArray().slice(0, 3);
    const jobs: ParsedJob[] = [];
    for (const a of links) {
      const $a = $(a);
      const href = $a.attr("href");
      const url = href ? (href.startsWith("http") ? href : `${BASE_URL}${href}`) : BASE_URL;
      jobs.push({
        title: $a.text().trim() || "Intern",
        company: "Simplify (test)",
        url,
        skills: [],
        visaFlag: false,
        rawHtml: html.slice(0, 5000),
      });
    }
    return { jobs, errors };
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
    return { jobs: [], errors };
  }
}
