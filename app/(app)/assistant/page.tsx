"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MOCK_MESSAGES: { role: "assistant" | "user"; text: string }[] = [
  { role: "assistant", text: "Hi! I can help you draft cover letters, find deadlines, match roles to your background, and summarize what you need to do today. What would you like to do?" },
];

export default function AssistantPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  function send() {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: "user" as const, text: input.trim() }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "assistant" as const,
          text: "I have access to your jobs, applications, and profile. This is a placeholder response; wire me to an API that uses GPT with full database context for real answers.",
        },
      ]);
    }, 500);
  }

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-0px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
        <p className="text-muted-foreground">
          Ask: &quot;draft a cover letter for this Jane Street role&quot;, &quot;which saved jobs have a deadline this week&quot;, etc.
        </p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.role === "user" ? "text-right" : "text-left"}
              >
                <span
                  className={
                    msg.role === "user"
                      ? "inline-block rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm"
                      : "inline-block rounded-lg bg-muted px-3 py-2 text-sm"
                  }
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask anything about your applications..."
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button onClick={send}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
