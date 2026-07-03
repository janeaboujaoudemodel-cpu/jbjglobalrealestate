/**
 * filterStyles.ts — Canonical class strings for the entire filter UI.
 *
 * Every filter component (GlobalFilterBar, FilterShortcutBar, AdvancedFilterPanel,
 * SaleStatusFilter, ProjectFilters, ActiveFilterIndicator, etc.) must import these
 * tokens instead of hand-rolling colours. They are tuned for:
 *
 * • Emerald rail / dropdowns (#064E3B → #042C1C → #010806) with WHITE text at full opacity
 * • No gold borders, no champagne dropdowns, no faded labels
 * • Every filter label/pill = emerald metallic + pure white label
 * • Instant open/close (transitions ≤ 75ms; popover animations disabled elsewhere)
 */

// Pill / chip trigger (filter buttons, sort buttons, map toggle, etc.)
export const filterPillBase = [
  "inline-flex !w-auto min-w-0 items-center justify-center gap-1.5 px-3.5 md:px-5 py-1.5 md:py-2",
  "rounded-full text-xs md:text-[13px] font-semibold whitespace-nowrap select-none",
  "overflow-hidden text-ellipsis max-w-[220px] flex-shrink-0 touch-manipulation",
  "transition-[background-color,border-color,box-shadow,color] duration-75 cursor-pointer",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#03170F]",
].join(" ");

// Inactive on light surfaces — still emerald metallic; never champagne/gold.
export const filterPillInactiveLight = [
  "allow-white jj-pill-emerald-metallic border-0 text-white",
  "hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)]",
].join(" ");

// Inactive on dark emerald rail — pure white ink, white/18 border (NEVER gold)
export const filterPillInactiveDark = [
  "allow-white jj-pill-emerald-metallic border-0 text-white",
  "hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)]",
].join(" ");

// Active (filter has a value) — solid emerald metallic + white label
export const filterPillActive = [
  "allow-white jj-pill-emerald-metallic text-white border-0 font-bold shadow-md",
  "hover:shadow-[0_10px_24px_rgba(6,78,59,0.28)]",
].join(" ");

export function pillInactive(variant: "light" | "dark" = "light") {
  return variant === "dark" ? filterPillInactiveDark : filterPillInactiveLight;
}

// Toggle pill inside popovers
export const togglePillBase = [
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
  "border transition-colors duration-75 cursor-pointer",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/45 focus-visible:ring-offset-1 focus-visible:ring-offset-[#FDFBF7]",
].join(" ");

export const togglePillOff = "allow-white border-white/28 text-white bg-white/7 hover:bg-white/14 hover:border-white/45";

export const togglePillOn = "allow-white jj-pill-emerald-metallic text-white border-0 font-bold shadow-[0_8px_20px_rgba(6,78,59,0.24)]";

// Popover surface — dark emerald/black only; no champagne/gold surfaces.
export const filterPopoverSurface = "allow-white bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/24 text-white shadow-[0_18px_50px_rgba(0,0,0,0.48),0_0_28px_rgba(6,78,59,0.24)] z-[10200]";

// Inputs inside popovers — full white placeholder + label so nothing looks faded.
export const filterInput = [
  "allow-white w-full h-9 px-3 bg-[#021611]/82 border border-white/28 rounded-lg text-sm",
  "text-white placeholder:text-white",
  "focus:border-white/60 focus:outline-none focus:ring-0",
].join(" ");

export const filterLabel = "allow-white text-[10px] font-bold uppercase tracking-[0.12em] text-white mb-1 block";

export const filterHelpText = "allow-white text-xs text-white";

export const filterPrimaryButton = [
  "allow-white h-9 jj-pill-emerald-metallic text-white font-bold text-xs rounded-lg",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7]",
].join(" ");

export const filterSecondaryButton = [
  "allow-white h-9 px-3 text-xs rounded-lg border border-white/28 bg-white/7 text-white",
  "hover:bg-white/14 hover:border-white/45",
].join(" ");

export const filterCheckBox = "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors";
export const filterCheckBoxOn = "allow-white jj-pill-emerald-metallic border-0";
export const filterCheckBoxOff = "border-white/35 bg-white/7";

// Search pill on emerald rail — single-layer, NO inset ring, NO double border
export const filterSearchPillWrapper = "allow-white jj-pill-emerald-metallic min-w-0 flex-shrink-0 flex items-center px-3 border-0 rounded-full shadow-none";
export const filterSearchPillInput = "filter-search-pill-input allow-white w-full py-1.5 bg-transparent text-xs text-white placeholder:text-white outline-none border-0 focus:outline-none focus:ring-0 focus:border-0";

export const activeChipBase = [
  "group inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full text-xs font-semibold",
  "allow-white jj-pill-emerald-metallic border-0 text-white",
].join(" ");
export const activeChipPrimary = "allow-white inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full jj-pill-emerald-metallic text-white text-xs font-semibold";
export const activeChipDismissDot = "ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1A1A1A]/10 group-hover:bg-[#1A1A1A]/25 transition-colors";

export const filterDivider = "w-px h-5 bg-white/25 flex-shrink-0";

// Reset-all pill — emerald + white; NEVER gold; icon inherits white
export const resetAllPill = [
  "allow-white inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
  "jj-pill-emerald-metallic border-0 text-white shadow-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#03170F]",
  "transition-colors duration-75 flex-shrink-0 [&_svg]:text-white [&_svg]:opacity-100",
].join(" ");
