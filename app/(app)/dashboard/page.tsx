import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_JOBS } from "./mock-data";

function ScoreBadge({ score }: { score: number }) {
  const variant =
    score >= 80 ? "success" : score >= 60 ? "default" : score >= 40 ? "warning" : "secondary";
  return <Badge variant={variant}>{score}</Badge>;
}

export default function DiscoveryPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Job Discovery</h1>
        <p className="text-muted-foreground">Sorted by relevance. Default threshold: 60+</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground">Filters:</span>
        <Badge variant="outline">Role</Badge>
        <Badge variant="outline">Company</Badge>
        <Badge variant="outline">Location</Badge>
        <Badge variant="outline">Source</Badge>
        <Badge variant="outline">Visa flag</Badge>
        <Badge variant="outline">Score ≥ 60</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_JOBS.map((job) => (
          <Card key={job.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{job.title}</CardTitle>
                <ScoreBadge score={job.relevanceScore ?? 0} />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-xs">
                  {job.source}
                </Badge>
                {job.visaFlag && (
                  <Badge variant="warning">Visa</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-2">
              {job.location && (
                <p className="text-xs text-muted-foreground">{job.location}</p>
              )}
              {job.relevanceReason && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {job.relevanceReason}
                </p>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button size="sm">Save</Button>
                <Button size="sm" variant="outline">Quick Apply</Button>
                <Button size="sm" variant="ghost">Dismiss</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
