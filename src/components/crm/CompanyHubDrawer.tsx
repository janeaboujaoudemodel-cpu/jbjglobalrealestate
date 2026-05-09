/**
 * CompanyHubDrawer
 * Side-drawer wrapper around <CompanyHub /> with a button to open the
 * full-screen route.
 */
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { CompanyHub, type CompanyType } from "./CompanyHub";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: CompanyType;
  companyName: string;
}

export function CompanyHubDrawer({ open, onOpenChange, type, companyName }: Props) {
  const fullRoute = `/owner/crm/company/${type}/${encodeURIComponent(companyName)}`;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-[#FDFBF7] border-l border-[#B89555]/20 overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center justify-between gap-3 pr-8">
            <span className="text-[#1A1A1A]">Company Hub</span>
            <Link
              to={fullRoute}
              onClick={() => onOpenChange(false)}
              className="text-xs font-normal text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-1"
            >
              Open full view <ExternalLink className="h-3 w-3" />
            </Link>
          </SheetTitle>
        </SheetHeader>
        {open && <CompanyHub type={type} companyName={companyName} />}
      </SheetContent>
    </Sheet>
  );
}
