import { useState, useEffect, useCallback } from 'react';

const AREA_UNIT_KEY = 'jj_area_unit';
const SQFT_TO_SQM = 0.092903;

export type AreaUnit = 'sqft' | 'sqm';

/**
 * Global area unit hook. Reads from localStorage and listens for areaUnitChange events.
 * All components using this hook will re-render when the user switches unit.
 */
export function useAreaUnit() {
  const [areaUnit, setAreaUnit] = useState<AreaUnit>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(AREA_UNIT_KEY) as AreaUnit) || 'sqft';
    }
    return 'sqft';
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const unit = (e as CustomEvent).detail;
      if (unit === 'sqft' || unit === 'sqm') {
        setAreaUnit(unit);
      }
    };
    window.addEventListener('areaUnitChange', handler);
    return () => window.removeEventListener('areaUnitChange', handler);
  }, []);

  /** Convert a sqft value to the active unit and return formatted string with label */
  const formatSize = useCallback((sqftValue: number | null | undefined): string => {
    if (!sqftValue) return '';
    if (areaUnit === 'sqm') {
      const sqm = Math.round(sqftValue * SQFT_TO_SQM);
      return `${sqm.toLocaleString()} sqm`;
    }
    return `${sqftValue.toLocaleString()} sqft`;
  }, [areaUnit]);

  /** Convert a sqft value to the active unit (number only) */
  const convertSize = useCallback((sqftValue: number): number => {
    if (areaUnit === 'sqm') return Math.round(sqftValue * SQFT_TO_SQM);
    return sqftValue;
  }, [areaUnit]);

  /** Return the current unit label */
  const unitLabel = areaUnit === 'sqm' ? 'sqm' : 'sqft';

  return { areaUnit, formatSize, convertSize, unitLabel };
}
