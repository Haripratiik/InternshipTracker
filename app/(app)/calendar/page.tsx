"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FirestoreJob } from "@/lib/db/firebase";

const CATEGORY_COLOR: Record<string, string> = {
  quant: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  fusion: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  swe: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  robotics: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  data_ml: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  research: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  other: "bg-muted text-muted-foreground border-border",
};

const STATUS_EVENT: Record<string, string> = {
  APPLIED: "Applied",
  OA: "OA/Screen",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

function inferCategory(job: FirestoreJob): string {
  const text = `${job.title} ${job.company} ${job.description ?? ""}`.toLowerCase();
  if (/quant|trading|signals|hrt|jane street|two sigma|citadel|optiver/.test(text)) return "quant";
  if (/fusion|plasma|tokamak|iter|pppl|mhd/.test(text)) return "fusion";
  if (/robotics|embodied|physical\s*ai|boston dynamics/.test(text)) return "robotics";
  if (/data\s*science|machine\s*learning|ml\b/.test(text)) return "data_ml";
  if (/research|scientist/.test(text)) return "research";
  if (/software|swe|developer|engineer/.test(text)) return "swe";
  return "other";
}

interface CalendarEvent {
  id: string;
  title: string;
  company: string;
  url: string;
  date: Date;
  type: string;
  category: string;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((jobs: FirestoreJob[]) => {
        const evs: CalendarEvent[] = [];
        for (const job of jobs) {
          const category = inferCategory(job);
          if (job.deadline) {
            evs.push({
              id: `${job.id}-deadline`,
              title: job.title,
              company: job.company,
              url: job.url,
              date: new Date(job.deadline),
              type: "Deadline",
              category,
            });
          }
          if (STATUS_EVENT[job.status]) {
            evs.push({
              id: `${job.id}-status`,
              title: job.title,
              company: job.company,
              url: job.url,
              date: new Date(job.updatedAt),
              type: STATUS_EVENT[job.status],
              category,
            });
          }
        }
        evs.sort((a, b) => a.date.getTime() - b.date.getTime());
        setEvents(evs);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = events.filter((e) => e.date >= now);
  const past = events.filter((e) => e.date < now).slice(-12).reverse();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground">Deadlines, follow-ups, and stage milestones.</p>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}
      {!loading && events.length === 0 && (
        <p className="text-muted-foreground">No events yet. Jobs with deadlines or active applications will appear here.</p>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Upcoming</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((ev) => (
              <Card key={ev.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm">
                      <a href={ev.url} target="_blank" rel="noreferrer" className="hover:underline">
                        {ev.title}
                      </a>
                    </CardTitle>
                    <Badge className={`text-xs border ${CATEGORY_COLOR[ev.category]}`}>{ev.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ev.company}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{ev.date.toLocaleDateString()} · {ev.type}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Past</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 opacity-60">
            {past.map((ev) => (
              <Card key={ev.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm">{ev.title}</CardTitle>
                    <Badge className={`text-xs border ${CATEGORY_COLOR[ev.category]}`}>{ev.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ev.company}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">{ev.date.toLocaleDateString()} · {ev.type}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
