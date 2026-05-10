import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileSignature, Send, Clock, CheckCircle2, AlertCircle, 
  User, Mail, Building2, FileText, ExternalLink, Shield
} from "lucide-react";
import { toast } from "sonner";

interface ContractTemplate {
  id: string;
  name: string;
  type: "buyer" | "seller" | "rental" | "investor";
  description: string;
}

interface PendingSignature {
  id: string;
  template: string;
  recipientName: string;
  recipientEmail: string;
  status: "sent" | "viewed" | "signed" | "declined";
  sentAt: string;
}

const CONTRACT_TEMPLATES: ContractTemplate[] = [
  { id: "mou", name: "Memorandum of Understanding", type: "buyer", description: "Standard MOU for property purchases" },
  { id: "listing", name: "Exclusive Listing Agreement", type: "seller", description: "Exclusive seller representation" },
  { id: "tenancy", name: "Tenancy Contract", type: "rental", description: "Standard Dubai tenancy agreement" },
  { id: "investor", name: "Investment Advisory Agreement", type: "investor", description: "Investor services agreement" },
  { id: "nda", name: "Non-Disclosure Agreement", type: "investor", description: "Confidentiality for off-market deals" },
];

const MOCK_PENDING: PendingSignature[] = [
  { id: "1", template: "Memorandum of Understanding", recipientName: "Ahmed Al Maktoum", recipientEmail: "ahmed@example.com", status: "viewed", sentAt: "2024-01-15T10:30:00" },
  { id: "2", template: "Tenancy Contract", recipientName: "Sarah Johnson", recipientEmail: "sarah@example.com", status: "sent", sentAt: "2024-01-14T14:00:00" },
  { id: "3", template: "Exclusive Listing Agreement", recipientName: "Mohammed Hassan", recipientEmail: "mh@example.com", status: "signed", sentAt: "2024-01-10T09:00:00" },
];

export function DocuSignIntegration() {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [propertyRef, setPropertyRef] = useState("");
  const [pendingSignatures] = useState<PendingSignature[]>(MOCK_PENDING);

  const handleSendForSignature = () => {
    if (!selectedTemplate || !recipientName || !recipientEmail) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success(`Contract sent to ${recipientEmail} for signature`);
    setRecipientName("");
    setRecipientEmail("");
    setPropertyRef("");
    setSelectedTemplate("");
  };

  const getStatusBadge = (status: PendingSignature["status"]) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Clock className="w-3 h-3 mr-1" />Sent</Badge>;
      case "viewed":
        return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30"><AlertCircle className="w-3 h-3 mr-1" />Viewed</Badge>;
      case "signed":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="w-3 h-3 mr-1" />Signed</Badge>;
      case "declined":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" />Declined</Badge>;
    }
  };

  const getTypeColor = (type: ContractTemplate["type"]) => {
    switch (type) {
      case "buyer": return "text-emerald-400";
      case "seller": return "text-blue-400";
      case "rental": return "text-purple-400";
      case "investor": return "text-[#1A1A1A]";
    }
  };

  return (
    <div className="space-y-6">
      {/* Send New Contract */}
      <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-[#1A1A1A]" />
            Send Contract for Signature
            <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30 text-xs ml-2">
              DocuSign
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label className="text-white/85">Contract Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTriggerDark>
                <SelectValue placeholder="Select a template" />
              </SelectTriggerDark>
              <SelectContentDark>
                {CONTRACT_TEMPLATES.map((template) => (
                  <SelectItemDark key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className={`w-4 h-4 ${getTypeColor(template.type)}`} />
                      <span>{template.name}</span>
                    </div>
                  </SelectItemDark>
                ))}
              </SelectContentDark>
            </Select>
            {selectedTemplate && (
              <p className="text-white/90 text-xs">
                {CONTRACT_TEMPLATES.find(t => t.id === selectedTemplate)?.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/85 flex items-center gap-2">
                <User className="w-4 h-4 text-white/90" />
                Recipient Name *
              </Label>
              <Input
                placeholder="Full name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="bg-[#1A1A1A]/50 border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white/85 flex items-center gap-2">
                <Mail className="w-4 h-4 text-white/90" />
                Recipient Email *
              </Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="bg-[#1A1A1A]/50 border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/85 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-white/90" />
              Property Reference (Optional)
            </Label>
            <Input
              placeholder="e.g., JBJ-2024-001"
              value={propertyRef}
              onChange={(e) => setPropertyRef(e.target.value)}
              className="bg-[#1A1A1A]/50 border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
            />
          </div>

          <Button
            variant="ai-gold"
            onClick={handleSendForSignature}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Send for Signature
          </Button>
        </CardContent>
      </Card>

      {/* Pending Signatures */}
      <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#1A1A1A]" />
            Pending Signatures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingSignatures.length === 0 ? (
            <div className="text-center py-8 text-white/90">
              <FileSignature className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No pending signatures</p>
            </div>
          ) : (
            pendingSignatures.map((sig) => (
              <div
                key={sig.id}
                className="bg-[#1A1A1A]/50 rounded-lg p-3 border border-[#1A1A1A]/50 hover:border-[#B89555]/20 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-white font-medium text-sm">{sig.recipientName}</p>
                    <p className="text-white/90 text-xs">{sig.recipientEmail}</p>
                  </div>
                  {getStatusBadge(sig.status)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-white/90" />
                    <span className="text-white/70 text-xs">{sig.template}</span>
                  </div>
                  <span className="text-[#1A1A1A]/70 text-xs">
                    {new Date(sig.sentAt).toLocaleDateString()}
                  </span>
                </div>
                {sig.status !== "signed" && (
                  <Button variant="dark-ghost" size="sm" className="w-full mt-2 text-xs">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open in DocuSign
                  </Button>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Integration Status */}
      <div className="bg-[#1A1A1A]/30 rounded-lg p-3 flex items-start gap-2">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-emerald-400 text-xs font-medium">DocuSign Connected</p>
          <p className="text-[#1A1A1A]/70 text-xs">
            Contracts are legally binding and stored securely. All signatures comply with UAE electronic signature regulations.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DocuSignIntegration;
