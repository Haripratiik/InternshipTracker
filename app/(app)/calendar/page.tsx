import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MOCK_EVENTS = [
  { id: "1", title: "CFS Fusion Intern", type: "deadline", date: "2025-03-15", category: "fusion" },
  { id: "2", title: "Jane Street OA", type: "interview", date: "2025-02-28", category: "quant" },
  { id: "3", title: "Two Sigma follow-up", type: "followup", date: "2025-02-26", category: "swe" },
];

const CATEGORY_COLOR: Record<string, string> = {
  quant: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  fusion: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  swe: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  robotics: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  data_ml: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
  research: "bg-amber-500/20 text-amber-400 border-amber-500/40",
};

export default function CalendarPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
        <p className="text-muted-foreground">Deadlines, follow-ups, and interview dates.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_EVENTS.map((ev) => (
          <Card key={ev.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{ev.title}</CardTitle>
                <Badge className={CATEGORY_COLOR[ev.category] ?? ""}>{ev.category}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{ev.date} · {ev.type}</p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Color by role category.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
