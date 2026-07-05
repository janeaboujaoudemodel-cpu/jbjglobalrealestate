/**
 * filterStyles.ts — Canonical class strings for the entire filter UI.
 *
 * DESIGN CONTRACT (site-wide dropdown standard, matches User Account menu):
 *   • Surface = champagne gradient (#FDFBF7 → #F7F2EA → #F2EBDC) with #B89555 gold hairline
 *   • Ink text on champagne = #1A1A1A (pure black), icons inherit ink
 *   • Emerald metallic (#064E3B) reserved for ACTIVE state and hover accent
 *   • White text ONLY when a chip/pill is in its emerald-filled active/hover state
 *   • AI Tools scope is explicitly excluded from these tokens.
 */

// ── PILL / CHIP TRIGGERS ──────────────────────────────────────────────────
export const filterPillBase = [
  "inline-flex !w-auto min-w-0 items-center justify-center gap-1.5 px-3.5 md:px-5 py-1.5 md:py-2",
  "rounded-full text-xs md:text-[13px] font-semibold whitespace-nowrap select-none",
  "overflow-hidden text-ellipsis max-w-[220px] flex-shrink-0 touch-manipulation",
  "transition-[background-color,border-color,box-shadow,color] duration-100 cursor-pointer",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7]",
].join(" ");

// Inactive pill (default) — champagne surface, ink text, gold hairline, emerald hover accent
const _pillInactive = [
  "jj-pill-emerald-metallic allow-white text-white border-0",
  "hover:shadow-[0_10px_24px_rgba(6,78,59,0.28)]",
].join(" ");

export const filterPillInactiveLight = _pillInactive;
export const filterPillInactiveDark = _pillInactive;

// Active pill — solid emerald metallic with pure white label
export const filterPillActive = [
  "jj-pill-emerald-metallic text-white border-0 font-bold shadow-md allow-white",
  "hover:shadow-[0_10px_24px_rgba(6,78,59,0.28)]",
].join(" ");

export function pillInactive(_variant: "light" | "dark" = "light") {
  return _pillInactive;
}

// ── TOGGLE PILLS INSIDE POPOVERS ──────────────────────────────────────────
export const togglePillBase = [
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
  "border transition-colors duration-100 cursor-pointer",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/45 focus-visible:ring-offset-1 focus-visible:ring-offset-[#FDFBF7]",
].join(" ");

export const togglePillOff = "border-[#B89555]/45 text-[#1A1A1A] bg-white hover:border-[#064E3B]/55";

export const togglePillOn = "jj-pill-emerald-metallic text-white border-0 font-bold shadow-[0_8px_20px_rgba(6,78,59,0.24)] allow-white";

// ── POPOVER / DIALOG SURFACE ──────────────────────────────────────────────
// Champagne surface with gold hairline, matching the user-account dropdown.
export const filterPopoverSurface = [
  "bg-gradient-to-b from-[#FDFBF7] via-[#F7F2EA] to-[#F2EBDC]",
  "border border-[#B89555]/55 text-[#1A1A1A]",
  "shadow-[0_18px_50px_rgba(0,0,0,0.14),0_2px_8px_rgba(184,149,85,0.18)] z-[10200]",
].join(" ");

// ── INPUTS ────────────────────────────────────────────────────────────────
export const filterInput = [
  "w-full h-9 px-3 bg-white border border-[#B89555]/50 rounded-lg text-sm",
  "text-[#1A1A1A] placeholder:text-[#1A1A1A]/50",
  "focus:border-[#064E3B] focus:outline-none focus:ring-2 focus:ring-[#064E3B]/25",
].join(" ");

export const filterLabel = "text-[10px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A] mb-1 block";

export const filterHelpText = "text-xs text-[#1A1A1A]/70";

// ── ACTION BUTTONS ────────────────────────────────────────────────────────
export const filterPrimaryButton = [
  "h-9 jj-pill-emerald-metallic text-white font-bold text-xs rounded-lg allow-white",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7]",
].join(" ");

export const filterSecondaryButton = [
  "h-9 px-3 text-xs rounded-lg border border-[#B89555]/50 bg-white text-[#1A1A1A]",
  "hover:border-[#064E3B]/55",
].join(" ");

// ── CHECKBOX ──────────────────────────────────────────────────────────────
export const filterCheckBox = "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors";
export const filterCheckBoxOn = "jj-pill-emerald-metallic border-0 allow-white";
export const filterCheckBoxOff = "border-[#B89555]/55 bg-white";

// ── SEARCH PILL (on champagne / light rail) ───────────────────────────────
export const filterSearchPillWrapper = "min-w-0 flex-shrink-0 flex items-center px-3 rounded-full bg-white border border-[#B89555]/50 shadow-sm";
export const filterSearchPillInput = "filter-search-pill-input w-full py-1.5 bg-transparent text-xs text-[#1A1A1A] placeholder:text-[#1A1A1A]/55 outline-none border-0 focus:outline-none focus:ring-0";

// ── ACTIVE FILTER CHIPS (already-applied filter tags) ─────────────────────
export const activeChipBase = [
  "group inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full text-xs font-semibold",
  "jj-pill-emerald-metallic border-0 text-white allow-white",
].join(" ");
export const activeChipPrimary = "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full jj-pill-emerald-metallic text-white text-xs font-semibold allow-white";
export const activeChipDismissDot = "ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20 group-hover:bg-white/35 transition-colors";

export const filterDivider = "w-px h-5 bg-[#B89555]/40 flex-shrink-0";

// ── RESET-ALL PILL ────────────────────────────────────────────────────────
export const resetAllPill = [
  "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
  "border border-[#B89555]/50 bg-white text-[#1A1A1A] shadow-none",
  "hover:border-[#064E3B]/55",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7]",
  "transition-colors duration-100 flex-shrink-0 [&_svg]:text-[#1A1A1A] [&_svg]:opacity-100",
].join(" ");
