"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface SiteMode {
  demo_mode: boolean;
  maintenance_mode: boolean;
  public_login_enabled: boolean;
  glossary_in_menu: boolean;
  org_board_enabled: boolean;
}

const DEFAULT_MODE: SiteMode = {
  demo_mode: true,
  maintenance_mode: false,
  public_login_enabled: true,
  glossary_in_menu: true,
  org_board_enabled: true,
};

const SiteModeContext = createContext<SiteMode>(DEFAULT_MODE);

export function SiteModeProvider({
  mode,
  children,
}: {
  mode: SiteMode;
  children: ReactNode;
}) {
  return (
    <SiteModeContext.Provider value={mode}>{children}</SiteModeContext.Provider>
  );
}

export function useSiteMode(): SiteMode {
  return useContext(SiteModeContext);
}
