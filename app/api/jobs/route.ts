import { NextResponse } from "next/server";
import { getJobs } from "@/lib/db";
import type { JobStatus } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawThreshold = searchParams.get("threshold");
  const threshold = rawThreshold != null
    ? Math.min(100, Math.max(0, Number(rawThreshold)))
    : undefined;
  const source = searchParams.get("source") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  let jobs = await getJobs({
    threshold,
    source,
    status: status as JobStatus | undefined,
    limit: 200,
  });

  // Extra filters for the discovery feed (when threshold is explicitly provided)
  if (rawThreshold != null) {
    // 1. Remove PhD-only roles — not relevant for undergrad applicant
    jobs = jobs.filter((j) => !/\bphd\b/i.test(j.title));

    // 2. Deduplicate by company + normalised title — same role in multiple cities
    //    shows as one card (keep the highest-scored copy)
    const seen = new Map<string, (typeof jobs)[0]>();
    for (const j of jobs) {
      const key = `${j.company.toLowerCase()}|${j.title.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      const prev = seen.get(key);
      if (!prev || (j.relevanceScore ?? 0) > (prev.relevanceScore ?? 0)) {
        seen.set(key, j);
      }
    }
    jobs = Array.from(seen.values()).sort(
      (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
    );
  }

  return NextResponse.json(jobs.slice(0, 100));
}
