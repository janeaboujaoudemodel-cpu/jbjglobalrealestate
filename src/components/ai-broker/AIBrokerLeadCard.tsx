import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  MessageSquare,
  Mail,
  Phone,
  MoreVertical,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIBrokerEmailDialog } from "./AIBrokerEmailDialog";
import { AIBrokerWhatsAppDialog } from "./AIBrokerWhatsAppDialog";
import { AIBrokerCallDialog } from "./AIBrokerCallDialog";

interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  interest_note: string | null;
  pipeline_status?: string | null;
  created_at: string;
}

interface AIBrokerLeadCardProps {
  lead: Lead;
  brokerId: string;
  brokerName: string;
}

export function AIBrokerLeadCard({ lead, brokerId, brokerName }: AIBrokerLeadCardProps) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  const handleCallClick = () => {
    if (!lead.phone) {
      toast.error("No phone number available");
      return;
    }
    setCallDialogOpen(true);
  };

  const handleWhatsAppClick = () => {
    if (!lead.phone) {
      toast.error("No phone number available");
      return;
    }
    setWhatsappDialogOpen(true);
  };

  const handleEmailClick = () => {
    if (!lead.email) {
      toast.error("No email available");
      return;
    }
    setEmailDialogOpen(true);
  };

  return (
    <>
      <Card className="bg-[#FDFBF7] border-[#1A1A1A] hover:border-[#1A1A1A] transition-all duration-200 hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-[#1A1A1A]">
                <AvatarFallback className="bg-[#1A1A1A] text-white text-sm">
                  {getInitials(lead.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-white font-medium">{lead.full_name}</h3>
                <p className="text-[#1A1A1A]/70 text-sm flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {getTimeAgo(lead.created_at)}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#1A1A1A]/70 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#FDFBF7] border-[#1A1A1A]">
                <DropdownMenuItem className="text-[#1A1A1A]/70 focus:bg-[#1A1A1A]">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Interest Note */}
          {lead.interest_note && (
            <p className="text-[#1A1A1A]/70 text-sm mb-3 line-clamp-2">
              {lead.interest_note}
            </p>
          )}

          {/* Contact Info */}
          <div className="space-y-1 mb-4 text-sm">
            {lead.email && (
              <p className="text-[#1A1A1A]/70 truncate">{lead.email}</p>
            )}
            {lead.phone && (
              <p className="text-[#1A1A1A]/70">{lead.phone}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleWhatsAppClick}
              disabled={!lead.phone}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              WhatsApp
            </Button>
            <Button
              size="sm"
              onClick={handleEmailClick}
              disabled={!lead.email}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Mail className="h-4 w-4 mr-1" />
              Email
            </Button>
            <Button
              size="sm"
              onClick={handleCallClick}
              disabled={!lead.phone}
              variant="outline"
              className="border-[#1A1A1A] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]"
            >
              <Phone className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Dialog */}
      <AIBrokerEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        lead={lead}
        brokerId={brokerId}
        brokerName={brokerName}
      />

      {/* WhatsApp Dialog */}
      <AIBrokerWhatsAppDialog
        open={whatsappDialogOpen}
        onOpenChange={setWhatsappDialogOpen}
        lead={lead}
        brokerId={brokerId}
        brokerName={brokerName}
      />

      {/* Call Dialog */}
      <AIBrokerCallDialog
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        lead={lead}
        brokerId={brokerId}
        brokerName={brokerName}
      />
    </>
  );
}
