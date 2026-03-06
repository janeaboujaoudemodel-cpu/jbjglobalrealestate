import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Search, Users, Briefcase, CheckCircle2, ArrowLeft } from "lucide-react";

interface Person {
  user_id: string;
  display_name: string | null;
  crm_role: string;
  photo_url?: string | null;
  is_active: boolean;
}

interface LeadAssignModalProps {
  open: boolean;
  onClose: () => void;
  leadIds: string[];
  currentUserId: string;
  onSuccess: () => void;
}

type Step = "choose" | "list" | "confirm";
type AssigneeType = "employees" | "brokers";

export default function LeadAssignModal({
  open,
  onClose,
  leadIds,
  currentUserId,
  onSuccess,
}: LeadAssignModalProps) {
  const [step, setStep] = useState<Step>("choose");
  const [assigneeType, setAssigneeType] = useState<AssigneeType | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("choose");
      setAssigneeType(null);
      setPeople([]);
      setSearch("");
      setSelectedPerson(null);
    }
  }, [open]);

  // Fetch people when type is selected
  useEffect(() => {
    if (assigneeType && step === "list") {
      fetchPeople();
    }
  }, [assigneeType, step]);

  const fetchPeople = async () => {
    setLoading(true);
    try {
      // Fetch from crm_users_profile
      const { data: profiles, error } = await supabase
        .from("crm_users_profile")
        .select("user_id, display_name, crm_role, is_active")
        .eq("is_active", true)
        .order("display_name");

      if (error) throw error;

      // Fetch photos from broker_profiles
      const userIds = (profiles || []).map((p) => p.user_id);
      const { data: brokerPhotos } = await supabase
        .from("broker_profiles")
        .select("user_id, photo_url")
        .in("user_id", userIds);

      const photoMap = new Map(
        (brokerPhotos || []).map((b) => [b.user_id, b.photo_url])
      );

      let filtered = (profiles || []).map((p) => ({
        ...p,
        photo_url: photoMap.get(p.user_id) || null,
      }));

      // Filter by type
      if (assigneeType === "employees") {
        // Employees = admins, founders, owner_admin, sales_director
        filtered = filtered.filter((p) =>
          ["admin", "founder", "owner_admin", "sales_director"].includes(p.crm_role)
        );
      } else {
        // Brokers = broker_member, sales_director, and any other non-admin roles
        filtered = filtered.filter((p) =>
          ["broker_member", "sales_director"].includes(p.crm_role) ||
          !["admin", "founder", "owner_admin"].includes(p.crm_role)
        );
      }

      setPeople(filtered);
    } catch (err: any) {
      console.error("Failed to fetch people:", err);
      toast.error("Failed to load list");
    } finally {
      setLoading(false);
    }
  };

  const filteredPeople = useMemo(() => {
    if (!search.trim()) return people;
    const q = search.toLowerCase();
    return people.filter(
      (p) =>
        p.display_name?.toLowerCase().includes(q) ||
        p.user_id.toLowerCase().includes(q)
    );
  }, [people, search]);

  const handleChoose = (type: AssigneeType) => {
    setAssigneeType(type);
    setStep("list");
  };

  const handleSelectPerson = (person: Person) => {
    setSelectedPerson(person);
    setStep("confirm");
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("list");
      setSelectedPerson(null);
    } else if (step === "list") {
      setStep("choose");
      setAssigneeType(null);
      setPeople([]);
      setSearch("");
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedPerson) return;

    setAssigning(true);
    try {
      const { error } = await supabase.rpc("bulk_assign_leads", {
        p_lead_ids: leadIds,
        p_assignee_user_id: selectedPerson.user_id,
        p_assigned_by_user_id: currentUserId,
      });

      if (error) throw error;

      toast.success(
        `Assigned ${leadIds.length} lead(s) to ${selectedPerson.display_name || "selected person"}`
      );

      // Send notification to the assigned user
      try {
        await supabase.from("user_notifications").insert({
          user_id: selectedPerson.user_id,
          title: "New Lead Assignment",
          message: `You have been assigned ${leadIds.length} new lead(s). Please follow up promptly.`,
          type: "lead_assignment",
          is_read: false,
        });
      } catch (notifErr) {
        console.warn("Failed to send assignment notification:", notifErr);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Assignment failed:", err);
      toast.error(`Assignment failed: ${err?.message || "Unknown error"}`);
    } finally {
      setAssigning(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            {step !== "choose" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 mr-1"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {step === "choose" && "Assign Lead"}
            {step === "list" &&
              (assigneeType === "employees" ? "Select Employee" : "Select Broker")}
            {step === "confirm" && "Confirm Assignment"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Choose type */}
        {step === "choose" && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Who would you like to assign {leadIds.length} lead(s) to?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-2 hover:border-gold hover:bg-gold/10"
                onClick={() => handleChoose("employees")}
              >
                <Briefcase className="h-8 w-8 text-gold" />
                <span className="font-semibold">Employees</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-2 hover:border-gold hover:bg-gold/10"
                onClick={() => handleChoose("brokers")}
              >
                <Users className="h-8 w-8 text-gold" />
                <span className="font-semibold">Brokers</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: List with search */}
        {step === "list" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="pl-10 bg-background border-border"
              />
            </div>

            <ScrollArea className="h-[300px]">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : filteredPeople.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No {assigneeType} found
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredPeople.map((person) => (
                    <button
                      key={person.user_id}
                      onClick={() => handleSelectPerson(person)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={person.photo_url || undefined} />
                        <AvatarFallback className="bg-gold/20 text-gold text-sm">
                          {getInitials(person.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {person.display_name || person.user_id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {person.crm_role.replace(/_/g, " ")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"
                      >
                        Active
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && selectedPerson && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-4">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src={selectedPerson.photo_url || undefined} />
                <AvatarFallback className="bg-gold/20 text-gold text-2xl">
                  {getInitials(selectedPerson.display_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {selectedPerson.display_name || selectedPerson.user_id.slice(0, 8)}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedPerson.crm_role.replace(/_/g, " ")}
                </p>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to assign{" "}
                <span className="font-semibold text-foreground">
                  {leadIds.length} lead(s)
                </span>{" "}
                to this person?
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleBack} disabled={assigning}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAssign}
                disabled={assigning}
                className="bg-gold text-black hover:bg-gold/90"
              >
                {assigning ? (
                  "Assigning..."
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Yes, Assign
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
