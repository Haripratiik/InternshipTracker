import { getApps, initializeApp, getApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import type { JobStatus } from "@/types";

export interface FirestoreJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  url: string;
  source: string;
  postedAt: Date | null;
  deadline: Date | null;
  description: string | null;
  skills: string[];
  visaFlag: boolean;
  relevanceScore: number | null;
  relevanceReason: string | null;
  status: JobStatus;
  notes: string | null;
  rawHtml: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function getFirebaseApp(): ReturnType<typeof getApp> {
  if (getApps().length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Missing Firebase config: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env"
      );
    }

    initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return getApp();
}

export function getDb(): Firestore {
  getFirebaseApp();
  return getFirestore();
}

const JOBS = "jobs";
const SCRAPE_LOGS = "scrapeLogs";

function toDate(val: unknown): Date | null {
  if (val instanceof Date) return val;
  if (val && typeof val === "object" && "toDate" in val && typeof (val as { toDate: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate();
  }
  if (typeof val === "string") return new Date(val);
  return null;
}

function docToJob(id: string, data: Record<string, unknown>): FirestoreJob {
  return {
    id,
    title: (data.title as string) ?? "",
    company: (data.company as string) ?? "",
    location: (data.location as string | null) ?? null,
    url: (data.url as string) ?? "",
    source: (data.source as string) ?? "",
    postedAt: toDate(data.postedAt),
    deadline: toDate(data.deadline),
    description: (data.description as string | null) ?? null,
    skills: Array.isArray(data.skills) ? (data.skills as string[]) : [],
    visaFlag: Boolean(data.visaFlag),
    relevanceScore: (data.relevanceScore as number) ?? null,
    relevanceReason: (data.relevanceReason as string) ?? null,
    status: ((data.status as JobStatus) ?? "DISCOVERED") as JobStatus,
    notes: (data.notes as string | null) ?? null,
    rawHtml: (data.rawHtml as string | null) ?? null,
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
  };
}

export async function getJobs(options: {
  threshold?: number;
  source?: string;
  status?: JobStatus;
  limit?: number;
}): Promise<FirestoreJob[]> {
  const db = getDb();
  const snap = await db.collection(JOBS).orderBy("createdAt", "desc").limit(300).get();

  let list = snap.docs.map((d) => docToJob(d.id, d.data()));
  list.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

  if (options.threshold != null) {
    list = list.filter((j) => (j.relevanceScore ?? 0) >= options.threshold!);
  }
  if (options.source) {
    list = list.filter((j) => j.source === options.source);
  }
  if (options.status) {
    list = list.filter((j) => j.status === options.status);
  }

  return list.slice(0, options.limit ?? 100);
}

export async function getJobByUrl(url: string): Promise<FirestoreJob | null> {
  const db = getDb();
  const snap = await db.collection(JOBS).where("url", "==", url).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return docToJob(d.id, d.data());
}

export async function getJobById(id: string): Promise<FirestoreJob | null> {
  const db = getDb();
  const d = await db.collection(JOBS).doc(id).get();
  if (!d.exists) return null;
  return docToJob(d.id, d.data() ?? {});
}

export async function createJob(data: Omit<FirestoreJob, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const db = getDb();
  const now = new Date();
  const ref = await db.collection(JOBS).add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateJob(
  id: string,
  data: Partial<Pick<FirestoreJob, "status" | "notes" | "updatedAt">>
): Promise<void> {
  const db = getDb();
  await db.collection(JOBS).doc(id).update({
    ...data,
    updatedAt: data.updatedAt ?? new Date(),
  });
}

export async function createScrapeLog(source: string, jobsFound: number, errors: string | null): Promise<void> {
  const db = getDb();
  await db.collection(SCRAPE_LOGS).add({
    source,
    runAt: new Date(),
    jobsFound,
    errors,
  });
}
