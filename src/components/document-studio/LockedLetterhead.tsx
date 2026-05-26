/**
 * Locked premium letterhead + footer rendered as React components.
 * Wide layout (never collapses into vertical single-column text like
 * the raw HTML string version did inside narrow flex children).
 */

import { Lock } from "lucide-react";
import { JBJ_BRAND } from "@/templates/jbjLockedChrome";

export function LockedLetterhead() {
  return (
    <header
      className="relative w-full border-b border-[#B89555] bg-[#F7F2EA] px-10 py-6"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/60 m-0">
            {JBJ_BRAND.shortName}
          </p>
          <p className="text-[18px] font-semibold text-[#1A1A1A] mt-1 leading-tight whitespace-nowrap">
            {JBJ_BRAND.legalName}
          </p>
        </div>
        <div className="text-right text-[11px] leading-[1.5] text-[#1A1A1A]/70 shrink-0">
          <div>{JBJ_BRAND.address}</div>
          <div>
            {JBJ_BRAND.email} · {JBJ_BRAND.website}
          </div>
        </div>
      </div>
      <div className="absolute left-3 -bottom-2 translate-y-full flex items-center gap-1 text-[10px] text-[#1A1A1A]/55 pointer-events-none">
        <Lock className="w-3 h-3" /> Locked letterhead
      </div>
    </header>
  );
}

export function LockedFooter() {
  return (
    <footer
      className="w-full border-t border-[#B89555] bg-[#F7F2EA] px-10 py-4 mt-8 text-center text-[10px] leading-[1.6] text-[#1A1A1A]/70"
      style={{ fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <div className="uppercase tracking-[0.18em] mb-1">{JBJ_BRAND.shortName}</div>
      <div>
        {JBJ_BRAND.address} · {JBJ_BRAND.phone} · {JBJ_BRAND.email}
      </div>
      <div className="mt-1 opacity-70">
        This document is issued by {JBJ_BRAND.legalName} and is confidential.
      </div>
    </footer>
  );
}
