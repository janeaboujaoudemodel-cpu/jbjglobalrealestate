import { Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * AuditorReadOnlyBanner - Shows a persistent banner when an auditor is logged in.
 * Place this in MainLayout or a top-level wrapper.
 */
const AuditorReadOnlyBanner = () => {
  const { isAuditor, isOwner } = useAuth();

  if (!isAuditor || isOwner) return null;

  return (
    <div className="bg-amber-500/90 text-black px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 z-50 sticky top-0">
      <Eye className="w-4 h-4" />
      <span>Read-Only Audit Mode — You can view all pages but cannot make changes</span>
    </div>
  );
};

export default AuditorReadOnlyBanner;
