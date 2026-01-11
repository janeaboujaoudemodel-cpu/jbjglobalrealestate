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
      window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`, '_blank');
      toast.success("Opening email client...");
    } else {
      toast.error("No email address available");
    }
  };

  const handleSendWhatsApp = () => {
    if (lead.phone) {
      // Clean the phone number
      const cleanPhone = lead.phone.replace(/[^0-9+]/g, '');
      const message = encodeURIComponent(`Hello ${lead.full_name || ''}! Thank you for your interest in JBJ Global Real Estate. How can I assist you today?`);
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-gold/10 border-gold/30 text-gold hover:bg-gold/20"
        >
          Contact Client
          <MoreHorizontal className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 w-56">
        <DropdownMenuItem 
          onClick={handleSendEmail}
          className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer"
        >
          <Mail className="w-4 h-4 text-blue-400" />
          <span>Send Email</span>
          {lead.email && (
            <ExternalLink className="w-3 h-3 ml-auto text-zinc-500" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleSendWhatsApp}
          className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-green-400" />
          <span>Send WhatsApp Message</span>
          {lead.phone && (
            <ExternalLink className="w-3 h-3 ml-auto text-zinc-500" />
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleCallDirectly}
          className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer"
        >
          <Phone className="w-4 h-4 text-amber-400" />
          <span>Call Directly</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-zinc-800" />
        
        <DropdownMenuItem 
          onClick={handleGenerateReport}
          className="flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer"
        >
          <FileText className="w-4 h-4 text-purple-400" />
          <span>Generate & Share AI Report</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LeadContactActions;
