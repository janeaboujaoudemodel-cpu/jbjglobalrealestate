import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Search, UserPlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Broker {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  capacity: number;
  active_leads: number;
  status: string;
}

interface AssignLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brokers: Broker[];
  onAssigned: () => void;
}

export function AssignLeadModal({ open, onOpenChange, brokers, onAssigned }: AssignLeadModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadInterest, setLeadInterest] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeBrokers = brokers.filter(b => b.status === "active");

  const handleSubmit = async () => {
    if (!leadName.trim() || !selectedBroker) {
      toast.error("Please fill in required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("jbj_leads").insert({
        name: leadName.trim(),
        email: leadEmail.trim() || null,
        phone: leadPhone.trim() || null,
        property_interest: leadInterest.trim() || null,
        assigned_broker_id: selectedBroker,
        status: "new",
      });

      if (error) throw error;

      toast.success("Lead assigned successfully");
      onOpenChange(false);
      resetForm();
      onAssigned();
    } catch (error) {
      console.error("Error assigning lead:", error);
      toast.error("Failed to assign lead");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadInterest("");
    setSelectedBroker("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gold" />
            Assign New Lead
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Lead Name *</label>
            <Input
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
              placeholder="Enter lead name"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Email</label>
              <Input
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="email@example.com"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Phone</label>
              <Input
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                placeholder="+971..."
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Property Interest</label>
            <Input
              value={leadInterest}
              onChange={(e) => setLeadInterest(e.target.value)}
              placeholder="e.g., 2BR apartment in Downtown"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Assign to Broker *</label>
            <Select value={selectedBroker} onValueChange={setSelectedBroker}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select a broker" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {activeBrokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>
                    <div className="flex items-center gap-2">
                      <span>{broker.name}</span>
                      <span className="text-gray-400 text-xs">
                        ({broker.active_leads}/{broker.capacity})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-zinc-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-gold hover:bg-gold-dark text-black"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign Lead"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
