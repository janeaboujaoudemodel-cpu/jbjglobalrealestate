import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  FileText, 
  Download, 
  Send, 
  Building2, 
  Plus,
  X,
  Mail
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Property {
  id: string;
  name: string;
  developer: string;
  location: string;
  price: string;
  bedrooms: string;
  area: string;
  completion: string;
}

interface ComparisonPDFTemplateProps {
  leadId?: string;
  leadName?: string;
  leadEmail?: string;
  brokerName?: string;
}

export function ComparisonPDFTemplate({
  leadId,
  leadName,
  leadEmail,
  brokerName = "JBJ Global Real Estate"
}: ComparisonPDFTemplateProps) {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("Property Comparison - Curated Selection for You");
  const [emailMessage, setEmailMessage] = useState("");
  const [generating, setGenerating] = useState(false);

  // Sample properties for demo
  const availableProperties: Property[] = [
    {
      id: "1",
      name: "Dubai Creek Harbour Tower",
      developer: "Emaar Properties",
      location: "Dubai Creek Harbour",
      price: "AED 2,500,000",
      bedrooms: "2 BR",
      area: "1,450 sq.ft",
      completion: "Q4 2025"
    },
    {
      id: "2",
      name: "Palm Jumeirah Residences",
      developer: "Nakheel",
      location: "Palm Jumeirah",
      price: "AED 4,200,000",
      bedrooms: "3 BR",
      area: "2,100 sq.ft",
      completion: "Ready"
    },
    {
      id: "3",
      name: "Downtown Views II",
      developer: "Emaar Properties",
      location: "Downtown Dubai",
      price: "AED 3,100,000",
      bedrooms: "2 BR",
      area: "1,680 sq.ft",
      completion: "Q2 2026"
    }
  ];

  const addProperty = (property: Property) => {
    if (selectedProperties.length >= 4) {
      toast.error("Maximum 4 properties can be compared");
      return;
    }
    if (selectedProperties.find(p => p.id === property.id)) {
      toast.error("Property already added");
      return;
    }
    setSelectedProperties([...selectedProperties, property]);
  };

  const removeProperty = (propertyId: string) => {
    setSelectedProperties(selectedProperties.filter(p => p.id !== propertyId));
  };

  const generatePDF = async () => {
    if (selectedProperties.length < 2) {
      toast.error("Please select at least 2 properties to compare");
      return;
    }
    
    setGenerating(true);
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGenerating(false);
    toast.success("PDF generated successfully");
  };

  const sendComparison = async () => {
    if (!leadEmail) {
      toast.error("No email address available for this lead");
      return;
    }
    
    if (selectedProperties.length < 2) {
      toast.error("Please select at least 2 properties to compare");
      return;
    }
    
    setGenerating(true);
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setGenerating(false);
    setSendDialogOpen(false);
    toast.success(`Comparison sent to ${leadEmail}`);
  };

  return (
    <>
      <Card className="bg-zinc-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Property Comparison PDF</CardTitle>
                <p className="text-gray-600 text-sm mt-1">
                  Generate branded comparison documents
                </p>
              </div>
            </div>
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              {selectedProperties.length} Selected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Properties */}
          {selectedProperties.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-600">Selected Properties</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedProperties.map((property) => (
                  <div
                    key={property.id}
                    className="p-3 rounded-lg bg-zinc-800 border border-gray-700 relative group"
                  >
                    <button
                      onClick={() => removeProperty(property.id)}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="text-white font-medium text-sm truncate">{property.name}</p>
                    <p className="text-gray-600 text-xs">{property.location}</p>
                    <p className="text-price-orange text-sm font-medium mt-1">{property.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Properties */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-600">Add Properties</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 border border-gray-700/50 hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-white text-sm">{property.name}</p>
                      <p className="text-gray-600 text-xs">{property.location} • {property.bedrooms}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addProperty(property)}
                    disabled={selectedProperties.some(p => p.id === property.id)}
                    className="text-gold hover:text-gold-light"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-800">
            <Button
              onClick={generatePDF}
              disabled={selectedProperties.length < 2 || generating}
              className="flex-1 bg-zinc-800 hover:bg-gray-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {generating ? "Generating..." : "Download PDF"}
            </Button>
            <Button
              onClick={() => setSendDialogOpen(true)}
              disabled={selectedProperties.length < 2 || !leadEmail}
              className="flex-1 bg-gold hover:bg-gold-dark text-black"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Lead
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Send Email Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="bg-zinc-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-gold" />
              Send Property Comparison
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-zinc-800 border border-gray-700">
              <p className="text-sm text-gray-600">Sending to:</p>
              <p className="text-white font-medium">{leadName || "Lead"}</p>
              <p className="text-gray-600 text-sm">{leadEmail}</p>
            </div>
            
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Subject</label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="bg-zinc-800 border-gray-700 text-white"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-600 mb-2 block">Personal Message (Optional)</label>
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Add a personal note to accompany the comparison..."
                className="bg-zinc-800 border-gray-700 text-white min-h-[100px]"
              />
            </div>

            <div className="p-3 rounded-lg bg-gold/10 border border-gold/20">
              <p className="text-sm text-gold">
                📎 Attached: Property Comparison ({selectedProperties.length} properties)
              </p>
              <ul className="mt-2 space-y-1">
                {selectedProperties.map((p) => (
                  <li key={p.id} className="text-xs text-gray-600">• {p.name}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendDialogOpen(false)}
              className="border-gray-700 text-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={sendComparison}
              disabled={generating}
              className="bg-gold hover:bg-gold-dark text-black"
            >
              {generating ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
