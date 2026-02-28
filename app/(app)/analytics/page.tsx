"use client";

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

const PIE_DATA = [
  { name: "Quant", value: 35, color: "hsl(217, 91%, 60%)" },
  { name: "Fusion", value: 20, color: "hsl(25, 95%, 53%)" },
  { name: "SWE", value: 25, color: "hsl(142, 76%, 36%)" },
  { name: "Robotics / AI", value: 15, color: "hsl(280, 67%, 55%)" },
  { name: "Other", value: 5, color: "hsl(215, 20%, 65%)" },
];

const LINE_DATA = [
  { month: "Jan", applied: 4 },
  { month: "Feb", applied: 12 },
  { month: "Mar", applied: 8 },
];

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Response rate, conversion, and resume performance.</p>
      </div>

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
                    data={PIE_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {PIE_DATA.map((entry, index) => (
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
                <LineChart data={LINE_DATA}>
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

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Total applied: 24 · Response rate: 33% · Interview conversion: 25%
          </p>
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
