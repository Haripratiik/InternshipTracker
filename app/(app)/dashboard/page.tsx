"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FirestoreJob } from "@/lib/db/firebase";
import type { TailoredChange } from "@/lib/ai/resume-tailor";

function ScoreBadge({ score }: { score: number }) {
  const variant =
    score >= 80 ? "success" : score >= 60 ? "default" : score >= 40 ? "warning" : "secondary";
  return <Badge variant={variant}>{score}</Badge>;
}

interface TailorModal {
  job: FirestoreJob;
  loading: boolean;
  pickedResumeName?: string;
  pickedReason?: string;
  changes: TailoredChange[];
  tailoredBullets: string[];
  error?: string;
}

export default function DiscoveryPage() {
  const [jobs, setJobs] = useState<FirestoreJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [tailorModal, setTailorModal] = useState<TailorModal | null>(null);

  useEffect(() => {
    fetch("/api/jobs?threshold=60")
      .then((r) => r.json())
      .then((data: FirestoreJob[]) => setJobs(data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(id: string) {
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SAVED" }),
    });
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, status: "SAVED" } : j)));
  }

  async function handleDismiss(id: string) {
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REJECTED" }),
    });
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }

  async function handleTailor(job: FirestoreJob) {
    setTailorModal({ job, loading: true, changes: [], tailoredBullets: [] });

    try {
      const pickRes = await fetch("/api/resumes/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: job.title,
          company: job.company,
          description: job.description ?? "",
        }),
      });
      const pick = await pickRes.json() as { resumeId?: string; name?: string; reason?: string; error?: string };

      if (!pickRes.ok || pick.error) {
        setTailorModal((prev) => prev ? { ...prev, loading: false, error: pick.error ?? "No resumes uploaded yet. Upload one in Settings." } : null);
        return;
      }

      const tailorRes = await fetch("/api/resumes/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: pick.resumeId,
          jobTitle: job.title,
          company: job.company,
          description: job.description ?? "",
        }),
      });
      const tailor = await tailorRes.json() as { tailoredBullets?: string[]; changes?: TailoredChange[] };

      setTailorModal((prev) => prev ? {
        ...prev,
        loading: false,
        pickedResumeName: pick.name,
        pickedReason: pick.reason,
        changes: tailor.changes ?? [],
        tailoredBullets: tailor.tailoredBullets ?? [],
      } : null);
    } catch {
      setTailorModal((prev) => prev ? { ...prev, loading: false, error: "Failed to tailor resume." } : null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Job Discovery</h1>
        <p className="text-muted-foreground">Sorted by relevance. Showing score 60+</p>
      </div>

      {loading && <p className="text-muted-foreground">Loading jobs...</p>}
      {!loading && jobs.length === 0 && (
        <p className="text-muted-foreground">No jobs yet. Trigger a scrape to populate the feed.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">
                  <a href={job.url} target="_blank" rel="noreferrer" className="hover:underline">
                    {job.title}
                  </a>
                </CardTitle>
                <ScoreBadge score={job.relevanceScore ?? 0} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">{job.source}</Badge>
                {job.visaFlag && <Badge variant="warning">Visa</Badge>}
                {job.status === "SAVED" && <Badge variant="default">Saved</Badge>}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-2">
              {job.location && <p className="text-xs text-muted-foreground">{job.location}</p>}
              {job.relevanceReason && (
                <p className="text-xs text-muted-foreground line-clamp-2">{job.relevanceReason}</p>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <a href={job.url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="secondary">View Job ↗</Button>
                </a>
                <Button size="sm" onClick={() => handleSave(job.id)} disabled={job.status === "SAVED"}>
                  {job.status === "SAVED" ? "Saved" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleTailor(job)}>
                  Tailor Resume
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDismiss(job.id)}>
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tailor Resume Modal */}
      {tailorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold">Tailor Resume</h2>
                <p className="text-sm text-muted-foreground">
                  {tailorModal.job.title} @ {tailorModal.job.company}
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setTailorModal(null)}>✕</Button>
            </div>

            {tailorModal.loading && <p className="text-muted-foreground">Analysing your resumes...</p>}

            {tailorModal.error && (
              <p className="text-sm text-destructive">{tailorModal.error}</p>
            )}

            {!tailorModal.loading && !tailorModal.error && (
              <>
                {tailorModal.pickedResumeName && (
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                    <p className="font-medium">Best resume for this job: {tailorModal.pickedResumeName}</p>
                    {tailorModal.pickedReason && (
                      <p className="text-muted-foreground">{tailorModal.pickedReason}</p>
                    )}
                  </div>
                )}

                {tailorModal.changes.length === 0 && (
                  <p className="text-sm text-muted-foreground">No bullet changes needed — your resume already fits this job well.</p>
                )}

                {tailorModal.changes.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">{tailorModal.changes.length} suggested bullet improvement{tailorModal.changes.length > 1 ? "s" : ""}:</p>
                    {tailorModal.changes.map((c, i) => (
                      <div key={i} className="rounded-lg border p-3 space-y-2 text-sm">
                        <p className="text-muted-foreground line-through">{c.original}</p>
                        <p className="text-foreground font-medium">{c.updated}</p>
                        <p className="text-xs text-muted-foreground italic">{c.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {tailorModal.tailoredBullets.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Full tailored bullet list:</p>
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                      {tailorModal.tailoredBullets.map((b, i) => (
                        <p key={i}>• {b}</p>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigator.clipboard.writeText(tailorModal.tailoredBullets.join("\n"))}
                    >
                      Copy all bullets
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
