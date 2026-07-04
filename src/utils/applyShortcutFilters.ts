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

  const normalize = (value: unknown) => String(value ?? '').toLowerCase().replace(/[_-]+/g, ' ').trim();
  const handoverOrder = (handover: unknown): number | null => {
    const text = normalize(handover);
    if (!text) return null;
    if (/\b(ready|complete|completed|delivered)\b/.test(text)) return 202400;
    const year = text.match(/20\d{2}/)?.[0];
    if (!year) return null;
    const qMatch = text.match(/\bq([1-4])\b/);
    return Number(year) * 10 + (qMatch ? Number(qMatch[1]) : 4);
  };
  const rangeStart = Number(sf.handoverFrom.year) * 10 + Number(sf.handoverFrom.quarter.replace('Q', '') || 1);
  const rangeEnd = Number(sf.handoverTo.year) * 10 + Number(sf.handoverTo.quarter.replace('Q', '') || 4);

  // Hide Sold Out — permanently disabled site-wide. Off-plan projects that
  // sell out reappear via the secondary market, so this toggle no longer
  // filters anything and is not surfaced in the UI.


  // Construction Status
  if (sf.constructionStatuses.length > 0) {
    result = result.filter(p => {
      const cs = `${normalize(p.construction_status)} ${normalize(p.status)} ${normalize(p.availability_status)} ${normalize(p.handover_date)}`;
      return sf.constructionStatuses.some(s => {
        const needle = normalize(s);
        if (needle === 'completed') return /\b(ready|complete|completed|delivered)\b/.test(cs);
        if (needle === 'under construction') return cs.includes('under construction') || cs.includes('construction');
        if (needle === 'presale') return cs.includes('presale') || cs.includes('pre sale') || cs.includes('eoi');
        if (needle === 'ready resale') return cs.includes('ready resale') || (cs.includes('ready') && cs.includes('resale'));
        if (needle === 'resale off plan') return cs.includes('resale off plan') || (cs.includes('resale') && !cs.includes('ready'));
        return cs.includes(needle);
      });
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
      const type = `${normalize(p.property_type_label)} ${normalize(p.unit_types)} ${normalize(p.name)} ${normalize(p.description)}`;
      return sf.propertyTypes.some(t => type.includes(normalize(t).replace(/s$/, '')));
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

  if (sf.paymentPlanMax < 100) {
    result = result.filter(p => {
      const down = Number(p.down_payment_percent ?? p.pre_handover_percent ?? NaN);
      if (!Number.isNaN(down)) return down <= sf.paymentPlanMax;
      const plan = normalize(p.payment_plan);
      const firstPercent = plan.match(/\b(\d{1,3})\s*%/)?.[1];
      return firstPercent ? Number(firstPercent) <= sf.paymentPlanMax : true;
    });
  }

  if (sf.postHandoverOnly) {
    result = result.filter(p => normalize(p.payment_plan).includes('post'));
  }

  if (sf.handoverFrom.year !== '2025' || sf.handoverFrom.quarter !== 'Q1' || sf.handoverTo.year !== '2035' || sf.handoverTo.quarter !== 'Q4') {
    result = result.filter(p => {
      const order = handoverOrder(p.handover_date ?? p.expected_completion ?? p.construction_status);
      return order === null ? false : order >= rangeStart && order <= rangeEnd;
    });
  }
  if (sf.priceMax) {
    const max = Number(sf.priceMax);
    if (!isNaN(max)) result = result.filter(p => (p.price_from || Infinity) <= max);
  }

  // Size range
  if (sf.sizeMin) {
    const min = Number(sf.sizeMin);
    if (!isNaN(min)) result = result.filter(p => (p.size_min || p.size_sqft || p.area_sqft || 0) >= min);
  }
  if (sf.sizeMax) {
    const max = Number(sf.sizeMax);
    if (!isNaN(max)) result = result.filter(p => (p.size_max || p.size_min || p.size_sqft || p.area_sqft || Infinity) <= max);
  }

  // Emirates
  if (sf.emirates && sf.emirates.length > 0) {
    result = result.filter(p => {
      const emirate = (p.emirate || p.location_emirate || '').toLowerCase();
      return sf.emirates.some(e => emirate.includes(e.toLowerCase()));
    });
  }

  // Areas
  if (sf.areas && sf.areas.length > 0) {
    result = result.filter(p => {
      const area = (p.area_name || p.district || p.location || '').toLowerCase();
      return sf.areas.some(a => area.toLowerCase().includes(a.toLowerCase()));
    });
  }

  // Developers
  if (sf.developers && sf.developers.length > 0) {
    result = result.filter(p => {
      const dev = (p.developer_name || p.developer || '').toLowerCase();
      return sf.developers.some(d => dev.toLowerCase().includes(d.toLowerCase()));
    });
  }

  // Views
  if (sf.views && sf.views.length > 0) {
    result = result.filter(p => {
      const projectViews = p.views || p.property_views || p.view || p.description || '';
      const viewStr = Array.isArray(projectViews) ? projectViews.join(' ').toLowerCase() : normalize(projectViews);
      return sf.views.some(v => viewStr.includes(normalize(v)));
    });
  }

  // Search query
  if (sf.searchQuery && sf.searchQuery.trim()) {
    const q = sf.searchQuery.trim().toLowerCase();
    result = result.filter(p => {
      const name = (p.name || p.title || '').toLowerCase();
      const dev = (p.developer_name || p.developer || '').toLowerCase();
      const area = (p.area_name || p.district || '').toLowerCase();
      const emirate = (p.emirate || p.location_emirate || '').toLowerCase();
      const location = (p.location || '').toLowerCase();
      return name.includes(q) || dev.includes(q) || area.includes(q) || emirate.includes(q) || location.includes(q);
    });
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
