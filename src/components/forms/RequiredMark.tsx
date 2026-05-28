/**
 * Shared "required" indicator used across all JBJ forms.
 * Renders a champagne-gold asterisk and an SR-only "required" text.
 * Most labels render it automatically via `.jbj-form-label[data-required]`
 * — use this component when you need a standalone marker.
 */
export function RequiredMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <span aria-hidden="true" className="ml-0.5 text-brand-gold font-semibold">
        *
      </span>
      <span className="sr-only"> (required)</span>
    </span>
  );
}

export default RequiredMark;
