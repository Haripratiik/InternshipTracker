import OpenAI from "openai";
import type { FirestoreResume } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });

interface Job {
  title: string;
  company: string;
  description: string;
}

export interface TailoredChange {
  original: string;
  updated: string;
  reason: string;
}

export interface TailorResult {
  tailoredBullets: string[];
  changes: TailoredChange[];
}

export interface PickResult {
  resumeId: string;
  name: string;
  reason: string;
}

export async function pickBestResume(
  resumes: FirestoreResume[],
  job: Job
): Promise<PickResult | null> {
  if (!process.env.OPENAI_API_KEY || resumes.length === 0) return null;
  if (resumes.length === 1) {
    return { resumeId: resumes[0].id, name: resumes[0].name, reason: "Only one resume available." };
  }

  const resumeSummaries = resumes
    .map((r, i) => `Resume ${i + 1} (id: ${r.id}, name: "${r.name}"):\n${r.extractedText.slice(0, 1500)}`)
    .join("\n\n---\n\n");

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a resume expert. Given multiple resume versions and a job posting, pick the single best resume for that job. Return JSON: { "resumeId": string, "name": string, "reason": string }`,
        },
        {
          role: "user",
          content: `Job: ${job.title} at ${job.company}\n\nDescription:\n${job.description.slice(0, 3000)}\n\n---\n\n${resumeSummaries}\n\nReturn JSON only.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as PickResult;
    return parsed;
  } catch {
    return { resumeId: resumes[0].id, name: resumes[0].name, reason: "Could not determine best fit." };
  }
}

export async function tailorResumeBullets(
  resumeText: string,
  job: Job
): Promise<TailorResult> {
  if (!process.env.OPENAI_API_KEY) return { tailoredBullets: [], changes: [] };

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a resume tailoring expert. Given a resume and a job description, rewrite the resume's bullet points to better match the job's required skills, keywords, and responsibilities. Rules:
- Keep all facts truthful — never fabricate experience
- Naturally incorporate keywords and skills from the job description
- Improve clarity and impact where possible
- Only rewrite bullets that would meaningfully improve fit; leave others unchanged
Return JSON: { "tailoredBullets": string[], "changes": [{ "original": string, "updated": string, "reason": string }] }
The tailoredBullets array should be the full set of bullets (rewritten or unchanged). The changes array should only include bullets that were actually changed.`,
        },
        {
          role: "user",
          content: `Job: ${job.title} at ${job.company}\n\nJob Description:\n${job.description.slice(0, 3000)}\n\n---\n\nResume:\n${resumeText.slice(0, 4000)}\n\nReturn JSON only.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as TailorResult;
    return {
      tailoredBullets: parsed.tailoredBullets ?? [],
      changes: parsed.changes ?? [],
    };
  } catch {
    return { tailoredBullets: [], changes: [] };
  }
}
