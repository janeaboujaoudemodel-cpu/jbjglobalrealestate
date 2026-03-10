/**
 * Standardized z-index scale for the entire application.
 * All z-index values should reference these constants.
 *
 * Scale (ascending):
 *   base        0      – Normal document flow
 *   dropdown   100      – Dropdowns, tooltips, popovers
 *   sticky     200      – Sticky headers, floating bars
 *   sidebar   9997      – Vertical nav sidebar
 *   header    9998      – Global header
 *   megaMenu 10000      – Mega-menu flyouts
 *   dialog   10050      – Dialogs, modals, sheets
 *   overlay  10100      – Full-screen overlays, drawers
 *   toast    10200      – Toast notifications
 *   devTools 99999      – Dev/debug overlays
 */

export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  sidebar: 9997,
  header: 9998,
  megaMenu: 10000,
  dialog: 10050,
  overlay: 10100,
  toast: 10200,
  devTools: 99999,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
