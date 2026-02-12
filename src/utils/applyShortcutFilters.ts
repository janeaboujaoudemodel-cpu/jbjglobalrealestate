import type { ShortcutFilterState } from "@/components/filters/FilterShortcutBar";

/**
 * Apply ShortcutFilterState to any project array.
 * Works as a post-filter on top of existing filtering pipelines.
 */
export function applyShortcutFilters<T extends Record<string, any>>(
  projects: T[],
  sf: ShortcutFilterState
): T[] {
  let result = [...projects];

  // Hide Sold Out
  if (sf.hideSoldOut) {
    result = result.filter(p => {
      const label = (p.status_label || p.sale_status || '').toLowerCase();
      return !label.includes('sold') && !label.includes('out of stock') && !p.is_sold_out;
    });
  }

  // Construction Status
  if (sf.constructionStatuses.length > 0) {
    result = result.filter(p => {
      const cs = (p.construction_status || '').toLowerCase();
      return sf.constructionStatuses.some(s => cs.includes(s.toLowerCase()));
    });
  }

  // Sale Status
  if (sf.statuses.length > 0) {
    result = result.filter(p => {
      const label = p.status_label || p.sale_status || '';
      return sf.statuses.includes(label);
    });
  }

  // Property Types
  if (sf.propertyTypes.length > 0) {
    result = result.filter(p => {
      const type = (p.property_type_label || '').toLowerCase();
      return sf.propertyTypes.some(t => type.includes(t.toLowerCase()));
    });
  }

  // Property Category (if no specific types selected but category is chosen)
  if (sf.propertyCategory && sf.propertyTypes.length === 0) {
    const residentialTypes = ['apartments', 'villa', 'townhouse', 'duplex', 'penthouse'];
    const commercialTypes = ['plot', 'retail', 'commercial', 'offices'];
    const categoryTypes = sf.propertyCategory === 'residential' ? residentialTypes : commercialTypes;
    result = result.filter(p => {
      const type = (p.property_type_label || '').toLowerCase();
      return categoryTypes.some(t => type.includes(t));
    });
  }

  // Bedrooms
  if (sf.bedrooms.length > 0) {
    result = result.filter(p => {
      return sf.bedrooms.some(b => {
        if (b === 'studio') return (p.bedrooms_min ?? 0) === 0;
        const num = parseInt(b);
        if (b === '7+') return (p.bedrooms_max ?? 0) >= 7 || (p.bedrooms_min ?? 0) >= 7;
        return num >= (p.bedrooms_min ?? 0) && num <= (p.bedrooms_max ?? 99);
      });
    });
  }

  // Price range
  if (sf.priceMin) {
    const min = Number(sf.priceMin);
    if (!isNaN(min)) result = result.filter(p => (p.price_from || 0) >= min);
  }
  if (sf.priceMax) {
    const max = Number(sf.priceMax);
    if (!isNaN(max)) result = result.filter(p => (p.price_from || Infinity) <= max);
  }

  // Sorting
  if (sf.sortBy === 'newest') {
    result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  } else if (sf.sortBy === 'price_asc') {
    result.sort((a, b) => (a.price_from || 0) - (b.price_from || 0));
  } else if (sf.sortBy === 'price_desc') {
    result.sort((a, b) => (b.price_from || 0) - (a.price_from || 0));
  } else if (sf.sortBy === 'alpha') {
    result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  return result;
}
