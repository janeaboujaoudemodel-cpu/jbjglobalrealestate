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
  // Transaction types
  offPlan:    { text: 'text-emerald-600', bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-emerald-400', light: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  secondary:  { text: 'text-red-600',     bg: 'bg-red-500',     gradient: 'from-red-400 to-red-500',       light: 'bg-red-50',     border: 'border-red-200',     dot: 'bg-red-500' },
  cash:       { text: 'text-blue-600',    bg: 'bg-blue-500',    gradient: 'from-blue-500 to-blue-400',     light: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  mortgage:   { text: 'text-amber-600',   bg: 'bg-amber-500',   gradient: 'from-amber-400 to-amber-500',   light: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500' },

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
