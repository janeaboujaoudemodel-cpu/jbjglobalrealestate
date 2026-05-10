import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Phone,
  Mail,
  Clock,
  Building,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  notes: string | null;
  property_interest: string | null;
  last_contact: string | null;
  created_at: string;
}

interface JBJLeadCardProps {
  lead: Lead;
  viewMode: "grid" | "list";
  onAction: (leadId: string, action: string) => void;
}

const statusColors: Record<string, string> = {
  new: "border-blue-500 text-blue-600 bg-blue-50",
  contacted: "border-[#B89555]/30 text-[#1A1A1A]/70 bg-[#F7F2EA]",
  follow_up: "border-amber-500 text-amber-600 bg-amber-50",
  qualified: "border-purple-500 text-purple-600 bg-purple-50",
  converted: "border-green-500 text-green-600 bg-green-50",
};

export function JBJLeadCard({ lead, viewMode, onAction }: JBJLeadCardProps) {
  const handleWhatsApp = () => {
    if (lead.phone) {
      window.open(`https://wa.me/${lead.phone.replace(/\D/g, "")}`, "_blank");
    }
    onAction(lead.id, "whatsapp_click");
  };

  const handleEmail = () => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`, "_blank");
    }
    onAction(lead.id, "email_click");
  };

  const handleCall = () => {
    if (lead.phone) {
      window.open(`tel:${lead.phone}`, "_blank");
    }
    onAction(lead.id, "call_click");
  };

  if (viewMode === "list") {
    return (
      <Card className="bg-[#FDFBF7] border shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A]">
                {lead.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-[#1A1A1A] truncate">{lead.name}</h3>
                <Badge variant="outline" className={statusColors[lead.status] || ""}>
                  {lead.status}
                </Badge>
              </div>
              <p className="text-sm text-[#1A1A1A]/70 truncate">
                {lead.email || lead.phone || "No contact info"}
              </p>
            </div>

            {lead.property_interest && (
              <div className="hidden lg:flex items-center gap-1 text-sm text-[#1A1A1A]/70">
                <Building className="h-4 w-4" />
                <span className="truncate max-w-[150px]">{lead.property_interest}</span>
              </div>
            )}

            {lead.last_contact && (
              <div className="hidden md:flex items-center gap-1 text-sm text-[#1A1A1A]/70">
                <Clock className="h-4 w-4" />
                <span>{new Date(lead.last_contact).toLocaleDateString()}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleWhatsApp}
                disabled={!lead.phone}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEmail}
                disabled={!lead.email}
                className="border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCall}
                disabled={!lead.phone}
                className="border-[#B89555]/30 text-[#1A1A1A]/70 hover:bg-[#F7F2EA]"
              >
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#FDFBF7] border shadow-sm hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A] font-medium">
                {lead.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-[#1A1A1A]">{lead.name}</h3>
              <p className="text-sm text-[#1A1A1A]/70 truncate max-w-[150px]">
                {lead.email || lead.phone || "No contact"}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAction(lead.id, "view_details")}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction(lead.id, "update_status")}>
                Update Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction(lead.id, "add_note")}>
                Add Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Badge variant="outline" className={`mb-3 ${statusColors[lead.status] || ""}`}>
          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1).replace("_", " ")}
        </Badge>

        {lead.property_interest && (
          <div className="flex items-center gap-2 text-sm text-[#1A1A1A]/70 mb-3">
            <Building className="h-4 w-4 text-[#1A1A1A]/70" />
            <span className="truncate">{lead.property_interest}</span>
          </div>
        )}

        {lead.notes && (
          <p className="text-sm text-[#1A1A1A]/70 mb-3 line-clamp-2">{lead.notes}</p>
        )}

        {lead.last_contact && (
          <div className="flex items-center gap-1 text-xs text-[#1A1A1A]/70 mb-4">
            <Clock className="h-3 w-3" />
            <span>Last contact: {new Date(lead.last_contact).toLocaleDateString()}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleWhatsApp}
            disabled={!lead.phone}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            WhatsApp
          </Button>
          <Button
            size="sm"
            onClick={handleEmail}
            disabled={!lead.email}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCall}
            disabled={!lead.phone}
            className="border-[#B89555]/30"
          >
            <Phone className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
