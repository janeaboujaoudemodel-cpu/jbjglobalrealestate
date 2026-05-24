import { Eye, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useEffectiveOwner, usePreviewAsVisitor } from "@/hooks/useEffectiveOwner";

/**
 * Floating eye-icon button that opens a small pill menu letting the owner
 * switch between "Owner Mode" (editing affordances visible) and "User Mode"
 * (page renders exactly as a public visitor sees it).
 * Renders nothing for non-owners.
 */
export default function OwnerVisitorToggle() {
  const { isOwner } = useEffectiveOwner();
  const { previewAsVisitor, toggle } = usePreviewAsVisitor();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!isOwner) return null;

  const currentLabel = previewAsVisitor ? "User Mode" : "Owner Mode";

  const select = (asVisitor: boolean) => {
    if (asVisitor !== previewAsVisitor) toggle();
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="fixed bottom-6 right-6 z-[10000]">
      {open && (
        <div
          role="menu"
          data-no-contrast-guard
          className="absolute bottom-14 right-0 min-w-[170px] rounded-full bg-[#F7F2EA] border border-[#B89555]/60 shadow-[0_12px_32px_rgba(0,0,0,0.18)] p-1 flex flex-col gap-1"
        >
          <button
            role="menuitemradio"
            aria-checked={!previewAsVisitor}
            onClick={() => select(false)}
            className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              !previewAsVisitor
                ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60"
                : "text-[#1A1A1A] hover:bg-[#EFE6D6]"
            }`}
          >
            <span>Owner Mode</span>
            {!previewAsVisitor && <Check className="w-3.5 h-3.5" />}
          </button>
          <button
            role="menuitemradio"
            aria-checked={previewAsVisitor}
            onClick={() => select(true)}
            className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              previewAsVisitor
                ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60"
                : "text-[#1A1A1A] hover:bg-[#EFE6D6]"
            }`}
          >
            <span>User Mode</span>
            {previewAsVisitor && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        title={`${currentLabel} — click to switch`}
        aria-label={`${currentLabel} — click to switch`}
        aria-haspopup="menu"
        aria-expanded={open}
        data-no-contrast-guard
        className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/60 shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-[#EFE6D6] transition-colors"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );
}
