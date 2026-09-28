"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ConfirmEmail() {
  const token = useSearchParams().get("token") ?? "";
  const [message, setMessage] = useState("Confirming…");

  useEffect(() => {
    if (!token) {
      setMessage("This confirmation link is invalid or has expired.");
      return;
    }
    fetch("/api/auth/confirm-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        setMessage(res.ok ? `Email updated to ${json?.data?.email}.` : (json?.error?.message || "This confirmation link is invalid or has expired."));
      })
      .catch(() => setMessage("This confirmation link is invalid or has expired."));
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card size="hug" className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirm email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{message}</p>
          <a href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</a>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmail />
    </Suspense>
  );
}
