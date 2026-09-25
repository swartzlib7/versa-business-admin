"use client";

import { useEffect, useRef } from "react";
import { wireSignups } from "@/lib/client/signup";
import { cn } from "@/lib/utils";

/**
 * Isolated HTML. The first page load parses the declarative shadow root; a client
 * navigation does not, so the effect attaches the root itself. The host is its own
 * stacking context, so a record's z-index never paints over the site header.
 */
export function ShadowHtml({
  root,
  sheets,
  className,
}: {
  root: string;
  sheets?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
    shadow.innerHTML = root;
    host.querySelector(":scope > template")?.remove();
    wireSignups(shadow);
  }, [root]);
  return (
    <>
      {sheets ? <div hidden dangerouslySetInnerHTML={{ __html: sheets }} /> : null}
      <div
        ref={ref}
        className={cn("relative isolate z-0", className)}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: `<template shadowrootmode="open">${root}</template>` }}
      />
    </>
  );
}
