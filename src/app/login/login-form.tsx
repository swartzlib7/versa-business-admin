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

// Pure-JS SHA-256 fallback for insecure contexts (plain-HTTP LAN access from
// phones/tablets), where crypto.subtle is undefined and the proof-of-work
// solver would otherwise throw. Output matches WebCrypto SHA-256 exactly.
function sha256Bytes(bytes: Uint8Array): Uint8Array {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H0 = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const l = bytes.length;
  const bitLenHi = Math.floor(l / 0x20000000);
  const bitLenLo = (l << 3) >>> 0;
  const padded = new Uint8Array((((l + 8) >> 6) + 1) << 6);
  padded.set(bytes);
  padded[l] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, bitLenHi);
  dv.setUint32(padded.length - 4, bitLenLo);
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  let h0 = H0[0], h1 = H0[1], h2 = H0[2], h3 = H0[3];
  let h4 = H0[4], h5 = H0[5], h6 = H0[6], h7 = H0[7];
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0;
      d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  const out = new Uint8Array(32);
  const odv = new DataView(out.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((v, i) => odv.setUint32(i * 4, v));
  return out;
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  if (typeof crypto !== "undefined" && crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return Array.from(sha256Bytes(data))
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
      let solution: number;
      try {
        solution = await solveChallenge(token);
      } catch {
        setError(
          "Login verification is not available in this browser context. Open the admin over HTTPS or localhost."
        );
        setLoading(false);
        return;
      }
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
