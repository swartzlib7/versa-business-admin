"use client";

import { useEffect } from "react";

/** Each visitor page states its own sky. The root sky is shared across navigations. */
export function CanvasSkyFlag({ on }: { on: boolean }) {
  useEffect(() => {
    const root = document.documentElement;
    if (on) root.removeAttribute("data-sky-off");
    else root.setAttribute("data-sky-off", "");
    return () => root.removeAttribute("data-sky-off");
  }, [on]);
  return null;
}
