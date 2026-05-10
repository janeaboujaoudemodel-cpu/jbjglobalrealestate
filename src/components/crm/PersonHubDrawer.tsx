/**
 * PersonHubDrawer — sheet wrapper around <PersonHub /> that mirrors
 * <CompanyHubDrawer />: same champagne side-sheet shell, same "Open full
 * view" link in the header. Used by every CRM directory.
 */
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { PersonHub, type PersonVariant, type PersonHubProps } from "./PersonHub";

interface Props extends PersonHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonHubDrawer({ open, onOpenChange, ...hubProps }: Props) {
  const fullRoute = `/owner/crm/person/${hubProps.variant}/${encodeURIComponent(hubProps.id)}`;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-[#FDFBF7] border-l border-[#B89555]/20 overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center justify-between gap-3 pr-8">
            <span className="text-[#1A1A1A]">Person Hub</span>
            <Link
              to={fullRoute}
              onClick={() => onOpenChange(false)}
              className="text-xs font-normal text-[#1A1A1A]/70 hover:text-[#1A1A1A] inline-flex items-center gap-1"
            >
              Open full view <ExternalLink className="h-3 w-3" />
            </Link>
          </SheetTitle>
        </SheetHeader>
        {open && <PersonHub {...hubProps} />}
      </SheetContent>
    </Sheet>
  );
}

export default PersonHubDrawer;
export type { PersonVariant };
