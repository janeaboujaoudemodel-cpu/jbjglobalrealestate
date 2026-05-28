import { AlertCircle } from "lucide-react";

/**
 * Inline gold error message rendered under any required field.
 * Returns null when there is no error so it can be dropped in unconditionally.
 */
export function FieldError({ id, message }: { id?: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-brand-gold"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}

export default FieldError;
