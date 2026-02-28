import OpenAI from "openai";
import { USER_PROFILE } from "@/lib/config/profile";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

const PROFILE_HIGHLIGHTS = USER_PROFILE.keyExperienceHighlights.join("\n- ");

const ROLE_EMPHASIS: Record<string, string> = {
  quant: "Emphasize Monte Carlo, ML, portfolio app, numerical methods, and trading/signals.",
  fusion: "Emphasize ITER, PPPL, tokamak, plasma, fusion summer school, MHD, JAX digital twin.",
  robotics: "Emphasize Virturoid, embodied AI, simulation, robotics, physical AI.",
  swe: "Emphasize JAX digital twin, deployed tools, software engineering, scientific computing.",
  data_ml: "Emphasize ML, MCMC, dark matter analysis, signal finding, sentiment analysis.",
  research: "Emphasize published work, research at PPPL/ITER, summer school, scientific computing.",
};

function inferRoleCategory(title: string, company: string): string {
  const t = (title + " " + company).toLowerCase();
  if (/\bquant|trading|signals\b/.test(t)) return "quant";
  if (/\bfusion|plasma|tokamak|ITER|PPPL|MHD\b/.test(t)) return "fusion";
  if (/\brobotics|embodied|physical\s*AI|Virturoid\b/.test(t)) return "robotics";
  if (/\bsoftware\s*engineer|SWE|developer\b/.test(t)) return "swe";
  if (/\bdata\s*science|machine\s*learning|ML\b/.test(t)) return "data_ml";
  if (/\bresearch|scientist\b/.test(t)) return "research";
  return "other";
}

export async function generateCoverLetter(
  title: string,
  company: string,
  description: string
): Promise<string> {
  const category = inferRoleCategory(title, company);
  const emphasis = ROLE_EMPHASIS[category] ?? "Emphasize relevant technical and research experience.";

  if (!process.env.OPENAI_API_KEY) {
    return `Dear Hiring Manager,\n\nI am writing to apply for the ${title} position at ${company}. My background in ${USER_PROFILE.major} and experience including ${USER_PROFILE.keyExperienceHighlights[0]} make me a strong fit. I would welcome the opportunity to discuss my qualifications further.\n\nSincerely,\n${USER_PROFILE.name}`;
  }

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You write tailored cover letters for internship applications. Use ONLY the candidate's experience highlights below. ${emphasis} Keep tone professional and concise. Output plain text (no markdown).`,
        },
        {
          role: "user",
          content: `Candidate highlights:\n- ${PROFILE_HIGHLIGHTS}\n\nJob: ${title} at ${company}\n\nJob description (excerpt):\n${description.slice(0, 4000)}\n\nWrite a cover letter (3-4 short paragraphs).`,
        },
      ],
      temperature: 0.7,
    });

    return res.choices[0]?.message?.content?.trim() ?? "";
  } catch (e) {
    throw new Error(`Cover letter generation failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
