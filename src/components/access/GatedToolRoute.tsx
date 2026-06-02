import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useGatedToolAccess, type GatedToolId } from "@/hooks/useGatedToolAccess";
import ToolLockGate from "@/components/access/ToolLockGate";
import { toolThemes, type ToolTheme } from "@/components/tools/toolThemes";

interface Props {
  toolId: GatedToolId;
  toolName: string;
  theme: ToolTheme;
  tagline?: string;
  /** Where to send investor/developer/logged-out users. */
  hiddenRedirect?: string;
  children: ReactNode;
}

/**
 * Wraps a tool route with the unified broker/owner access matrix.
 *  - Owner + JBJ broker → children
 *  - Other brokers      → ToolLockGate (themed, request-access CTA)
 *  - Everyone else      → redirect to hub (default `/`)
 */
export default function GatedToolRoute({
  toolId,
  toolName,
  theme,
  tagline,
  hiddenRedirect = "/",
  children,
}: Props) {
  const { visible, unlocked, isLoading } = useGatedToolAccess(toolId);

  if (isLoading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ background: "#FDFBF7", color: "#1A1A1A" }}
      >
        <div className="text-sm opacity-70">Loading…</div>
      </div>
    );
  }

  if (!visible) return <Navigate to={hiddenRedirect} replace />;
  if (!unlocked) return <ToolLockGate theme={theme} toolName={toolName} toolId={toolId} tagline={tagline} />;
  return <>{children}</>;
}

export { toolThemes };
