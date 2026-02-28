"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FirestoreJob } from "@/lib/db/firebase";
import type { JobStatus } from "@/types";

const COLS: { status: JobStatus; label: string }[] = [
  { status: "DISCOVERED", label: "Discovered" },
  { status: "SAVED", label: "Saved" },
  { status: "APPLIED", label: "Applied" },
  { status: "OA", label: "OA/Screen" },
  { status: "INTERVIEW", label: "Interview" },
  { status: "OFFER", label: "Offer" },
  { status: "REJECTED", label: "Rejected" },
];

const STATUS_OPTIONS: JobStatus[] = ["DISCOVERED", "SAVED", "APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED"];

function JobCard({ job, onUpdate }: {
  job: FirestoreJob;
  onUpdate: (id: string, patch: { status?: JobStatus; notes?: string; contacts?: string[] }) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(job.notes ?? "");
  const [contactInput, setContactInput] = useState("");
  const [contacts, setContacts] = useState<string[]>(job.contacts ?? []);
  const [saving, setSaving] = useState(false);

  async function saveNotes() {
    setSaving(true);
    await onUpdate(job.id, { notes });
    setSaving(false);
  }

  async function addContact() {
    const name = contactInput.trim();
    if (!name) return;
    const updated = [...contacts, name];
    setContacts(updated);
    setContactInput("");
    await onUpdate(job.id, { contacts: updated });
  }

  async function removeContact(i: number) {
    const updated = contacts.filter((_, idx) => idx !== i);
    setContacts(updated);
    await onUpdate(job.id, { contacts: updated });
  }

  const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : null;

  return (
    <Card className="cursor-default">
      <CardHeader className="p-3 pb-0">
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm">
              <a href={job.url} target="_blank" rel="noreferrer" className="hover:underline">
                {job.title}
              </a>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{job.company}</p>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-muted-foreground hover:text-foreground shrink-0 ml-1">
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2 space-y-2">
        <div className="flex items-center gap-1 flex-wrap">
          {job.relevanceScore != null && (
            <Badge variant="secondary" className="text-xs">Score: {job.relevanceScore}</Badge>
          )}
          {deadline && (
            <Badge variant="outline" className="text-xs">Due {deadline}</Badge>
          )}
          {job.visaFlag && <Badge variant="warning" className="text-xs">Visa</Badge>}
        </div>

        <select
          value={job.status}
          onChange={(e) => onUpdate(job.id, { status: e.target.value as JobStatus })}
          className="w-full rounded border bg-background px-2 py-1 text-xs text-foreground"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {expanded && (
          <div className="space-y-3 pt-1 border-t mt-2">
            {/* Contacts */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Contacts</p>
              {contacts.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span>{c}</span>
                  <button onClick={() => removeContact(i)} className="text-destructive hover:underline ml-2">✕</button>
                </div>
              ))}
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Add contact name..."
                  value={contactInput}
                  onChange={(e) => setContactInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addContact()}
                  className="flex-1 rounded border bg-background px-2 py-1 text-xs"
                />
                <Button size="sm" variant="outline" onClick={addContact} className="text-xs h-7 px-2">Add</Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes from conversations, next steps..."
                rows={3}
                className="w-full rounded border bg-background px-2 py-1 text-xs resize-none"
              />
              <Button size="sm" variant="outline" onClick={saveNotes} disabled={saving} className="text-xs h-7">
                {saving ? "Saving..." : "Save notes"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function TrackerPage() {
  const [jobs, setJobs] = useState<FirestoreJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data: FirestoreJob[]) => setJobs(data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpdate(id: string, patch: { status?: JobStatus; notes?: string; contacts?: string[] }) {
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (patch.status) {
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Application Tracker</h1>
        <p className="text-muted-foreground">Track every application. Expand a card to add contacts and notes.</p>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col.status);
          return (
            <div key={col.status} className="flex-shrink-0 w-72 rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-foreground">{col.label}</h3>
                <span className="text-xs text-muted-foreground">{colJobs.length}</span>
              </div>
              {colJobs.map((job) => (
                <JobCard key={job.id} job={job} onUpdate={handleUpdate} />
              ))}
              {colJobs.length === 0 && (
                <p className="text-xs text-muted-foreground px-1">Empty</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
