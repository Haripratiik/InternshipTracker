import { NextResponse } from "next/server";
import { getJobById, updateJob } from "@/lib/db";
import type { JobStatus } from "@/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body as { status?: string; notes?: string };

  const existing = await getJobById(id);
  if (!existing) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const data: Partial<{ status: JobStatus; notes: string }> = {};
  if (status) data.status = status as JobStatus;
  if (notes !== undefined) data.notes = notes;

  if (Object.keys(data).length > 0) await updateJob(id, data);

  const job = await getJobById(id);
  return NextResponse.json(job);
}
