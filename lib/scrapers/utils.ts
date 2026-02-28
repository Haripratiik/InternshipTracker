import { USER_PROFILE } from "@/lib/config/profile";

const VISA_BLACKLIST_PATTERNS = [
  /US\s*citizen(ship)?\s*required/i,
  /security\s*clearance/i,
  /TS\/SCI/i,
  /authorized\s*to\s*work\s*(in\s*the\s*US|in\s*the\s*U\.?S\.?)\s*without\s*sponsorship/i,
  /must\s*be\s*authorized\s*to\s*work/i,
];

export function checkVisaBlacklist(description: string): boolean {
  if (!description) return false;
  const text = description.toLowerCase();
  for (const phrase of USER_PROFILE.blacklist) {
    if (text.includes(phrase.toLowerCase())) return true;
  }
  for (const re of VISA_BLACKLIST_PATTERNS) {
    if (re.test(description)) return true;
  }
  return false;
}

export function randomDelay(minMs: number = 2000, maxMs: number = 8000): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((r) => setTimeout(r, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxAttempts) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }
  throw lastError;
}
