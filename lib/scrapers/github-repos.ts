/**
 * Scrapes internship tables from GitHub repo READMEs (e.g. pittcsc/Summer2025-Internships).
 * Uses GitHub API to fetch file content. Rate limiting: 2-8s delay between requests, exponential backoff.
 */
import type { ParsedJob, ScraperResult } from "@/types";
import { checkVisaBlacklist, randomDelay, withRetry } from "./utils";
import { dedupeByCompanyTitleUrl } from "./types";

const REPOS = [
  { owner: "pittcsc", repo: "Summer2025-Internships", path: "README.md" },
  { owner: "SimplifyJobs", repo: "New-Grad-Positions", path: "README.md" },
  { owner: "pittcsc", repo: "Summer2024-Internships", path: "README.md" },
];

const SOURCE = "github_repo";

function parseMarkdownTable(text: string): ParsedJob[] {
  const jobs: ParsedJob[] = [];
  const lines = text.split("\n");
  let inTable = false;
  let headers: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim().replace(/\s+/g, " "));

      if (cells.some((c) => c.toLowerCase().includes("company") || c.toLowerCase().includes("name"))) {
        headers = cells.map((h) => h.toLowerCase());
        inTable = true;
        continue;
      }

      if (inTable && headers.length > 0 && !cells.every((c) => /^[-:]+$/.test(c))) {
        const company = cells[0] ?? "";
        const title = cells[1] ?? cells[headers.findIndex((h) => h.includes("role") || h.includes("title"))] ?? "Intern";
        const location = cells[2] ?? cells[headers.findIndex((h) => h.includes("location"))] ?? "";
        const url = cells.find((c) => c.startsWith("http")) ?? "";
        const date = cells.find((_, idx) => headers[idx]?.includes("date") || headers[idx]?.includes("posted"));
        const notes = cells.find((_, idx) => headers[idx]?.includes("notes"));

        if (!company || company === "Company" || company === "Name") continue;

        const description = [title, location, notes].filter(Boolean).join(" | ");
        const visaFlag = checkVisaBlacklist(description);

        jobs.push({
          title: title || "Intern",
          company: company.replace(/\[.*?\]\(.*?\)/g, "").trim(),
          location: location || undefined,
          url: url || `https://github.com/${REPOS[0].owner}/${REPOS[0].repo}#${encodeURIComponent(company)}`,
          postedAt: date ? parseDate(date) : undefined,
          description: description || undefined,
          skills: [],
          visaFlag,
        });
      }
    } else {
      if (inTable && !trimmed.startsWith("|")) inTable = false;
    }
  }

  return jobs;
}

function parseDate(s: string): Date | undefined {
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

async function fetchReadme(owner: string, repo: string, path: string): Promise<string> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github.raw" },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${owner}/${repo}`);
  return res.text();
}

export async function scrapeGitHubRepos(): Promise<ScraperResult> {
  const allJobs: ParsedJob[] = [];
  const errors: string[] = [];

  for (const { owner, repo, path } of REPOS) {
    await randomDelay(2000, 8000);
    try {
      const text = await withRetry(() => fetchReadme(owner, repo, path));
      const jobs = parseMarkdownTable(text);
      allJobs.push(...jobs);
    } catch (e) {
      errors.push(`${owner}/${repo}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const deduped = dedupeByCompanyTitleUrl(allJobs);
  return { jobs: deduped, errors };
}

export async function testScraper(): Promise<ScraperResult> {
  const { owner, repo, path } = REPOS[0];
  const errors: string[] = [];
  try {
    const text = await fetchReadme(owner, repo, path);
    const jobs = parseMarkdownTable(text).slice(0, 5);
    return { jobs, errors };
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
    return { jobs: [], errors };
  }
}
