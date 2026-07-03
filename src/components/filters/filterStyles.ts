/**
 * filterStyles.ts — Canonical class strings for the entire filter UI.
 *
 * Every filter component (GlobalFilterBar, FilterShortcutBar, AdvancedFilterPanel,
 * SaleStatusFilter, ProjectFilters, ActiveFilterIndicator, etc.) must import these
 * tokens instead of hand-rolling colours. They are tuned for:
 *
 * • Emerald rail (#04241C / #03170F) with WHITE text at full opacity
 * • No gold borders anywhere — white / translucent white only
 * • Active state = solid emerald metallic + pure white label
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

// Inactive on light champagne surface
export const filterPillInactiveLight = [
  "bg-[#FDFBF7] border border-[#064E3B]/25 text-[#1A1A1A]",
  "hover:bg-[#F7F2EA] hover:border-[#064E3B]/45 hover:shadow-[0_4px_12px_rgba(6,78,59,0.14)]",
].join(" ");

// Inactive on dark emerald rail — pure white ink, white/18 border (NEVER gold)
export const filterPillInactiveDark = [
  "allow-white jj-pill-emerald-metallic border-0 text-white",
  "hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)]",
].join(" ");

// Active (filter has a value) — solid emerald metallic + white label
export const filterPillActive = [
  "allow-white jj-filter-emerald-control jj-pill-emerald-metallic text-white border-0 font-bold shadow-md",
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

export const togglePillOff = "border-[#064E3B]/25 text-[#1A1A1A] bg-[#FDFBF7] hover:bg-[#F7F2EA] hover:border-[#064E3B]/45";

export const togglePillOn = "allow-white jj-filter-emerald-control jj-chip-emerald text-white border-0 font-bold shadow-[0_8px_20px_rgba(6,78,59,0.24)]";

// Popover surface — same as Price/Handover (bright champagne, no faded ink)
export const filterPopoverSurface = "bg-[#FDFBF7] border border-[#064E3B]/25 shadow-xl z-[10200]";

// Inputs inside popovers — full-ink placeholder + label so nothing looks faded on champagne
export const filterInput = [
  "w-full h-9 px-3 bg-[#FDFBF7] border border-[#064E3B]/35 rounded-lg text-sm",
  "text-[#0A0A0A] placeholder:text-[#1A1A1A]/85",
  "focus:border-[#064E3B]/70 focus:outline-none focus:ring-0",
].join(" ");

export const filterLabel = "text-[10px] font-bold uppercase tracking-[0.12em] text-[#0A0A0A] mb-1 block";

export const filterHelpText = "text-xs text-[#1A1A1A]";

export const filterPrimaryButton = [
  "allow-white h-9 jj-pill-emerald-metallic text-white font-bold text-xs rounded-lg",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7]",
].join(" ");

export const filterSecondaryButton = [
  "h-9 px-3 text-xs rounded-lg border border-[#064E3B]/25 bg-[#FDFBF7] text-[#1A1A1A]",
  "hover:bg-[#F7F2EA] hover:border-[#064E3B]/45",
].join(" ");

export const filterCheckBox = "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors";
export const filterCheckBoxOn = "allow-white jj-filter-emerald-control jj-chip-emerald border-0";
export const filterCheckBoxOff = "border-[#064E3B]/30 bg-[#FDFBF7]";

// Search pill on emerald rail — single-layer, NO inset ring, NO double border
export const filterSearchPillWrapper = "allow-white jj-pill-emerald-metallic min-w-0 flex-shrink-0 flex items-center px-3 border-0 rounded-full shadow-none";
export const filterSearchPillInput = "w-full py-1.5 bg-transparent text-xs text-white placeholder:text-white/75 outline-none border-0 focus:outline-none focus:ring-0 focus:border-0";

export const activeChipBase = [
  "group inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full text-xs font-semibold",
  "bg-[#FDFBF7] border border-[#064E3B]/25 text-[#1A1A1A] hover:border-[#064E3B]/45",
].join(" ");
export const activeChipPrimary = "allow-white inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full jj-filter-emerald-control jj-chip-emerald text-white text-xs font-semibold";
export const activeChipDismissDot = "ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1A1A1A]/10 group-hover:bg-[#1A1A1A]/25 transition-colors";

export const filterDivider = "w-px h-5 bg-white/25 flex-shrink-0";

// Reset-all pill — emerald + white; NEVER gold; icon inherits white
export const resetAllPill = [
  "allow-white inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
  "jj-pill-emerald-metallic border-0 text-white shadow-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#03170F]",
  "transition-colors duration-75 flex-shrink-0 [&_svg]:text-white [&_svg]:opacity-100",
].join(" ");
