import type { ParsedJob, ScraperResult } from "@/types";

export interface Scraper {
  source: string;
  scrape(): Promise<ScraperResult>;
  testScraper(): Promise<ScraperResult>;
}

export function dedupeByCompanyTitleUrl(jobs: ParsedJob[]): ParsedJob[] {
  const seen = new Set<string>();
  return jobs.filter((j) => {
    const key = `${j.company.toLowerCase().trim()}|${j.title.toLowerCase().trim()}|${j.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
