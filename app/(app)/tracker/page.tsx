"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const MOCK_KANBAN = [
  { id: "1", title: "Quant Research Intern", company: "Jane Street", status: "SAVED" as JobStatus },
  { id: "2", title: "Fusion Intern", company: "CFS", status: "APPLIED" as JobStatus },
  { id: "3", title: "SWE Intern", company: "Two Sigma", status: "OA" as JobStatus },
  { id: "4", title: "Physical AI Intern", company: "Physical Intelligence", status: "DISCOVERED" as JobStatus },
];

export default function TrackerPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Application Tracker</h1>
        <p className="text-muted-foreground">Drag cards between columns to update status.</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLS.map((col) => (
          <div
            key={col.status}
            className="flex-shrink-0 w-72 rounded-lg border bg-card p-3 space-y-2"
          >
            <h3 className="font-semibold text-sm text-foreground">{col.label}</h3>
            {MOCK_KANBAN.filter((j) => j.status === col.status).map((job) => (
              <Card key={job.id} className="cursor-grab">
                <CardHeader className="p-3 pb-0">
                  <CardTitle className="text-sm">{job.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{job.company}</p>
                </CardHeader>
                <CardContent className="p-3 pt-1">
                  <p className="text-xs text-muted-foreground">Expand for cover letter, resume, timeline, notes.</p>
                  <Badge variant="outline" className="mt-2 text-xs">Follow Up</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
