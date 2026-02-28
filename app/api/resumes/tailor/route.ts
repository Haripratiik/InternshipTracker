import { NextResponse } from "next/server";
import { getResumeById } from "@/lib/db";
import { tailorResumeBullets } from "@/lib/ai/resume-tailor";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    resumeId?: string;
    jobTitle?: string;
    company?: string;
    description?: string;
  };

  const { resumeId, jobTitle, company, description } = body;
  if (!resumeId || !jobTitle || !company) {
    return NextResponse.json({ error: "resumeId, jobTitle, and company required" }, { status: 400 });
  }

  const resume = await getResumeById(resumeId);
  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  const result = await tailorResumeBullets(resume.extractedText, {
    title: jobTitle,
    company,
    description: description ?? "",
  });

  return NextResponse.json(result);
}
