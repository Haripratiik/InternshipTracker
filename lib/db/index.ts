import { USER_PROFILE } from "@/lib/config/profile";
import {
  getDb,
  getJobs,
  getJobByUrl,
  getJobById,
  createJob,
  batchCreateJobs,
  updateJob,
  createScrapeLog,
  getResumes,
  getResumeById,
  createResume,
  deleteResume,
  type FirestoreJob,
} from "./firebase";

export {
  USER_PROFILE,
  getDb,
  getJobs,
  getJobByUrl,
  getJobById,
  createJob,
  batchCreateJobs,
  updateJob,
  createScrapeLog,
  getResumes,
  getResumeById,
  createResume,
  deleteResume,
  type FirestoreJob,
};
