"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getFirebaseStorage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import type { EditableProfile } from "@/app/api/profile/route";

interface ResumeItem {
  id: string;
  name: string;
  downloadUrl: string;
  uploadedAt: string;
}

export default function SettingsPage() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [roleInput, setRoleInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [blacklistInput, setBlacklistInput] = useState("");

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((data: ResumeItem[]) => setResumes(data))
      .catch(() => {});
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: EditableProfile) => setProfile(data))
      .catch(() => {});
  }, []);

  async function saveProfile() {
    if (!profile) return;
    setProfileSaving(true);
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }

  function profileField(key: keyof EditableProfile, label: string, type: "text" | "number" | "checkbox" = "text") {
    if (!profile) return null;
    if (type === "checkbox") {
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={profile[key] as boolean}
            onChange={(e) => setProfile({ ...profile, [key]: e.target.checked })}
          />
          {label}
        </label>
      );
    }
    return (
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <input
          type={type}
          value={profile[key] as string | number}
          onChange={(e) => setProfile({ ...profile, [key]: type === "number" ? Number(e.target.value) : e.target.value })}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
    );
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    if (!resumeName.trim()) {
      setUploadError("Please give this resume a name.");
      return;
    }
    if (file.type !== "application/pdf") {
      setUploadError("Only PDF files are supported.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const storage = getFirebaseStorage();
      const storagePath = `resumes/${Date.now()}-${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          reject,
          resolve
        );
      });

      const downloadUrl = await getDownloadURL(storageRef);

      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: resumeName.trim(), storagePath, downloadUrl }),
      });
      const created = await res.json() as ResumeItem;
      setResumes((prev) => [created, ...prev]);
      setResumeName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/resumes/${id}`, { method: "DELETE" });
    setResumes((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Resumes, cookies, and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload multiple PDF versions. The AI will pick the best one for each job and tailor its bullets.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Resume name (e.g. SWE Resume, Quant Resume)"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-2 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="text-sm text-muted-foreground file:mr-3 file:rounded file:border file:bg-muted file:px-3 file:py-1 file:text-xs"
              />
              <Button onClick={handleUpload} disabled={uploading} variant="secondary">
                {uploading ? `Uploading ${uploadProgress}%...` : "Upload"}
              </Button>
            </div>
            {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
          </div>

          {resumes.length === 0 && (
            <p className="text-xs text-muted-foreground">No resumes uploaded yet.</p>
          )}
          {resumes.length > 0 && (
            <div className="space-y-2">
              {resumes.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a href={r.downloadUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          <CardTitle>Relevance score threshold</CardTitle>
          <p className="text-sm text-muted-foreground">Default: 60. Jobs below this are hidden from the discovery feed.</p>
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
          <CardTitle>Profile Hub</CardTitle>
          <p className="text-sm text-muted-foreground">Your info used for relevance scoring, cover letters, and auto-apply.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!profile && <p className="text-xs text-muted-foreground">Loading...</p>}
          {profile && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {profileField("name", "Name")}
                {profileField("school", "School")}
                {profileField("major", "Major")}
                {profileField("gradYear", "Grad Year", "number")}
                {profileField("gpa", "GPA", "number")}
                {profileField("visaStatus", "Visa Status")}
              </div>
              {profileField("euCitizen", "EU Citizen", "checkbox")}

              {/* Target Roles */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Target Roles</p>
                <div className="flex flex-wrap gap-1">
                  {profile.targetRoles.map((r, i) => (
                    <span key={i} className="flex items-center gap-1 rounded border bg-muted px-2 py-0.5 text-xs">
                      {r}
                      <button onClick={() => setProfile({ ...profile, targetRoles: profile.targetRoles.filter((_, idx) => idx !== i) })} className="text-destructive">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input type="text" placeholder="Add role..." value={roleInput} onChange={(e) => setRoleInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && roleInput.trim()) { setProfile({ ...profile, targetRoles: [...profile.targetRoles, roleInput.trim()] }); setRoleInput(""); } }}
                    className="flex-1 rounded border bg-background px-2 py-1 text-xs" />
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                    onClick={() => { if (roleInput.trim()) { setProfile({ ...profile, targetRoles: [...profile.targetRoles, roleInput.trim()] }); setRoleInput(""); } }}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Keywords */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {profile.keywords.map((k, i) => (
                    <span key={i} className="flex items-center gap-1 rounded border bg-muted px-2 py-0.5 text-xs">
                      {k}
                      <button onClick={() => setProfile({ ...profile, keywords: profile.keywords.filter((_, idx) => idx !== i) })} className="text-destructive">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input type="text" placeholder="Add keyword..." value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && keywordInput.trim()) { setProfile({ ...profile, keywords: [...profile.keywords, keywordInput.trim()] }); setKeywordInput(""); } }}
                    className="flex-1 rounded border bg-background px-2 py-1 text-xs" />
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                    onClick={() => { if (keywordInput.trim()) { setProfile({ ...profile, keywords: [...profile.keywords, keywordInput.trim()] }); setKeywordInput(""); } }}>
                    Add
                  </Button>
                </div>
              </div>

              {/* Blacklist */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Visa Blacklist Phrases</p>
                <div className="flex flex-wrap gap-1">
                  {profile.blacklist.map((b, i) => (
                    <span key={i} className="flex items-center gap-1 rounded border bg-muted px-2 py-0.5 text-xs">
                      {b}
                      <button onClick={() => setProfile({ ...profile, blacklist: profile.blacklist.filter((_, idx) => idx !== i) })} className="text-destructive">✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input type="text" placeholder="Add phrase..." value={blacklistInput} onChange={(e) => setBlacklistInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && blacklistInput.trim()) { setProfile({ ...profile, blacklist: [...profile.blacklist, blacklistInput.trim()] }); setBlacklistInput(""); } }}
                    className="flex-1 rounded border bg-background px-2 py-1 text-xs" />
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                    onClick={() => { if (blacklistInput.trim()) { setProfile({ ...profile, blacklist: [...profile.blacklist, blacklistInput.trim()] }); setBlacklistInput(""); } }}>
                    Add
                  </Button>
                </div>
              </div>

              <Button onClick={saveProfile} disabled={profileSaving}>
                {profileSaved ? "Saved!" : profileSaving ? "Saving..." : "Save Profile"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
