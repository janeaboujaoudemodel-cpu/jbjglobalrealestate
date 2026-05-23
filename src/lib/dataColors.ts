/**
 * GLOBAL SEMANTIC DATA COLOR MAP
 * Single source of truth for all charts, metrics, and data visualizations.
 * 
 * RULES:
 * - Gray is FORBIDDEN for any data value, metric label, or chart element
 * - Positive = emerald, Negative/Issue = red (always)
 * - Each data category MUST use a distinct semantic color
 */

export const DATA_COLORS = Object.freeze({
  // Transaction types — premium semantic palette
  // Off-plan = emerald growth, Secondary = deep red, Cash = sky blue, Mortgage = champagne gold
  offPlan:    { text: 'text-emerald-700', bg: 'bg-emerald-600', gradient: 'from-emerald-600 to-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-300', dot: 'bg-emerald-600' },
  secondary:  { text: 'text-red-700',     bg: 'bg-red-700',     gradient: 'from-red-700 to-red-600',         light: 'bg-red-50',     border: 'border-red-300',     dot: 'bg-red-700' },
  cash:       { text: 'text-sky-700',     bg: 'bg-sky-500',     gradient: 'from-sky-500 to-sky-400',         light: 'bg-sky-50',     border: 'border-sky-300',     dot: 'bg-sky-500' },
  mortgage:   { text: 'text-[#8a6a2a]',   bg: 'bg-[#B89555]',   gradient: 'from-[#D8C28F] to-[#B89555]',     light: 'bg-[#F7F2EA]',  border: 'border-[#B89555]',   dot: 'bg-[#B89555]' },

  // Metrics
  growth:     { text: 'text-emerald-600', bg: 'bg-emerald-500' },
  decline:    { text: 'text-red-600',     bg: 'bg-red-500' },
  issue:      { text: 'text-red-600',     bg: 'bg-red-100',     border: 'border-red-300' },
  
  // Investment
  roi:        { text: 'text-emerald-600', bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-300', ring: 'ring-emerald-200' },
  yield:      { text: 'text-blue-600',    bg: 'bg-blue-500',    light: 'bg-blue-50',    border: 'border-blue-300',    ring: 'ring-blue-200' },
  rental:     { text: 'text-blue-500',    bg: 'bg-blue-500',    light: 'bg-blue-50',    border: 'border-blue-300',    ring: 'ring-blue-200' },
  price:      { text: 'text-emerald-700', bg: 'bg-emerald-500' },
  volume:     { text: 'text-purple-600',  bg: 'bg-purple-500' },

  // Property types
  villa:      { text: 'text-emerald-600', dot: 'bg-emerald-500' },
  apartment:  { text: 'text-blue-600',    dot: 'bg-blue-500' },
  townhouse:  { text: 'text-amber-600',   dot: 'bg-amber-500' },
  land:       { text: 'text-purple-600',  dot: 'bg-purple-500' },
  penthouse:  { text: 'text-rose-600',    dot: 'bg-rose-500' },

  // Activity levels
  active:     { text: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-400' },
  moderate:   { text: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-400' },
  balanced:   { text: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-400' },
  stable:     { text: 'text-blue-500' },

  // Supply/Demand
  supply:     { text: 'text-blue-700',    bg: 'bg-blue-500',    gradient: 'from-blue-500 to-blue-400',    light: 'bg-blue-100' },
  demand:     { text: 'text-emerald-700', bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-400', light: 'bg-emerald-100' },
});

/** Get property type color by name */
export function getPropertyTypeColor(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes('villa')) return DATA_COLORS.villa;
  if (lower.includes('apartment')) return DATA_COLORS.apartment;
  if (lower.includes('townhouse')) return DATA_COLORS.townhouse;
  if (lower.includes('land') || lower.includes('plot')) return DATA_COLORS.land;
  if (lower.includes('penthouse')) return DATA_COLORS.penthouse;
  return DATA_COLORS.apartment; // default
}
