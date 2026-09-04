"use client";

import { useState } from "react";
import { GlossaryBookView, OrgBoardView } from "@/components/glossary/glossary-views";
import { INITIAL_ENTRIES, INITIAL_SECTIONS } from "@/lib/fixtures/glossary-terms";
import { useBrand } from "@/components/shell/brand-provider";
import { theme } from "@/lib/theme";

export function PublicGlossaryBook() {
  const brand = useBrand();
  const accent = brand.brand_color || theme.colors.brand;
  const [activeSectionId, setActiveSectionId] = useState("");
  return (
    <GlossaryBookView
      accent={accent}
      sections={INITIAL_SECTIONS}
      entries={INITIAL_ENTRIES}
      activeSectionId={activeSectionId}
      onSectionChange={setActiveSectionId}
    />
  );
}

export function PublicOrgBoard() {
  const brand = useBrand();
  const accent = brand.brand_color || theme.colors.brand;
  return <OrgBoardView accent={accent} />;
}
