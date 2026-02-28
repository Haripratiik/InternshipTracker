import { NextResponse } from "next/server";
import { getJobs, createJob, createScrapeLog } from "@/lib/db";
import {
  scrapeGitHubRepos,
  scrapeSimplify,
  scrapeLevelsFyi,
  scrapeIndeed,
} from "@/lib/scrapers";
import { scoreJobRelevance } from "@/lib/ai/relevance";
import type { JobStatus, ParsedJob } from "@/types";

export const maxDuration = 60;

const SCRAPERS = [
  { name: "github_repo", fn: scrapeGitHubRepos },
  { name: "simplify",    fn: scrapeSimplify },
  { name: "levels_fyi",  fn: scrapeLevelsFyi },
  { name: "indeed",      fn: scrapeIndeed },
] as const;

export async function POST() {
  const errors: string[] = [];
  let totalNew = 0;

  // Pre-load all existing URLs in one query — avoids N Firestore reads per job
  const existingJobs = await getJobs({}).catch(() => []);
  const existingUrls = new Set(existingJobs.map((j) => j.url));

  // Run all scrapers in parallel instead of sequentially
  const settled = await Promise.allSettled(
    SCRAPERS.map(({ name, fn }) =>
      fn()
        .then((r) => ({ name, jobs: r.jobs, scraperErrors: r.errors }))
        .catch((e: unknown) => ({
          name,
          jobs: [] as ParsedJob[],
          scraperErrors: [`${name}: ${e instanceof Error ? e.message : String(e)}`],
        }))
    )
  );

  for (const result of settled) {
    if (result.status === "rejected") {
      errors.push(String(result.reason));
      continue;
    }
    const { name, jobs, scraperErrors } = result.value;
    errors.push(...scraperErrors);

    for (const j of jobs) {
      if (!j.url || existingUrls.has(j.url)) continue;
      existingUrls.add(j.url); // dedupe within this run

      try {
        const { score, reason, visaFlag } = await scoreJobRelevance(
          j.title,
          j.company,
          j.description ?? ""
        );
        await createJob({
          title: j.title,
          company: j.company,
          location: j.location ?? null,
          url: j.url,
          source: name,
          postedAt: j.postedAt ?? null,
          deadline: j.deadline ?? null,
          description: j.description ?? null,
          skills: j.skills,
          visaFlag: j.visaFlag || visaFlag,
          relevanceScore: score,
          relevanceReason: reason,
          status: "DISCOVERED" as JobStatus,
          notes: null,
          contacts: [],
          rawHtml: j.rawHtml ?? null,
        });
        totalNew++;
      } catch (e) {
        errors.push(`save ${j.url}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await createScrapeLog(name, jobs.length, scraperErrors.length ? scraperErrors.join("; ") : null)
      .catch(() => {});
  }

  return NextResponse.json({ totalNew, errors });
}
