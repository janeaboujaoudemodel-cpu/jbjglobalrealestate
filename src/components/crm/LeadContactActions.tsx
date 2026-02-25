import { useState } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Mail, Phone, MessageCircle, FileText, 
  MoreHorizontal, Send, ExternalLink
} from "lucide-react";

interface LeadContactActionsProps {
  lead: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  };
  onGenerateReport?: () => void;
}

const LeadContactActions = ({ lead, onGenerateReport }: LeadContactActionsProps) => {
  const handleSendEmail = () => {
    if (lead.email) {
      const subject = encodeURIComponent(`Follow-up from JBJ Global Real Estate`);
      const body = encodeURIComponent(`Dear ${lead.full_name || 'Valued Client'},\n\nThank you for your interest in JBJ Global Real Estate.\n\nBest regards,\nJBJ Global Real Estate Team`);
      // Use direct navigation to avoid popup blocking
      window.location.href = `mailto:${lead.email}?subject=${subject}&body=${body}`;
      toast.success("Opening email client...");
    } else {
      toast.error("No email address available");
    }
  };

  const handleSendWhatsApp = () => {
    if (lead.phone) {
      const cleanPhone = lead.phone.replace(/[^0-9+]/g, '').replace('+', '');
      const message = encodeURIComponent(`Hello ${lead.full_name || ''}! Thank you for your interest in JBJ Global Real Estate. How can I assist you today?`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
      toast.success("Opening WhatsApp...");
    } else {
      toast.error("No phone number available");
    }
  };

  const handleCallDirectly = () => {
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, '_self');
      toast.success("Initiating call...");
    } else {
      toast.error("No phone number available");
    }
  };

  const handleGenerateReport = () => {
    if (onGenerateReport) {
      onGenerateReport();
    } else {
      toast.info("AI Report generation will open in a new modal");
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* High-visibility action buttons - Task 21 */}
      <Button 
        onClick={handleCallDirectly}
        size="sm" 
        className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md"
        disabled={!lead.phone}
      >
        <Phone className="w-4 h-4 mr-1.5" />
        Call
      </Button>
      
      <Button 
        onClick={handleSendEmail}
        size="sm" 
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md"
        disabled={!lead.email}
      >
        <Mail className="w-4 h-4 mr-1.5" />
        Email
      </Button>
      
      <Button 
        onClick={handleSendWhatsApp}
        size="sm" 
        className="bg-green-500 hover:bg-green-600 text-white font-semibold shadow-md"
        disabled={!lead.phone}
      >
        <MessageCircle className="w-4 h-4 mr-1.5" />
        WhatsApp
      </Button>

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 w-56">
          <DropdownMenuItem 
            onClick={handleGenerateReport}
            className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer"
          >
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Generate & Share AI Report</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default LeadContactActions;
