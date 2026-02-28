export const JOB_STATUSES = [
  "DISCOVERED",
  "SAVED",
  "APPLIED",
  "OA",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export interface ParsedJob {
  title: string;
  company: string;
  location?: string;
  url: string;
  postedAt?: Date;
  deadline?: Date;
  description?: string;
  skills: string[];
  visaFlag: boolean;
  rawHtml?: string;
  rawJson?: string;
}

export interface ScraperResult {
  jobs: ParsedJob[];
  errors: string[];
}

export interface RelevanceScoreResult {
  score: number;
  reason: string;
  visaFlag: boolean;
}

export interface ResumeSuggestion {
  bulletIndex: number;
  original: string;
  suggested: string;
  reason: string;
}

export const JOB_SOURCES = [
  "simplify",
  "linkedin",
  "handshake",
  "github_repo",
  "levels_fyi",
  "career_page",
  "indeed",
  "greenhouse",
  "lever",
  "workday",
  "google_fallback",
] as const;

export type JobSource = (typeof JOB_SOURCES)[number];

export const ROLE_CATEGORIES = [
  "quant",
  "fusion",
  "swe",
  "robotics",
  "data_ml",
  "research",
  "other",
] as const;

export type RoleCategory = (typeof ROLE_CATEGORIES)[number];
