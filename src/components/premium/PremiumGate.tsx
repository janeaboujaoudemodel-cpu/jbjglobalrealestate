import { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import type { PremiumActionKey } from "@/config/premiumActions";

/**
 * <PremiumGate action="view_property" next="/project/foo">
 *   <PropertyCard ... />
 * </PremiumGate>
 *
 * Wraps a clickable region. Anonymous visitors see the child fully rendered
 * with a subtle "Unlock" pill overlay; clicking anywhere on the card fires
 * the conversion modal. Authenticated users get straight through.
 *
 * Set `soft={false}` for hard-only gating (no overlay, click still gated).
 */
export function PremiumGate({
  action,
  next,
  soft = true,
  className = "",
  children,
  onAuthed,
}: {
  action: PremiumActionKey;
  next?: string;
  soft?: boolean;
  className?: string;
  children: ReactNode;
  onAuthed?: () => void;
}) {
  const { user } = useAuth();
  const { requireAuth } = useRequireAuth();

  if (user) {
    return <div className={className}>{children}</div>;
  }

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    requireAuth({ action, next, onAuthed });
  };

  return (
    <div
      onClick={handle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handle(e as any);
      }}
      role="button"
      tabIndex={0}
      className={`relative group cursor-pointer ${className}`}
      aria-label="Members-only content — click to unlock"
    >
      {children}
      {soft ? (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-inherit bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="pointer-events-none absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[#064E3B]/95 text-white text-[10px] tracking-[0.22em] uppercase px-2.5 py-1.5 shadow-lg backdrop-blur-sm">
            <Sparkles className="w-3 h-3 text-[#D4B87A]" />
            Unlock
          </div>
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 rounded-inherit bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="inline-flex items-center gap-2 rounded-md bg-[#064E3B] text-white text-xs font-semibold px-4 py-2.5 shadow-xl">
            <Lock className="w-3.5 h-3.5" />
            Create free account to view
          </div>
        </div>
      )}
    </div>
  );
}

export default PremiumGate;
