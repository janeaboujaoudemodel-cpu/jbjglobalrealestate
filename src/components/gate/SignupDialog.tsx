import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

/**
 * Legacy inline signup replaced by full-page wizard at /signup so we can
 * ask category-specific questions and build a proper CRM profile.
 */
export default function SignupDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();

  // If someone opens the dialog, immediately route them to the wizard.
  useEffect(() => {
    if (open) {
      onOpenChange(false);
      navigate("/signup");
    }
  }, [open, navigate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#0d3a2b]">
            Create your JBJ account
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            We tailor onboarding to your profile — investor, buyer, seller, broker, developer & more.
          </DialogDescription>
        </DialogHeader>
        <Button
          onClick={() => { onOpenChange(false); navigate("/signup"); }}
          className="bg-[#064E3B] hover:bg-[#053929] text-white"
        >
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
