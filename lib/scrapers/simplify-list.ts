/**
 * SimplifyJobs community GitHub lists — reads the maintained JSON
 * from SimplifyJobs/Summer202X-Internships repos (raw GitHub, no auth needed).
 * Much more reliable than scraping the Simplify website.
 */
import type { ParsedJob, ScraperResult } from "@/types";
import { checkVisaBlacklist } from "./utils";
import { dedupeByCompanyTitleUrl } from "./types";

const LISTING_URLS = [
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json",
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/.github/scripts/listings.json",
];

interface SimplifyEntry {
  id?: string;
  company_name?: string;
  title?: string;
  url?: string | { href?: string; text?: string }[];
  locations?: string[] | null;
  sponsorship?: string;
  is_visible?: boolean;
  active?: boolean;
  date_posted?: number;
  season?: string;
  year?: number;
}

function resolveUrl(raw: SimplifyEntry["url"]): string {
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && raw.length > 0) return raw[0].href ?? "";
  return "";
}

function flagSponsor(sponsorship?: string): boolean {
  if (!sponsorship) return false;
  const s = sponsorship.toLowerCase();
  return (
    s.includes("does not offer") ||
    s.includes("no sponsorship") ||
    s.includes("authorization") ||
    s.includes("us citizen")
  );
}

async function fetchListings(url: string): Promise<SimplifyEntry[]> {
  const res = await fetch(url, { headers: { "User-Agent": "internship-tracker/1.0" } });
  if (!res.ok) throw new Error(`SimplifyList ${res.status}: ${url}`);
  return res.json() as Promise<SimplifyEntry[]>;
}

export async function scrapeSimplifyList(): Promise<ScraperResult> {
  const allJobs: ParsedJob[] = [];
  const errors: string[] = [];

  for (const url of LISTING_URLS) {
    try {
      const entries = await fetchListings(url);
      for (const e of entries) {
        if (e.is_visible === false || e.active === false) continue;
        const jobUrl = resolveUrl(e.url);
        const title = e.title?.trim() || "Intern";
        const company = e.company_name?.trim() || "Unknown";
        const location = Array.isArray(e.locations) && e.locations.length > 0
          ? e.locations[0]
          : undefined;
        const visaFlag = flagSponsor(e.sponsorship) || checkVisaBlacklist(`${title} ${company} ${e.sponsorship ?? ""}`);
        const postedAt = e.date_posted ? new Date(e.date_posted * 1000) : undefined;

        allJobs.push({
          title,
          company,
          location,
          url: jobUrl || `https://simplify.jobs/p/${e.id ?? ""}`,
          description: [title, location, e.sponsorship, e.season].filter(Boolean).join(" | "),
          postedAt,
          skills: [],
          visaFlag,
        });
      }
    } catch (e) {
      errors.push(`SimplifyList ${url}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { jobs: dedupeByCompanyTitleUrl(allJobs), errors };
}
