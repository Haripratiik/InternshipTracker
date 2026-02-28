import OpenAI from "openai";
import { USER_PROFILE } from "@/lib/config/profile";
import type { RelevanceScoreResult } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

const PROFILE_JSON = JSON.stringify(
  {
    name: USER_PROFILE.name,
    school: USER_PROFILE.school,
    major: USER_PROFILE.major,
    gradYear: USER_PROFILE.gradYear,
    gpa: USER_PROFILE.gpa,
    visaStatus: USER_PROFILE.visaStatus,
    euCitizen: USER_PROFILE.euCitizen,
    targetRoles: USER_PROFILE.targetRoles,
    keywords: USER_PROFILE.keywords,
    keyExperienceHighlights: USER_PROFILE.keyExperienceHighlights,
  },
  null,
  2
);

const VISA_PATTERNS = [
  "US citizen",
  "security clearance",
  "TS/SCI",
  "authorized to work in the US without sponsorship",
];

function checkVisaInDescription(description: string): boolean {
  if (!description) return false;
  const lower = description.toLowerCase();
  return VISA_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

export async function scoreJobRelevance(
  title: string,
  company: string,
  description: string
): Promise<RelevanceScoreResult> {
  const visaFlag = checkVisaInDescription(description);

  if (!process.env.OPENAI_API_KEY) {
    return {
      score: 50,
      reason: "OpenAI API key not set; using default score.",
      visaFlag,
    };
  }

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a relevance scorer for internship applications. Given a job description and a candidate profile (JSON), score the job 0-100 on: role fit, skills match, visa compatibility (candidate is F1 + EU citizen; do NOT penalize EU-based roles), and seniority fit (intern roles). Reply with a JSON object: { "score": number, "reason": "exactly 2 sentences plain English" }. Do not penalize or filter EU-based roles.`,
        },
        {
          role: "user",
          content: `Profile:\n${PROFILE_JSON}\n\nJob: ${title} at ${company}\n\nDescription:\n${description.slice(0, 6000)}\n\nReturn JSON only: { "score": number, "reason": "..." }`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { score?: number; reason?: string };
    const score = Math.min(100, Math.max(0, Number(parsed.score) ?? 50));
    const reason = typeof parsed.reason === "string" ? parsed.reason : "No reason provided.";

    return { score, reason, visaFlag };
  } catch (e) {
    return {
      score: 50,
      reason: `Scoring failed: ${e instanceof Error ? e.message : String(e)}`,
      visaFlag,
    };
  }
}
