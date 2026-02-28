/**
 * Company career pages — detect ATS (Greenhouse, Lever, Workday) from URL and scrape.
 * Playwright-based for JS-heavy pages. One run per target firm.
 */
import type { ParsedJob, ScraperResult } from "@/types";
import { USER_PROFILE } from "@/lib/config/profile";
import { checkVisaBlacklist, randomDelay, withRetry } from "./utils";
import { dedupeByCompanyTitleUrl } from "./types";

const SOURCE = "career_page";

function detectAts(url: string): "greenhouse" | "lever" | "workday" | "unknown" {
  if (/greenhouse\.io|boards\.greenhouse/i.test(url)) return "greenhouse";
  if (/lever\.co|jobs\.lever/i.test(url)) return "lever";
  if (/workday\.com|myworkdayjobs\.com/i.test(url)) return "workday";
  return "unknown";
}

async function scrapeGreenhouse(boardUrl: string): Promise<ParsedJob[]> {
  const res = await fetch(boardUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const jobs: ParsedJob[] = [];
  const jsonMatch = html.match(/window\.initialState\s*=\s*(\{[\s\S]*?\});/);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      const depart = data.departments ?? data.jobs ?? [];
      const list = Array.isArray(depart) ? depart.flatMap((d: { jobs?: unknown[] }) => d.jobs ?? []) : depart;
      for (const j of list.slice(0, 100)) {
        const title = j.title ?? j.name ?? "Intern";
        const loc = j.location?.name ?? j.location;
        const url = j.absolute_url ?? j.url ?? boardUrl;
        const desc = [j.content ?? "", j.description ?? ""].join(" ");
        jobs.push({
          title,
          company: data.company?.name ?? "Unknown",
          location: loc,
          url,
          postedAt: j.updated_at ? new Date(j.updated_at) : undefined,
          description: desc.slice(0, 5000),
          skills: [],
          visaFlag: checkVisaBlacklist(desc),
          rawHtml: undefined,
          rawJson: JSON.stringify(j).slice(0, 5000),
        });
      }
    } catch {
      // fallback: parse HTML with regex or cheerio
    }
  }
  return jobs;
}

async function scrapeLever(listUrl: string, companyName: string): Promise<ParsedJob[]> {
  const res = await fetch(listUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36" },
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data || !Array.isArray(data)) return [];
  const jobs: ParsedJob[] = [];
  for (const j of data.slice(0, 100)) {
    const desc = [j.description ?? "", j.text ?? ""].join(" ");
    jobs.push({
      title: j.text ?? j.title ?? "Intern",
      company: companyName,
      location: j.categories?.location ?? undefined,
      url: j.hostedUrl ?? j.applyUrl ?? listUrl,
      postedAt: j.createdAt ? new Date(j.createdAt) : undefined,
      description: desc.slice(0, 5000),
      skills: [],
      visaFlag: checkVisaBlacklist(desc),
      rawJson: JSON.stringify(j).slice(0, 5000),
    });
  }
  return jobs;
}

export async function scrapeCareerPages(
  firmUrls?: Record<string, string>
): Promise<ScraperResult> {
  const allJobs: ParsedJob[] = [];
  const errors: string[] = [];
  const firms = firmUrls ?? {};
  const defaultUrls = USER_PROFILE.targetFirms.slice(0, 10).map((f) => ({
    name: f,
    url: firms[f] ?? `https://jobs.lever.co/${f.toLowerCase().replace(/\s/g, "-")}`,
  }));

  for (const { name, url } of defaultUrls) {
    await randomDelay(2000, 8000);
    try {
      const ats = detectAts(url);
      let jobs: ParsedJob[] = [];
      if (ats === "greenhouse") jobs = await withRetry(() => scrapeGreenhouse(url));
      else if (ats === "lever") jobs = await withRetry(() => scrapeLever(url, name));
      else errors.push(`Career page ${name}: unsupported ATS or URL`);
      allJobs.push(...jobs);
    } catch (e) {
      errors.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { jobs: dedupeByCompanyTitleUrl(allJobs), errors };
}

export async function testScraper(): Promise<ScraperResult> {
  await randomDelay(1000, 2000);
  return scrapeCareerPages({
    "Jane Street": "https://www.greenhouse.io/boards/janestreet",
  });
}
