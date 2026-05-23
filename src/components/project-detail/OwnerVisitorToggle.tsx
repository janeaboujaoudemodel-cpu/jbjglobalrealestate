import { Eye, Pencil } from "lucide-react";
import { useEffectiveOwner, usePreviewAsVisitor } from "@/hooks/useEffectiveOwner";

/**
 * Floating chip that lets the owner toggle between "Owner" (editing affordances
 * visible) and "Visitor" (page renders exactly as a public user sees it).
 * Renders nothing for non-owners.
 */
export default function OwnerVisitorToggle() {
  const { isOwner } = useEffectiveOwner();
  const { previewAsVisitor, toggle } = usePreviewAsVisitor();
  if (!isOwner) return null;

  return (
    <button
      onClick={toggle}
      title={previewAsVisitor ? "Currently viewing as visitor — click to return to owner mode" : "Preview as a normal visitor"}
      aria-pressed={previewAsVisitor}
      data-no-contrast-guard
      className="fixed bottom-6 right-6 z-[10000] inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.18)] border bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/60 hover:bg-[#EFE6D6] transition-colors"
    >
      {previewAsVisitor ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
      <span>{previewAsVisitor ? "Viewing as Visitor" : "Owner Mode"}</span>
      <span
        className={`ml-1 inline-block w-8 h-4 rounded-full relative transition-colors ${previewAsVisitor ? "bg-[#1A1A1A]" : "bg-[#B89555]"}`}
        data-no-contrast-guard
      >
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${previewAsVisitor ? "left-4" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
