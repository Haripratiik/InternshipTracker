import cron from "node-cron";
import {
  getJobByUrl,
  createJob,
  createScrapeLog,
} from "@/lib/db";
import {
  scrapeGitHubRepos,
  scrapeSimplify,
  scrapeLinkedIn,
  scrapeHandshake,
  scrapeLevelsFyi,
  scrapeIndeed,
  scrapeCareerPages,
  scrapeGoogleFallback,
} from "@/lib/scrapers";
import { scoreJobRelevance } from "@/lib/ai/relevance";
import type { JobStatus } from "@/types";

const RUN_AT_AM = "0 6 * * *"; // 6am daily
const RUN_AT_PM = "0 18 * * *"; // 6pm daily

async function runAllScrapers(): Promise<{ source: string; jobsFound: number; errors: string[] }[]> {
  const results: { source: string; jobsFound: number; errors: string[] }[] = [];

  const scrapes = [
    { name: "github_repo", fn: scrapeGitHubRepos },
    { name: "simplify", fn: scrapeSimplify },
    { name: "linkedin", fn: scrapeLinkedIn },
    { name: "handshake", fn: () => scrapeHandshake(process.env.HANDSHAKE_COOKIE) },
    { name: "levels_fyi", fn: scrapeLevelsFyi },
    { name: "indeed", fn: scrapeIndeed },
    { name: "career_page", fn: scrapeCareerPages },
    { name: "google_fallback", fn: scrapeGoogleFallback },
  ] as const;

  for (const { name, fn } of scrapes) {
    try {
      const { jobs, errors } = await fn();
      for (const j of jobs) {
        try {
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
        } catch (e) {
          errors.push(`DB save ${j.url}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      await createScrapeLog(name, jobs.length, errors.length ? errors.join("; ") : null);
      results.push({ source: name, jobsFound: jobs.length, errors });
    } catch (e) {
      results.push({
        source: name,
        jobsFound: 0,
        errors: [e instanceof Error ? e.message : String(e)],
      });
    }
  }

  return results;
}

function start() {
  cron.schedule(RUN_AT_AM, async () => {
    console.log("[cron] 6am scrape started");
    await runAllScrapers();
    console.log("[cron] 6am scrape finished");
  });
  cron.schedule(RUN_AT_PM, async () => {
    console.log("[cron] 6pm scrape started");
    await runAllScrapers();
    console.log("[cron] 6pm scrape finished");
  });
  console.log("[cron] Scheduled 6am and 6pm scrapes");
}

start();
