"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { FirestoreJob } from "@/lib/db/firebase";

const CATEGORY_COLORS: Record<string, string> = {
  quant: "hsl(217, 91%, 60%)",
  fusion: "hsl(25, 95%, 53%)",
  swe: "hsl(142, 76%, 36%)",
  robotics: "hsl(280, 67%, 55%)",
  data_ml: "hsl(188, 85%, 45%)",
  research: "hsl(45, 93%, 47%)",
  other: "hsl(215, 20%, 65%)",
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

export default function AnalyticsPage() {
  const [jobs, setJobs] = useState<FirestoreJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data: FirestoreJob[]) => setJobs(data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  // Applications by category (jobs with status != DISCOVERED/REJECTED)
  const applied = jobs.filter((j) => !["DISCOVERED", "REJECTED"].includes(j.status));
  const catCounts: Record<string, number> = {};
  for (const j of applied) {
    const cat = inferCategory(j);
    catCounts[cat] = (catCounts[cat] ?? 0) + 1;
  }
  const pieData = Object.entries(catCounts).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
    color: CATEGORY_COLORS[name] ?? CATEGORY_COLORS.other,
  }));

  // Applications over time (group by month)
  const monthCounts: Record<string, number> = {};
  for (const j of applied) {
    const d = new Date(j.updatedAt);
    const key = `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
    monthCounts[key] = (monthCounts[key] ?? 0) + 1;
  }
  const lineData = Object.entries(monthCounts)
    .sort((a, b) => new Date("1 " + a[0]).getTime() - new Date("1 " + b[0]).getTime())
    .map(([month, count]) => ({ month, applied: count }));

  // Summary stats
  const totalApplied = applied.length;
  const responses = jobs.filter((j) => ["OA", "INTERVIEW", "OFFER"].includes(j.status)).length;
  const interviews = jobs.filter((j) => ["INTERVIEW", "OFFER"].includes(j.status)).length;
  const responseRate = totalApplied > 0 ? Math.round((responses / totalApplied) * 100) : 0;
  const interviewRate = responses > 0 ? Math.round((interviews / responses) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Response rate, conversion, and resume performance.</p>
      </div>

      {loading && <p className="text-muted-foreground">Loading...</p>}

      {!loading && totalApplied === 0 && (
        <p className="text-muted-foreground">No applications yet. Save and apply to jobs in the Dashboard to see stats here.</p>
      )}

      {!loading && totalApplied > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Applications by role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applications over time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="applied"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          {!loading && (
            <p className="text-sm text-muted-foreground">
              Total applied: {totalApplied} · Response rate: {responseRate}% · Interview conversion: {interviewRate}%
            </p>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Top performing resume versions by response rate will appear here once you have multiple versions and applications.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
