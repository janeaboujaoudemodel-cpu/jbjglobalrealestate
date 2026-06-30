import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Building2, X, FileText, Send, Plus, Trash2,
  BarChart3, Calculator, Mail, MessageSquare
} from "lucide-react";
import { useActiveLead } from "@/contexts/ActiveLeadContext";

interface ShortlistItem {
  id: string;
  property_id: string;
  property_data: {
    name: string;
    developer?: string;
    location?: string;
    price?: string;
    type?: string;
    bedrooms?: string;
    image_url?: string;
  } | null;
  notes: string | null;
  created_at: string;
}

interface LeadShortlistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

// Company branding
const COMPANY_INFO = {
  name: "JBJ Global Real Estate",
  phone: "+971 4 XXX XXXX",
  email: "info@jbjglobal.ae",
  website: "www.jbjglobal.ae"
};

const LeadShortlistPanel = ({ isOpen, onClose, userId }: LeadShortlistPanelProps) => {
  const { activeLead } = useActiveLead();
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeLead) {
      fetchShortlist();
    }
  }, [isOpen, activeLead]);

  const fetchShortlist = async () => {
    if (!activeLead) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("crm_lead_shortlists")
        .select("*")
        .eq("lead_id", activeLead.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setShortlist((data || []).map(item => ({
        ...item,
        property_data: item.property_data as ShortlistItem['property_data']
      })));
    } catch (err) {
      console.error("Failed to fetch shortlist:", err);
      toast.error("Failed to load shortlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromShortlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("crm_lead_shortlists")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setShortlist(prev => prev.filter(item => item.id !== itemId));
      toast.success("Removed from shortlist");
    } catch (err) {
      console.error("Failed to remove:", err);
      toast.error("Failed to remove from shortlist");
    }
  };

  const generateReport = async () => {
    if (!activeLead || shortlist.length === 0) {
      toast.error("No properties in shortlist");
      return;
    }

    try {
      // Save report to database
      const { error } = await supabase
        .from("crm_lead_reports")
        .insert({
          lead_id: activeLead.id,
          report_type: "property_list",
          title: `Property Shortlist for ${activeLead.full_name}`,
          report_data: {
            properties: shortlist.map(item => item.property_data),
            generated_at: new Date().toISOString(),
            lead_name: activeLead.full_name,
            lead_email: activeLead.email,
            lead_phone: activeLead.phone
          },
          include_broker_info: false, // Company branding only
          created_by_user_id: userId
        });

      if (error) throw error;

      toast.success("Report generated and saved to lead record");
    } catch (err) {
      console.error("Failed to generate report:", err);
      toast.error("Failed to generate report");
    }
  };

  const sendViaWhatsApp = () => {
    if (!activeLead?.phone || shortlist.length === 0) {
      toast.error("Lead has no phone number or shortlist is empty");
      return;
    }

    const propertyList = shortlist
      .map((item, i) => {
        const p = item.property_data;
        return `${i + 1}. ${p?.name || 'Property'}\n   📍 ${p?.location || 'Dubai'}\n   💰 ${p?.price || 'Price on request'}`;
      })
      .join("\n\n");

    const message = `Hello ${activeLead.full_name.split(' ')[0]}! 👋

Here are the properties I've selected for you:

${propertyList}

Would you like to schedule viewings for any of these properties?

Best regards,
${COMPANY_INFO.name}
📞 ${COMPANY_INFO.phone}
🌐 ${COMPANY_INFO.website}`;

    const phone = activeLead.phone.replace("+", "");
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
  };

  const sendViaEmail = () => {
    if (!activeLead?.email || shortlist.length === 0) {
      toast.error("Lead has no email or shortlist is empty");
      return;
    }

    const propertyList = shortlist
      .map((item, i) => {
        const p = item.property_data;
        return `${i + 1}. ${p?.name || 'Property'} - ${p?.location || 'Dubai'} - ${p?.price || 'Price on request'}`;
      })
      .join("\n");

    const subject = `Your Personalized Property Selection - ${COMPANY_INFO.name}`;
    const body = `Dear ${activeLead.full_name.split(' ')[0]},

Thank you for your interest in Dubai real estate. Based on your requirements, I have curated the following properties for your consideration:

${propertyList}

I would be happy to arrange viewings at your convenience. Please let me know your preferred dates and times.

Best regards,

${COMPANY_INFO.name}
${COMPANY_INFO.phone}
${COMPANY_INFO.email}
${COMPANY_INFO.website}`;

    window.open(`mailto:${activeLead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  if (!activeLead) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#1A1A1A]" />
            Property Shortlist
          </DialogTitle>
        </DialogHeader>

        {/* Lead Context */}
        <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p className="text-white font-medium">{activeLead.full_name}</p>
            <p className="text-xs text-muted-foreground">
              {shortlist.length} properties selected
            </p>
          </div>
          <Badge variant="outline" className="text-[#1A1A1A] border-[#B89555]/50">
            Active Lead
          </Badge>
        </div>

        {/* Shortlist */}
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : shortlist.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No properties in shortlist</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add properties from the listing database
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {shortlist.map((item) => (
                <Card key={item.id} className="bg-muted/30 border-border">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        {item.property_data?.image_url ? (
                          <img 
                            src={item.property_data.image_url} 
                            alt={item.property_data?.name}
                            className="w-full h-full object-cover rounded-lg"
                           loading="lazy" decoding="async" />
                        ) : (
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate">
                          {item.property_data?.name || "Property"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.property_data?.developer}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          📍 {item.property_data?.location || "Dubai"}
                        </p>
                        <p className="text-sm text-[#1A1A1A] font-medium mt-1">
                          {item.property_data?.price || "Price on request"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-red-400"
                        onClick={() => removeFromShortlist(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        {shortlist.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={sendViaWhatsApp}
                disabled={!activeLead.phone}
                className="text-green-400 border-[color:var(--emerald-1)]/30/50 hover:jj-surface-emerald-soft"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={sendViaEmail}
                disabled={!activeLead.email}
                className="text-blue-400 border-blue-500/50 hover:bg-blue-500/20"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
            <Button
              className="w-full bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
              onClick={generateReport}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate & Save Report
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LeadShortlistPanel;