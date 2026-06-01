import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export interface GuidedField {
  /** dom id of the input/select trigger to focus + pulse */
  id: string;
  /** human label shown in the toast / pulse */
  label: string;
  /** current value; treated as empty when "", null, undefined, [] or 0-length array */
  value: unknown;
}

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/**
 * Step-guided required field validator. On submit attempt:
 *   - finds the first empty required field
 *   - focuses it, scrolls into view
 *   - applies a temporary `data-field-pulse` attribute (use it in CSS for an outline pulse)
 *   - shows a soft toast: "Please fill {label}"
 *   - returns false until all required fields are filled
 *
 * Usage:
 *   const guide = useGuidedRequiredFields();
 *   const onSubmit = () => {
 *     if (!guide.check([
 *       { id: "community", label: "Community / Area", value: community },
 *       { id: "type", label: "Property Type", value: type },
 *     ])) return;
 *     // …proceed
 *   };
 */
export function useGuidedRequiredFields() {
  const [pulseId, setPulseId] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const pulse = useCallback((id: string) => {
    setPulseId(id);
    const el = document.getElementById(id);
    if (el) {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {}
      try {
        (el as HTMLElement).focus({ preventScroll: true });
      } catch {}
      el.setAttribute("data-field-pulse", "1");
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        el.removeAttribute("data-field-pulse");
        setPulseId(null);
      }, 1600);
    }
  }, []);

  const check = useCallback(
    (fields: GuidedField[]): boolean => {
      const missing = fields.find((f) => isEmpty(f.value));
      if (!missing) return true;
      pulse(missing.id);
      toast.message(`Please fill ${missing.label}`, {
        description: "Complete this field, then continue.",
      });
      return false;
    },
    [pulse],
  );

  return { check, pulse, pulseId };
}

export default useGuidedRequiredFields;
