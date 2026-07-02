/**
 * filterStyles.ts — Canonical class strings for the entire filter UI.
 *
 * Every filter component (GlobalFilterBar, FilterShortcutBar, AdvancedFilterPanel,
 * SaleStatusFilter, ProjectFilters, ActiveFilterIndicator, etc.) must import these
 * tokens instead of hand-rolling colours. They are tuned for:
 *
 * • Champagne page (#FDFBF7) and surface (#F7F2EA, #EFE6D6) backgrounds
 * • Emerald controls on dark filter rails; no gold outlines on shortcut filters
 * • WCAG AA contrast on every label, icon and placeholder
 * • Consistent active state across every trigger (solid ink + white text + gold ring)
 *
 * Faded gold (`text-[#1A1A1A]/XX`) is forbidden site-wide — see the Faded Gold Prohibition
 * memory. We only fade ink (`text-[#1A1A1A]/70`) for secondary copy, never below /70.
 */

// Pill / chip trigger (filter buttons, sort buttons, map toggle, etc.)
// NOTE: hover lift via transform is BANNED here — these pills sit inside a
// horizontally-scrolling row with overflow clipping, so any translate-y crops
// the top border. We use shadow-only hover for the 3D feel instead.
export const filterPillBase =
  "inline-flex !w-auto min-w-0 items-center justify-center gap-1.5 px-3.5 md:px-5 py-1.5 md:py-2 " +
  "rounded-full text-xs md:text-[13px] font-semibold whitespace-nowrap select-none " +
  "overflow-hidden text-ellipsis max-w-[220px] flex-shrink-0 touch-manipulation " +
  "transition-[background-color,border-color,box-shadow,color] duration-75 cursor-pointer " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#03170F]";


// Inactive (no value selected). Clean emerald/champagne contrast with no gold border.
export const filterPillInactiveLight ="bg-[#FDFBF7] border border-[#064E3B]/20 text-[#1A1A1A]" +"hover:bg-[#F7F2EA] hover:border-[#064E3B]/35 hover:shadow-[0_4px_12px_rgba(6,78,59,0.14)]";

// Inactive on a dark surface: emerald, white text, no gold border.
export const filterPillInactiveDark ="allow-white bg-[#04241C] border border-white/18 text-white" +"hover:bg-[#064E3B] hover:border-white/28 hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)]";

// Active (filter has a value). Solid ink, white label — the only state that uses
// white text. Gold ring marks it as the brand-active state without harming contrast.
export const filterPillActive ="allow-white jj-filter-emerald-control jj-pill-emerald-metallic text-white border-0 font-bold shadow-md" +"hover:shadow-[0_10px_24px_rgba(6,78,59,0.28)]";

// Helper: pick the right inactive variant based on surrounding surface
export function pillInactive(variant:"light" |"dark" ="light") {
 return variant ==="dark" ? filterPillInactiveDark : filterPillInactiveLight;
}


// Toggle pill inside popovers (bedrooms, statuses, views, …)
export const togglePillBase ="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" +"border transition-colors duration-75 cursor-pointer" +"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/45 focus-visible:ring-offset-1 focus-visible:ring-offset-[#FDFBF7]";

export const togglePillOff ="border-[#064E3B]/20 text-[#1A1A1A] bg-[#FDFBF7] hover:bg-[#F7F2EA] hover:border-[#064E3B]/35";

export const togglePillOn ="allow-white jj-filter-emerald-control jj-chip-emerald text-white border-0 font-bold shadow-[0_8px_20px_rgba(6,78,59,0.24)]";

// Popover surface
export const filterPopoverSurface ="bg-[#FDFBF7] border border-[#064E3B]/20 shadow-xl z-[10200]";

// Inputs inside popovers / panels
export const filterInput ="w-full h-9 px-3 bg-[#FDFBF7] border border-[#064E3B]/20 rounded-lg text-sm" +"text-[#1A1A1A] placeholder:text-[#1A1A1A]/70" +"focus:border-[#064E3B]/45 focus:outline-none focus:ring-0";

// Labels above fields — ink at /70 keeps AA on champagne
export const filterLabel ="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1A1A1A]/70 mb-1 block";

// Helper text / secondary caption — same /70 floor
export const filterHelpText ="text-xs text-[#1A1A1A]/70";

// Primary"Apply"-style button inside popovers
export const filterPrimaryButton ="allow-white h-9 jj-pill-emerald-metallic text-white font-bold text-xs rounded-lg" +"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7]";

//"Reset" / secondary outline button inside popovers
export const filterSecondaryButton ="h-9 px-3 text-xs rounded-lg border border-[#064E3B]/20 bg-[#FDFBF7] text-[#1A1A1A]" +"hover:bg-[#F7F2EA] hover:border-[#064E3B]/35";

// Checkbox box (used inside panel rows). Ink/gold instead of bg-[#EFE6D6]/20.
export const filterCheckBox ="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors";
export const filterCheckBoxOn ="allow-white jj-filter-emerald-control jj-chip-emerald border-0";
export const filterCheckBoxOff ="border-[#064E3B]/25 bg-[#FDFBF7]";

// Search input wrapper (pill-shaped row in shortcut bar)
export const filterSearchPillWrapper ="allow-white min-w-0 flex-shrink-0 flex items-center px-3 border-0 rounded-full bg-[#04241C] shadow-none";
export const filterSearchPillInput ="w-full py-1.5 bg-transparent text-xs text-white placeholder:text-white/72 outline-none";

// Active-filter chip in summary rows (ActiveFilterIndicator and similar)
export const activeChipBase ="group inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full text-xs font-semibold" +"bg-[#FDFBF7] border border-[#064E3B]/20 text-[#1A1A1A] hover:border-[#064E3B]/35";
export const activeChipPrimary ="allow-white inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full jj-filter-emerald-control jj-chip-emerald text-white text-xs font-semibold";
export const activeChipDismissDot ="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1A1A1A]/10 group-hover:bg-[#1A1A1A]/25 transition-colors";

// Section dividers between groups of pills in the shortcut bar
export const filterDivider ="w-px h-5 bg-white/18 flex-shrink-0";

//"Reset all" pill: emerald + white only; no faded champagne/gold/black icon.
export const resetAllPill ="allow-white inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold" +"bg-[#04241C] border-0 text-white hover:bg-[#064E3B] shadow-none" +"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#03170F]" +"transition-colors duration-75 flex-shrink-0 [&_svg]:text-white";
