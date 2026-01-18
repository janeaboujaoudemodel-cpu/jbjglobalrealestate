import { useActiveLead } from "@/contexts/ActiveLeadContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, X, Phone, Mail, Plus, ListPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ActiveLeadBannerProps {
  onAddToShortlist?: (propertyId: string, propertyData: any) => void;
  showAddToShortlist?: boolean;
  currentPropertyId?: string;
  currentPropertyData?: any;
}

const ActiveLeadBanner = ({ 
  onAddToShortlist,
  showAddToShortlist = false,
  currentPropertyId,
  currentPropertyData
}: ActiveLeadBannerProps) => {
  const { activeLead, clearActiveLead } = useActiveLead();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!activeLead) return null;

  const handleAddToShortlist = async () => {
    if (!currentPropertyId || !currentPropertyData) {
      toast.error("No property selected to add");
      return;
    }

    try {
      const { error } = await supabase
        .from("crm_lead_shortlists")
        .insert({
          lead_id: activeLead.id,
          property_id: currentPropertyId,
          property_data: currentPropertyData,
          added_by_user_id: user?.id
        });

      if (error) throw error;
      
      toast.success(`Property added to ${activeLead.full_name}'s shortlist`);
      
      if (onAddToShortlist) {
        onAddToShortlist(currentPropertyId, currentPropertyData);
      }
    } catch (err) {
      console.error("Failed to add to shortlist:", err);
      toast.error("Failed to add to shortlist");
    }
  };

  const handleWhatsApp = () => {
    if (!activeLead.phone) {
      toast.error("No phone number available for this lead");
      return;
    }
    const phone = activeLead.phone.replace("+", "");
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const handleEmail = () => {
    if (!activeLead.email) {
      toast.error("No email available for this lead");
      return;
    }
    window.open(`mailto:${activeLead.email}`, "_blank");
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-gold/50 rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 max-w-xl">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gold/20 rounded-full">
          <User className="h-4 w-4 text-gold" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{activeLead.full_name}</p>
          <p className="text-xs text-muted-foreground">
            {activeLead.nationality || "Lead"} · {activeLead.language?.toUpperCase() || "EN"}
          </p>
        </div>
        <Badge variant="outline" className="text-gold border-gold/50 text-xs">
          Active Lead
        </Badge>
      </div>

      <div className="flex items-center gap-2 border-l border-border pl-4">
        {activeLead.phone && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleWhatsApp}
            className="text-green-400 border-green-500/50 hover:bg-green-600/20 h-8"
          >
            <Phone className="h-3 w-3 mr-1" />
            WhatsApp
          </Button>
        )}
        {activeLead.email && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleEmail}
            className="text-blue-400 border-blue-500/50 hover:bg-blue-600/20 h-8"
          >
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
        )}
        {showAddToShortlist && currentPropertyId && (
          <Button
            size="sm"
            variant="primary"
            onClick={handleAddToShortlist}
            className="h-8"
          >
            <ListPlus className="h-3 w-3 mr-1" />
            Add to Shortlist
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate(`/crm/leads/${activeLead.id}`)}
          className="text-muted-foreground hover:text-white h-8"
        >
          View Lead
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={clearActiveLead}
          className="text-muted-foreground hover:text-white h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ActiveLeadBanner;
