"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useBrand, BrandMark } from "@/components/shell/brand-provider";
import { ArrowRight, ExternalLink, Lock, Mail, TriangleAlert } from "lucide-react";

type Challenge = {
  nonce: string;
  issued: number;
  difficulty: number;
  sig: string;
};

export type InstallHintAccount = {
  name: string;
  email: string;
  password: string;
};

export type InstallHints = {
  human: InstallHintAccount;
  agent: InstallHintAccount;
};

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function solveChallenge(challenge: Challenge): Promise<number> {
  const prefix = "0".repeat(challenge.difficulty);
  let n = 0;
  while (true) {
    const hash = await sha256Hex(`${challenge.nonce}:${n}`);
    if (hash.startsWith(prefix)) return n;
    n += 1;
    if (n % 250 === 0) await new Promise((r) => setTimeout(r, 0));
  }
}

export function LoginForm({ installHints }: { installHints: InstallHints | null }) {
  const brand = useBrand();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const demo = installHints != null;

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) router.push(redirect);
      })
      .catch(() => {});
  }, [router, redirect]);

  useEffect(() => {
    fetch("/api/auth/challenge")
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setChallenge(json.data as Challenge);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let token = challenge;
      if (!token) {
        const issued = await fetch("/api/auth/challenge").then((r) => r.json());
        token = (issued?.data as Challenge | undefined) ?? null;
      }
      if (!token) {
        setError("Could not start login verification. Refresh and try again.");
        setLoading(false);
        return;
      }
      const solution = await solveChallenge(token);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          email,
          password,
          challenge: { ...token, solution },
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error?.message || "Login failed.");
        setLoading(false);
        const next = await fetch("/api/auth/challenge").then((r) => r.json()).catch(() => null);
        if (next?.data) setChallenge(next.data as Challenge);
        return;
      }

      window.location.assign(redirect);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <BrandMark size="md" className="rounded-xl text-lg" />
          <h1 className="text-2xl font-bold tracking-tight">
            {brand.brand_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to Versa - Business Admin
          </p>
        </div>

        {demo && (
          <div
            role="alert"
            className="flex gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm"
          >
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>
              First backend login: change the <span className="font-medium">Administrator</span> (human)
              and <span className="font-medium">COA</span> (agent) passwords. Default install
              passwords are only for setup.
            </p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying…" : "Sign In"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            {installHints && (
              <div className="mt-4 rounded-md border border-dashed border-muted p-3">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Install accounts (demo mode):</span>
                  <br />
                  {installHints.human.name} (human): {installHints.human.email} / {installHints.human.password}
                  <br />
                  {installHints.agent.name} (agent): {installHints.agent.email} / {installHints.agent.password}
                  <br />
                  Passwords may have been changed.
                  <br />
                  Member logins appear after Settings → Modes → Insert Sample Data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Open home page
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}
