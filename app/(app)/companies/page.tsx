import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { USER_PROFILE } from "@/lib/config/profile";

const MOCK_FIRMS = USER_PROFILE.targetFirms.slice(0, 8).map((name, i) => ({
  name,
  openRoles: i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0,
  contacts: 0,
  notes: "",
}));

export default function CompaniesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Company Intelligence</h1>
        <p className="text-muted-foreground">Target firms, open roles, contacts, and hiring notes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_FIRMS.map((firm) => (
          <Card key={firm.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{firm.name}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary">{firm.openRoles} open</Badge>
                {firm.contacts > 0 && (
                  <Badge variant="outline">{firm.contacts} contacts</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Overview, timeline, and typical process notes (edit in settings).
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
