"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FirestoreJob } from "@/lib/db/firebase";

// ── Types ──────────────────────────────────────────────────────────────────

interface CalEvent {
  id: string;
  title: string;
  company: string;
  url: string;
  date: Date;
  type: "Deadline" | "Applied" | "OA/Screen" | "Interview" | "Offer" | "Rejected";
}

// ── Config ─────────────────────────────────────────────────────────────────

const TYPE_DOT: Record<string, string> = {
  Deadline: "bg-red-500",
  Applied: "bg-blue-500",
  "OA/Screen": "bg-yellow-400",
  Interview: "bg-purple-500",
  Offer: "bg-green-500",
  Rejected: "bg-zinc-500",
};

const TYPE_BADGE: Record<string, string> = {
  Deadline: "bg-red-500/20 text-red-400 border-red-500/40",
  Applied: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  "OA/Screen": "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  Interview: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  Offer: "bg-green-500/20 text-green-400 border-green-500/40",
  Rejected: "bg-zinc-500/20 text-zinc-400 border-zinc-500/40",
};

const STATUS_TO_TYPE: Record<string, CalEvent["type"]> = {
  APPLIED: "Applied",
  OA: "OA/Screen",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Helpers ────────────────────────────────────────────────────────────────

function buildEvents(jobs: FirestoreJob[]): CalEvent[] {
  const evs: CalEvent[] = [];
  for (const job of jobs) {
    if (job.deadline) {
      evs.push({ id: `${job.id}-d`, title: job.title, company: job.company, url: job.url, date: new Date(job.deadline), type: "Deadline" });
    }
    const type = STATUS_TO_TYPE[job.status];
    if (type) {
      evs.push({ id: `${job.id}-s`, title: job.title, company: job.company, url: job.url, date: new Date(job.updatedAt), type });
    }
  }
  return evs;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Date | null>(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((jobs: FirestoreJob[]) => setEvents(buildEvents(jobs)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelected(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelected(null);
  }

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString("default", { month: "long", year: "numeric" });
  const selectedEvents = selected ? events.filter((e) => sameDay(e.date, selected)) : [];

  const upcoming14 = events
    .filter((e) => { const d = e.date.getTime() - today.getTime(); return d >= 0 && d <= 14 * 86400_000; })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground">Deadlines, applications, and stage milestones.</p>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}

      {!loading && (
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Month Grid ── */}
          <div className="flex-1 min-w-0">
            {/* Nav */}
            <div className="flex items-center justify-between mb-4">
              <Button size="sm" variant="outline" onClick={prevMonth}>‹ Prev</Button>
              <span className="font-semibold text-foreground">{monthName}</span>
              <Button size="sm" variant="outline" onClick={nextMonth}>Next ›</Button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
              {cells.map((day, i) => {
                if (!day) return <div key={i} className="bg-background min-h-[76px]" />;

                const cellDate = new Date(viewYear, viewMonth, day);
                const dayEvs = events.filter((e) => sameDay(e.date, cellDate));
                const isToday = sameDay(cellDate, today);
                const isSel = selected && sameDay(cellDate, selected);

                return (
                  <button
                    key={i}
                    onClick={() => setSelected(isSel ? null : cellDate)}
                    className={`bg-background min-h-[76px] p-1.5 text-left transition-colors hover:bg-muted/40 ${isSel ? "ring-2 ring-inset ring-primary bg-muted/20" : ""}`}
                  >
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold mb-1 ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                      {day}
                    </span>
                    <div className="space-y-0.5">
                      {dayEvs.slice(0, 3).map((ev) => (
                        <div key={ev.id} className="flex items-center gap-1 rounded px-1 py-0.5 bg-muted/50">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${TYPE_DOT[ev.type]}`} />
                          <span className="text-[10px] text-foreground truncate leading-tight">{ev.company}</span>
                        </div>
                      ))}
                      {dayEvs.length > 3 && (
                        <p className="text-[10px] text-muted-foreground px-1">+{dayEvs.length - 3}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3">
              {Object.entries(TYPE_DOT).map(([type, dot]) => (
                <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${dot}`} />
                  {type}
                </span>
              ))}
            </div>
          </div>

          {/* ── Side Panel ── */}
          <div className="lg:w-72 space-y-4 shrink-0">
            {/* Selected day */}
            {selected && (
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {selected.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric" })}
                </h2>
                {selectedEvents.length === 0 && (
                  <p className="text-xs text-muted-foreground">No events on this day.</p>
                )}
                {selectedEvents.map((ev) => (
                  <div key={ev.id} className="rounded-lg border bg-card p-3 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <a href={ev.url} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline leading-tight">
                        {ev.title}
                      </a>
                      <Badge className={`text-[10px] border shrink-0 ${TYPE_BADGE[ev.type]}`}>{ev.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{ev.company}</p>
                  </div>
                ))}
              </div>
            )}

            {!selected && (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-xs text-muted-foreground">Click a day to see its events</p>
              </div>
            )}

            {/* Upcoming 14 days */}
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Next 14 days
              </h2>
              {upcoming14.length === 0 && (
                <p className="text-xs text-muted-foreground">Nothing coming up.</p>
              )}
              {upcoming14.slice(0, 10).map((ev) => (
                <div key={ev.id} className="rounded border bg-card px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">{ev.title}</span>
                    <Badge className={`text-[10px] border shrink-0 ${TYPE_BADGE[ev.type]}`}>{ev.type}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {ev.company} · {ev.date.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
