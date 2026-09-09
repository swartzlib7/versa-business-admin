"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { SubTabBar } from "@/components/ui/sub-tab-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useBrand } from "@/components/shell/brand-provider";

export default function ContactPage() {
  const brand = useBrand();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/public-content")
      .then((r) => r.json())
      .then((json) => {
        if (!json?.data) return;
        setEmail(json.data.contact_email ?? "");
        setPhone(json.data.contact_phone ?? "");
        setAddress(json.data.contact_address ?? "");
      })
      .catch(() => setError("Could not load contact details."));
  }, []);

  const persist = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/public-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_email: email,
          contact_phone: phone,
          contact_address: address,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        setError(payload?.error?.message ?? "Save failed.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-3">
        <PageHeader
          title="Contacts"
          subtitle="Public contact details shown on the visitor site."
          accent={brand.brand_color}
          tabs={[{ id: "contacts", label: "Contacts" }]}
          tabsValue="contacts"
          onTabChange={() => undefined}
          tabsAriaLabel="Contact sections"
        />
        <div role="tabpanel" className="space-y-3">
        <SubTabBar
          items={[{ id: "configuration", label: "Configuration" }]}
          activeId="configuration"
          accent={brand.brand_color}
          onSelect={() => undefined}
          ariaLabel="Contact sub-sections"
        />
        <Card className="min-h-[640px] overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Public contact details shown on the visitor site. These fields appear in the homepage contact section and footer.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Address</span>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="button"
              onClick={() => void persist()}
              disabled={saving}
              style={{ backgroundColor: brand.brand_color }}
              className="text-white"
            >
              {saved ? "Saved" : saving ? "Saving…" : "Save"}
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    </AppShell>
  );
}
