"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { solveChallenge, type Challenge } from "@/lib/client/proof-of-work";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    fetch("/api/auth/challenge")
      .then((r) => r.json())
      .then((json) => { if (json?.data) setChallenge(json.data as Challenge); })
      .catch(() => {});
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNote("");
    setLoading(true);
    try {
      let token = challenge;
      if (!token) {
        const issued = await fetch("/api/auth/challenge").then((r) => r.json());
        token = (issued?.data as Challenge | undefined) ?? null;
      }
      if (!token) {
        setError("Could not start verification. Refresh and try again.");
        return;
      }
      const solution = await solveChallenge(token);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, challenge: { ...token, solution } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.error?.message || "Could not send the reset link.");
        return;
      }
      setNote(json?.data?.message || "If that email has an account, a reset link is on its way.");
    } catch {
      setError("Could not send the reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card size="hug" className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void submit(event)}>
            <p className="text-sm text-muted-foreground">
              Password reset sends a link only after the system mailbox is active in Settings → E-Mail Delivery.
            </p>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" autoComplete="email" />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
            <a href="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">Back to sign in</a>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
