import { NextResponse } from "next/server";
import { getResumes } from "@/lib/db";
import { pickBestResume } from "@/lib/ai/resume-tailor";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    jobTitle?: string;
    company?: string;
    description?: string;
  };

  const { jobTitle, company, description } = body;
  if (!jobTitle || !company) {
    return NextResponse.json({ error: "jobTitle and company required" }, { status: 400 });
  }

  const resumes = await getResumes();
  if (resumes.length === 0) {
    return NextResponse.json({ error: "No resumes uploaded yet" }, { status: 404 });
  }

  const result = await pickBestResume(resumes, {
    title: jobTitle,
    company,
    description: description ?? "",
  });

  return NextResponse.json(result);
}
