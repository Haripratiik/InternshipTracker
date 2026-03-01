import { NextResponse } from "next/server";
import { getJobs, batchCreateJobs, createScrapeLog } from "@/lib/db";
import {
  scrapeSimplifyList,
  scrapeTheMuse,
  scrapeIndeed,
} from "@/lib/scrapers";
import { scoreJobRelevance } from "@/lib/ai/relevance";
import type { JobStatus, ParsedJob } from "@/types";

export const maxDuration = 60;

// Max new jobs to write per run — keeps us well under 60s even on first run
const MAX_NEW_PER_RUN = 80;

const SCRAPERS = [
  // SimplifyJobs maintained JSON (GitHub raw, no blocking, hundreds of internships)
  { name: "simplify",   fn: scrapeSimplifyList },
  // The Muse public API — engineering/data/research, no key needed
  { name: "the_muse",   fn: scrapeTheMuse },
  // Indeed fallback — may 403 but costs nothing to try
  { name: "indeed",     fn: scrapeIndeed },
] as const;

export async function POST() {
  const errors: string[] = [];

  // Pre-load existing URLs in one query to skip duplicates (avoids N Firestore reads)
  const existingJobs = await getJobs({}).catch(() => []);
  const existingUrls = new Set(existingJobs.map((j) => j.url));

  // Run all scrapers in parallel
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

  // Score all new jobs (keyword scorer — instant, no API calls)
  const toCreate: (Omit<Parameters<typeof batchCreateJobs>[0][number], never>)[] = [];

  for (const result of settled) {
    if (result.status === "rejected") { errors.push(String(result.reason)); continue; }
    const { name, jobs, scraperErrors } = result.value;
    errors.push(...scraperErrors);

    let sourceNew = 0;
    for (const j of jobs) {
      if (toCreate.length >= MAX_NEW_PER_RUN) break;
      if (!j.url || existingUrls.has(j.url)) continue;
      existingUrls.add(j.url);

      const { score, reason, visaFlag } = await scoreJobRelevance(j.title, j.company, j.description ?? "");
      toCreate.push({
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
      sourceNew++;
    }

    await createScrapeLog(name, jobs.length, scraperErrors.length ? scraperErrors.join("; ") : null)
      .catch(() => {});
  }

  // Single batch commit — one Firestore round trip instead of N sequential writes
  const totalNew = await batchCreateJobs(toCreate).catch((e) => {
    errors.push(`Firestore batch: ${e instanceof Error ? e.message : String(e)}`);
    return 0;
  });

  return NextResponse.json({ totalNew, errors });
}
