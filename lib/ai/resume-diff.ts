import OpenAI from "openai";
import type { ResumeSuggestion } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

export async function suggestResumeEdits(
  resumeBullets: string[],
  jobDescription: string
): Promise<ResumeSuggestion[]> {
  if (!process.env.OPENAI_API_KEY || resumeBullets.length === 0) {
    return [];
  }

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You suggest bullet point reorderings and edits to better match a job description. Never auto-edit; only suggest. For each suggestion return: bulletIndex (0-based), original, suggested, reason. Output JSON array: [{ "bulletIndex": number, "original": string, "suggested": string, "reason": string }]. Only include bullets that would clearly improve fit.`,
        },
        {
          role: "user",
          content: `Resume bullets:\n${resumeBullets.map((b, i) => `${i}. ${b}`).join("\n")}\n\nJob description:\n${jobDescription.slice(0, 4000)}\n\nReturn JSON array of suggestions only.`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const raw = res.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { suggestions?: ResumeSuggestion[] } | ResumeSuggestion[];
    const arr = Array.isArray(parsed) ? parsed : parsed.suggestions ?? [];
    return arr.slice(0, 10);
  } catch {
    return [];
  }
}
