/**
 * The Muse — free public API, no API key required for basic queries.
 * Returns internship listings across engineering, data, and research categories.
 */
import type { ParsedJob, ScraperResult } from "@/types";
import { checkVisaBlacklist } from "./utils";
import { dedupeByCompanyTitleUrl } from "./types";

const BASE = "https://www.themuse.com/api/public/jobs";

interface MuseJob {
  id: number;
  name?: string;
  contents?: string;
  levels?: { name: string; short_name: string }[];
  locations?: { name: string }[];
  company?: { name: string };
  refs?: { landing_page?: string };
  publication_date?: string;
  categories?: { name: string }[];
}

interface MuseResponse {
  results?: MuseJob[];
  page_count?: number;
}

const QUERIES = [
  { category: "Engineering", level: "Internship" },
  { category: "Data Science", level: "Internship" },
  { category: "Science and Research", level: "Internship" },
];

async function fetchPage(category: string, level: string, page: number): Promise<MuseResponse> {
  const params = new URLSearchParams({
    category,
    level,
    page: String(page),
    descending: "true",
  });
  const res = await fetch(`${BASE}?${params}`, {
    headers: { "User-Agent": "internship-tracker/1.0" },
  });
  if (!res.ok) throw new Error(`Muse ${res.status}: ${category}`);
  return res.json() as Promise<MuseResponse>;
}

export async function scrapeTheMuse(): Promise<ScraperResult> {
  const allJobs: ParsedJob[] = [];
  const errors: string[] = [];

  for (const { category, level } of QUERIES) {
    try {
      // Fetch page 1 per category (≈20 jobs) — keep total time low
      for (let page = 1; page <= 1; page++) {
        const data = await fetchPage(category, level, page);
        const results = data.results ?? [];
        if (results.length === 0) break;

        for (const j of results) {
          const title = j.name?.trim() ?? "Intern";
          const company = j.company?.name?.trim() ?? "Unknown";
          const location = j.locations?.[0]?.name ?? undefined;
          const url = j.refs?.landing_page ?? "https://www.themuse.com/jobs";
          const desc = j.contents ? j.contents.replace(/<[^>]+>/g, " ").trim() : "";
          const visaFlag = checkVisaBlacklist(`${title} ${company} ${desc}`);
          const postedAt = j.publication_date ? new Date(j.publication_date) : undefined;

          allJobs.push({
            title,
            company,
            location,
            url,
            description: desc.slice(0, 5000) || undefined,
            postedAt,
            skills: [],
            visaFlag,
          });
        }

        if (page >= (data.page_count ?? 1)) break;
      }
    } catch (e) {
      errors.push(`Muse ${category}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { jobs: dedupeByCompanyTitleUrl(allJobs), errors };
}
