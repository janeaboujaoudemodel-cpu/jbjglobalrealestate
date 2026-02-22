import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { 
  User, 
  Phone, 
  Mail, 
  MessageCircle, 
  Clock, 
  Building2,
  DollarSign,
  Lock,
  ExternalLink,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SecureLeadData {
  id: string;
  first_name: string;
  masked_phone?: string;
  masked_email?: string;
  status: string;
  property_interest?: string;
  budget_range?: string;
  source?: string;
  last_contact?: string;
  assigned_broker_id?: string;
}

interface SecureLeadCardProps {
  lead: SecureLeadData;
  brokerId: string;
  onContact?: () => void;
}

export function SecureLeadCard({ lead, brokerId, onContact }: SecureLeadCardProps) {
  const [isContacting, setIsContacting] = useState(false);

  const handleCompanyWhatsApp = async () => {
    setIsContacting(true);
    
    try {
      // Log the access attempt
      await supabase.from("jbj_lead_access_log").insert({
        broker_id: brokerId,
        lead_id: lead.id,
        access_type: "contact",
      });

      // Open company WhatsApp with pre-filled message
      const message = `Hi, I'm reaching out regarding a property inquiry from ${lead.first_name}. Lead ID: ${lead.id}`;
      const whatsappUrl = getWhatsAppUrl(message);
      
      window.location.href = whatsappUrl;
      
      onContact?.();
      toast.success("Opening company WhatsApp...");
    } catch (error) {
      console.error("Error logging contact:", error);
      toast.error("Failed to log contact attempt");
    } finally {
      setIsContacting(false);
    }
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 border-blue-200",
    qualified: "bg-green-100 text-green-800 border-green-200",
    contacted: "bg-amber-100 text-amber-800 border-amber-200",
    negotiating: "bg-purple-100 text-purple-800 border-purple-200",
    closed: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <Card className="border hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-gold/30">
              <AvatarFallback className="bg-gold/10 text-gold font-semibold">
                {lead.first_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                {lead.first_name}
                <Lock className="w-3 h-3 text-muted-foreground" />
              </h3>
              <p className="text-xs text-muted-foreground">
                Lead ID: {lead.id.slice(0, 8)}...
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn("text-xs capitalize", statusColors[lead.status] || statusColors.new)}
          >
            {lead.status}
          </Badge>
        </div>

        {/* Protected Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {lead.masked_phone || (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Protected
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {lead.masked_email || (
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Protected
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Lead Details */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          {lead.property_interest && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{lead.property_interest}</span>
            </div>
          )}
          {lead.budget_range && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{lead.budget_range}</span>
            </div>
          )}
          {lead.last_contact && (
            <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Last: {new Date(lead.last_contact).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-medium">Contact Restricted</p>
              <p>All communication must go through company channels. Personal contact attempts are logged and monitored.</p>
            </div>
          </div>
        </div>

        {/* Contact Button - Company WhatsApp Only */}
        <Button
          onClick={handleCompanyWhatsApp}
          disabled={isContacting}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Contact via Company WhatsApp
          <ExternalLink className="w-3 h-3 ml-2" />
        </Button>

        <p className="text-xs text-center text-muted-foreground mt-2">
          {CONTACT_INFO.phone} • All chats are monitored
        </p>
      </CardContent>
    </Card>
  );
}