import { Link } from "react-router-dom";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";

interface ScanCardShortcutProps {
  variant?: "button" | "icon" | "link";
  className?: string;
}

/**
 * Shared admin-only shortcut to the Business Card Scanner.
 * Visible only to authenticated owners/admins (matches OwnerGuard on the route).
 */
const ScanCardShortcut = ({
  variant = "button",
  className = "",
}: ScanCardShortcutProps) => {
  const { isOwner } = useUserRole();
  if (!isOwner) return null;

  if (variant === "icon") {
    return (
      <Button asChild size="icon" variant="ghost" className={className} title="Scan business card">
        <Link to="/business-card-scanner" aria-label="Scan business card">
          <ScanLine className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  if (variant === "link") {
    return (
      <Link
        to="/business-card-scanner"
        className={`inline-flex items-center gap-2 text-sm hover:underline ${className}`}
      >
        <ScanLine className="h-4 w-4" />
        <span>Scan business card</span>
      </Link>
    );
  }

  return (
    <Button asChild size="sm" variant="outline" className={`gap-2 ${className}`}>
      <Link to="/business-card-scanner">
        <ScanLine className="h-4 w-4" />
        Scan business card
      </Link>
    </Button>
  );
};

export default ScanCardShortcut;
