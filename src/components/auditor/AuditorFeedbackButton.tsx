import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AuditorFeedbackPanel from "./AuditorFeedbackPanel";

const AuditorFeedbackButton = () => {
  const { isAuditor, isOwner } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuditor || isOwner) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-[#EFE6D6] hover:bg-[#F7F2EA] text-[#1A1A1A] shadow-2xl flex items-center justify-center transition-all hover:scale-110"
        title="Send feedback to Jane"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
      <AuditorFeedbackPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};

export default AuditorFeedbackButton;
