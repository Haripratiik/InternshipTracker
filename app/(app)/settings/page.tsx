import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Resumes, cookies, target companies, and API keys.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumes</CardTitle>
          <p className="text-sm text-muted-foreground">Upload and manage multiple PDF versions.</p>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Upload resume (PDF)</Button>
          <p className="text-xs text-muted-foreground mt-2">No resumes uploaded yet.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Handshake session cookie</CardTitle>
          <p className="text-sm text-muted-foreground">Paste your Handshake session cookie to enable scraping.</p>
        </CardHeader>
        <CardContent>
          <input
            type="password"
            placeholder="Paste cookie value..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Button className="mt-2" variant="secondary">Save cookie</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Target companies</CardTitle>
          <p className="text-sm text-muted-foreground">Add or remove target firms for career page scraping.</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Managed via profile config (targetFirms).</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relevance score threshold</CardTitle>
          <p className="text-sm text-muted-foreground">Default: 60. Jobs below this are hidden from default feed.</p>
        </CardHeader>
        <CardContent>
          <input
            type="number"
            defaultValue={60}
            min={0}
            max={100}
            className="w-20 rounded-md border bg-background px-3 py-2 text-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications & reminders</CardTitle>
          <p className="text-sm text-muted-foreground">Deadline alerts (7d, 3d), follow-up reminders (14d).</p>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked /> Enable deadline alerts
          </label>
          <label className="flex items-center gap-2 text-sm mt-2">
            <input type="checkbox" defaultChecked /> Enable follow-up reminders
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-scraping per source</CardTitle>
          <p className="text-sm text-muted-foreground">Toggle each source on/off for daily 6am and 6pm runs.</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">github_repo, simplify, linkedin, handshake, levels_fyi, indeed, career_page, google_fallback.</p>
          <label className="flex items-center gap-2 text-sm mt-2">
            <input type="checkbox" defaultChecked /> Enable all scrapers
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI API key</CardTitle>
          <p className="text-sm text-muted-foreground">Required for relevance scoring, cover letter generation, resume suggestions.</p>
        </CardHeader>
        <CardContent>
          <input
            type="password"
            placeholder="sk-..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <Button className="mt-2" variant="secondary">Save (store in env)</Button>
        </CardContent>
      </Card>
    </div>
  );
}
