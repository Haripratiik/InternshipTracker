import { NextResponse } from "next/server";
import { getJobs } from "@/lib/db";
import type { JobStatus } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threshold = Math.min(100, Math.max(0, Number(searchParams.get("threshold")) || 60));
  const source = searchParams.get("source") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const jobs = await getJobs({
    threshold,
    source,
    status: status as JobStatus | undefined,
    limit: 100,
  });

  return NextResponse.json(jobs);
}
