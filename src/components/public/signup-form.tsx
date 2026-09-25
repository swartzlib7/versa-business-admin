"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { submitSignup } from "@/lib/client/signup";

/** Visitor email sign-up. Saves a public Contact through POST /api/public/subscribe. */
export function SignupForm() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setState("sending");
    const result = await submitSignup(email, website, pathname);
    if (result.ok) {
      setState("done");
      return;
    }
    setError(result.message);
    setState("idle");
  };

  if (state === "done") {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-center font-mono text-sm text-primary">You are on the list. We will be in touch.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center">
      <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          aria-label="Email"
          className="w-full rounded-md border border-primary/60 bg-background/70 px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="w-full rounded-md bg-primary px-4 py-3 font-mono text-sm font-bold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
        >
          {state === "sending" ? "Sending…" : "Stay updated"}
        </button>
        {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
      </form>
    </div>
  );
}
