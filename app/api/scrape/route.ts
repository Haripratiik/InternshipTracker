import { NextResponse } from "next/server";
import { getJobByUrl, createJob, createScrapeLog } from "@/lib/db";
import {
  scrapeGitHubRepos,
  scrapeSimplify,
  scrapeLevelsFyi,
  scrapeIndeed,
} from "@/lib/scrapers";
import { scoreJobRelevance } from "@/lib/ai/relevance";
import type { JobStatus } from "@/types";

export const maxDuration = 60;

export async function POST() {
  const errors: string[] = [];
  let totalNew = 0;

  for (const { name, fn } of [
    { name: "github_repo", fn: scrapeGitHubRepos },
    { name: "simplify", fn: scrapeSimplify },
    { name: "levels_fyi", fn: scrapeLevelsFyi },
    { name: "indeed", fn: scrapeIndeed },
  ]) {
    try {
      const { jobs, errors: e } = await fn();
      errors.push(...e);
      for (const j of jobs) {
        const existing = await getJobByUrl(j.url);
        if (existing) continue;
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
          rawHtml: j.rawHtml ?? null,
        });
        totalNew++;
      }
      await createScrapeLog(name, jobs.length, e.length ? e.join("; ") : null);
    } catch (err) {
      errors.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ totalNew, errors });
}
