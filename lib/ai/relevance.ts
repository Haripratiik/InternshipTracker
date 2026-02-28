import { USER_PROFILE } from "@/lib/config/profile";
import type { RelevanceScoreResult } from "@/types";

const VISA_PATTERNS = [
  "us citizen",
  "security clearance",
  "ts/sci",
  "authorized to work in the us without sponsorship",
  "must be a us citizen",
  "us citizenship required",
  "active clearance",
];

function tokenize(phrase: string): string[] {
  return phrase
    .toLowerCase()
    .split(/[\s\/+,()-]+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "with", "intern", "internship"].includes(w));
}

/**
 * Pure keyword-based relevance scorer — no AI API calls.
 * Scoring breakdown (max 100):
 *   +10  intern signal in text
 *   +20  target firm match
 *   +25  best target role token coverage
 *   +15  title exact role match bonus
 *   +4   per keyword match (capped at profile keywords)
 *   −25  visa restriction detected
 *   −20  looks like a senior/full-time role with no intern signal
 */
export async function scoreJobRelevance(
  title: string,
  company: string,
  description: string
): Promise<RelevanceScoreResult> {
  const text = `${title} ${company} ${description}`.toLowerCase();
  const titleLower = title.toLowerCase();

  // Visa flag
  const visaFlag = VISA_PATTERNS.some((p) => text.includes(p));

  let score = 0;
  const reasons: string[] = [];

  // ── Intern signal ──────────────────────────────────────────────
  const internSignal = /intern|co-?op|new\s*grad|entry.?level|trainee|summer\s*(program|position|role)/.test(text);
  if (internSignal) {
    score += 10;
  } else if (description.length > 300) {
    score -= 20;
    reasons.push("likely senior/full-time role");
  }

  // ── Target firm ────────────────────────────────────────────────
  for (const firm of USER_PROFILE.targetFirms) {
    if (text.includes(firm.toLowerCase())) {
      score += 20;
      reasons.push(`target firm: ${firm}`);
      break;
    }
  }

  // ── Target role token coverage ─────────────────────────────────
  let bestRoleScore = 0;
  let bestRole = "";
  for (const role of USER_PROFILE.targetRoles) {
    const tokens = tokenize(role);
    const matches = tokens.filter((t) => text.includes(t));
    const coverage = tokens.length > 0 ? matches.length / tokens.length : 0;
    const rs = Math.round(coverage * 25);
    if (rs > bestRoleScore) {
      bestRoleScore = rs;
      bestRole = role;
    }
  }
  if (bestRoleScore > 0) {
    score += bestRoleScore;
    reasons.push(`role match: ${bestRole}`);
  }

  // ── Title exact match bonus ────────────────────────────────────
  for (const role of USER_PROFILE.targetRoles) {
    const core = role.replace(/\s*(intern|internship)$/i, "").toLowerCase();
    if (titleLower.includes(core)) {
      score += 15;
      reasons.push(`title hit: ${role}`);
      break;
    }
  }

  // ── Keyword matching ───────────────────────────────────────────
  const matched: string[] = [];
  for (const kw of USER_PROFILE.keywords) {
    if (text.includes(kw.toLowerCase())) {
      score += 4;
      matched.push(kw);
    }
  }
  if (matched.length > 0) {
    reasons.push(`skills: ${matched.slice(0, 5).join(", ")}`);
  }

  // ── Visa penalty ───────────────────────────────────────────────
  if (visaFlag) {
    score -= 25;
    reasons.push("visa restriction");
  }

  const finalScore = Math.min(100, Math.max(0, score));
  const reason =
    reasons.length > 0
      ? reasons.join("; ") + "."
      : "No strong keyword signals found.";

  return { score: finalScore, reason, visaFlag };
}
