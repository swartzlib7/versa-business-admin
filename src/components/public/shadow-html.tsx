"use client";

import { useEffect, useRef } from "react";
import { wireSignups } from "@/lib/client/signup";
import { THEME_HOST_ATTR, themeFamily } from "@/lib/ui-themes";
import { cn } from "@/lib/utils";

/** Space the fixed site header takes above a jump target. */
const HEADER_OFFSET = 104;

function jumpTo(shadow: ShadowRoot, id: string, smooth: boolean): boolean {
  const target = id ? shadow.getElementById(id) : null;
  if (!target) return false;
  const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  return true;
}

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

    // 1.0.19: the site's light or dark theme reaches the page (its `:root[data-theme]` rules
    // become `:host[data-theme]`), and follows the visitor's theme button.
    const html = document.documentElement;
    const applyTheme = () => host.setAttribute("data-theme", themeFamily(html.dataset.theme));
    applyTheme();
    const watch = new MutationObserver(applyTheme);
    watch.observe(html, { attributes: true, attributeFilter: ["data-theme"] });

    // 1.0.19: a "#id" link inside the page scrolls to that element (the browser cannot
    // find ids inside a shadow root on its own).
    const onClick = (event: Event) => {
      const link = event.composedPath().find((el): el is HTMLAnchorElement => el instanceof HTMLAnchorElement);
      const href = link?.getAttribute("href") ?? "";
      if (!href.startsWith("#") || href.length < 2) return;
      if (jumpTo(shadow, decodeURIComponent(href.slice(1)), true)) {
        event.preventDefault();
        history.replaceState(null, "", href);
      }
    };
    shadow.addEventListener("click", onClick);
    if (location.hash.length > 1) jumpTo(shadow, decodeURIComponent(location.hash.slice(1)), false);
    return () => {
      watch.disconnect();
      shadow.removeEventListener("click", onClick);
    };
  }, [root]);
  return (
    <>
      {sheets ? <div hidden dangerouslySetInnerHTML={{ __html: sheets }} /> : null}
      <div
        ref={ref}
        {...{ [THEME_HOST_ATTR]: "" }}
        className={cn("relative isolate z-0", className)}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: `<template shadowrootmode="open">${root}</template>` }}
      />
    </>
  );
}
