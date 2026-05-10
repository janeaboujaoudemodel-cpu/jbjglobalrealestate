import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Search, 
  UserPlus, 
  Loader2, 
  Users, 
  Bot, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Employee {
  id: string;
  display_name: string;
  crm_role?: string;
  is_active: boolean;
}

interface Broker {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  capacity: number;
  active_leads: number;
  status: string;
  specialization?: string;
}

interface AIBroker {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  status: string;
  daily_interaction_limit: number;
  current_daily_interactions: number;
  specialization?: string[];
}

interface EnhancedAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  leadName?: string;
  onAssigned: () => void;
}

type AssignmentType = "select" | "employees" | "brokers";

export function EnhancedAssignModal({
  open,
  onOpenChange,
  leadId,
  leadName,
  onAssigned,
}: EnhancedAssignModalProps) {
  const [step, setStep] = useState<AssignmentType>("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [jbjBrokers, setJbjBrokers] = useState<Broker[]>([]);
  const [aiBrokers, setAiBrokers] = useState<AIBroker[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<{
    id: string;
    name: string;
    type: "employee" | "broker" | "ai_broker";
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("select");
      setSearchQuery("");
      setSelectedPerson(null);
    }
  }, [open]);

  useEffect(() => {
    if (step === "employees") {
      fetchEmployees();
    } else if (step === "brokers") {
      fetchBrokers();
    }
  }, [step]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("crm_users_profile")
        .select("id, display_name, crm_role, is_active")
        .eq("is_active", true)
        .order("display_name");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchBrokers = async () => {
    setLoading(true);
    try {
      // Fetch JBJ human brokers
      const { data: jbj, error: jbjError } = await supabase
        .from("jbj_brokers")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (jbjError) throw jbjError;
      setJbjBrokers(jbj || []);

      // Fetch AI brokers
      const { data: ai, error: aiError } = await supabase
        .from("ai_brokers")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (aiError) throw aiError;
      setAiBrokers(ai || []);
    } catch (error) {
      console.error("Error fetching brokers:", error);
      toast.error("Failed to load brokers");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEmployees = () => {
    if (!searchQuery) return employees;
    const query = searchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        e.display_name?.toLowerCase().includes(query)
    );
  };

  const getFilteredBrokers = () => {
    if (!searchQuery) {
      return { jbj: jbjBrokers, ai: aiBrokers };
    }
    const query = searchQuery.toLowerCase();
    return {
      jbj: jbjBrokers.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.email.toLowerCase().includes(query)
      ),
      ai: aiBrokers.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.email.toLowerCase().includes(query)
      ),
    };
  };

  const handleSelect = (person: { id: string; name: string; type: "employee" | "broker" | "ai_broker" }) => {
    setSelectedPerson(person);
    setConfirmOpen(true);
  };

  const handleConfirmAssign = async () => {
    if (!selectedPerson) return;

    setSubmitting(true);
    try {
      if (leadId) {
        // Assign existing lead
        if (selectedPerson.type === "ai_broker") {
          // Use edge function for AI broker assignment
          const { error } = await supabase.functions.invoke("broker-assign-lead", {
            body: { lead_id: leadId, broker_id: selectedPerson.id },
          });
          if (error) throw error;
        } else {
          // Direct database update for employees and JBJ brokers
          const { error } = await supabase
            .from("crm_leads")
            .update({
              owner_user_id: selectedPerson.type === "employee" ? selectedPerson.id : null,
              assigned_ai_employee_id: selectedPerson.type === "broker" ? selectedPerson.id : null,
              owner_type: "company_assigned",
            })
            .eq("id", leadId);

          if (error) throw error;
        }

        toast.success(`Lead assigned to ${selectedPerson.name}`);
      }

      setConfirmOpen(false);
      onOpenChange(false);
      onAssigned();
    } catch (error) {
      console.error("Error assigning lead:", error);
      toast.error("Failed to assign lead");
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderSelectionScreen = () => (
    <div className="space-y-4">
      <p className="text-[#1A1A1A]/70 text-sm text-center mb-6">
        Who would you like to assign {leadName ? `"${leadName}"` : "this lead"} to?
      </p>

      <Button
        variant="outline"
        onClick={() => setStep("employees")}
        className="w-full h-20 justify-start gap-4 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:border-[#B89555]/50"
      >
        <div className="p-3 rounded-lg bg-blue-500/20">
          <Users className="h-6 w-6 text-blue-400" />
        </div>
        <div className="text-left">
          <p className="text-white font-medium">Employees</p>
          <p className="text-[#1A1A1A]/70 text-sm">Assign to a team member</p>
        </div>
      </Button>

      <Button
        variant="outline"
        onClick={() => setStep("brokers")}
        className="w-full h-20 justify-start gap-4 border-[#1A1A1A] hover:bg-[#1A1A1A] hover:border-[#B89555]/50"
      >
        <div className="p-3 rounded-lg bg-[#EFE6D6]/20">
          <Bot className="h-6 w-6 text-[#1A1A1A]" />
        </div>
        <div className="text-left">
          <p className="text-white font-medium">Brokers</p>
          <p className="text-[#1A1A1A]/70 text-sm">Assign to human or AI broker</p>
        </div>
      </Button>
    </div>
  );

  const renderEmployeesList = () => {
    const filtered = getFilteredEmployees();

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep("select")}
          className="text-[#1A1A1A]/70 hover:text-white -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/70" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1A1A1A] border-[#1A1A1A] text-white"
          />
        </div>

        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#1A1A1A]" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-[#1A1A1A]/70 text-center py-8">No employees found</p>
            ) : (
              filtered.map((employee) => (
                  <button
                  key={employee.id}
                  onClick={() =>
                    handleSelect({
                      id: employee.id,
                      name: employee.display_name,
                      type: "employee",
                    })
                  }
                  className="w-full p-3 rounded-lg bg-[#1A1A1A] border border-[#1A1A1A] hover:border-[#B89555]/50 flex items-center gap-3 transition-all text-left"
                >
                  <Avatar className="h-10 w-10 border border-[#1A1A1A]">
                    <AvatarFallback className="bg-blue-500/20 text-blue-400">
                      {getInitials(employee.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {employee.display_name}
                    </p>
                  </div>
                  {employee.crm_role && (
                    <Badge variant="outline" className="border-[#1A1A1A] text-[#1A1A1A]/70">
                      {employee.crm_role}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const renderBrokersList = () => {
    const filtered = getFilteredBrokers();

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep("select")}
          className="text-[#1A1A1A]/70 hover:text-white -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/70" />
          <Input
            placeholder="Search brokers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1A1A1A] border-[#1A1A1A] text-white"
          />
        </div>

        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#1A1A1A]" />
              </div>
            ) : (
              <>
                {/* Human Brokers */}
                {filtered.jbj.length > 0 && (
                  <div>
                    <h4 className="text-[#1A1A1A]/70 text-xs uppercase tracking-wide mb-2">
                      Human Brokers
                    </h4>
                    <div className="space-y-2">
                      {filtered.jbj.map((broker) => {
                        const capacityUsage = broker.capacity > 0 
                          ? (broker.active_leads / broker.capacity) * 100 
                          : 0;
                        const isAtCapacity = capacityUsage >= 100;

                        return (
                          <button
                            key={broker.id}
                            onClick={() =>
                              handleSelect({
                                id: broker.id,
                                name: broker.name,
                                type: "broker",
                              })
                            }
                            disabled={isAtCapacity}
                            className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all text-left ${
                              isAtCapacity
                                ? "bg-[#1A1A1A]/50 border-[#1A1A1A] opacity-50 cursor-not-allowed"
                                : "bg-[#1A1A1A] border-[#1A1A1A] hover:border-[#B89555]/50"
                            }`}
                          >
                            <Avatar className="h-10 w-10 border border-[#B89555]/30">
                              {broker.avatar_url ? (
                                <AvatarImage src={broker.avatar_url} />
                              ) : (
                                <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A]">
                                  {getInitials(broker.name)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">
                                {broker.name}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-[#1A1A1A]/70 text-sm">
                                  {broker.active_leads}/{broker.capacity}
                                </span>
                                {isAtCapacity && (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                    At Capacity
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI Brokers */}
                {filtered.ai.length > 0 && (
                  <div>
                    <h4 className="text-[#1A1A1A]/70 text-xs uppercase tracking-wide mb-2 flex items-center gap-2">
                      <Bot className="h-3 w-3" />
                      AI Brokers
                    </h4>
                    <div className="space-y-2">
                      {filtered.ai.map((broker) => {
                        const capacityUsage = broker.daily_interaction_limit > 0 
                          ? (broker.current_daily_interactions / broker.daily_interaction_limit) * 100 
                          : 0;
                        const isAtCapacity = capacityUsage >= 100;

                        return (
                          <button
                            key={broker.id}
                            onClick={() =>
                              handleSelect({
                                id: broker.id,
                                name: broker.name,
                                type: "ai_broker",
                              })
                            }
                            disabled={isAtCapacity}
                            className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all text-left ${
                              isAtCapacity
                                ? "bg-[#1A1A1A]/50 border-[#1A1A1A] opacity-50 cursor-not-allowed"
                                : "bg-[#1A1A1A] border-[#1A1A1A] hover:border-emerald-500/50"
                            }`}
                          >
                            <Avatar className="h-10 w-10 border border-emerald-500/30">
                              {broker.avatar_url ? (
                                <AvatarImage src={broker.avatar_url} />
                              ) : (
                                <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                                  <Bot className="h-5 w-5" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate flex items-center gap-2">
                                {broker.name}
                                <Bot className="h-3 w-3 text-emerald-400" />
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-[#1A1A1A]/70 text-sm">
                                  {broker.current_daily_interactions}/{broker.daily_interaction_limit} today
                                </span>
                                {isAtCapacity && (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                                    At Capacity
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filtered.jbj.length === 0 && filtered.ai.length === 0 && (
                  <p className="text-[#1A1A1A]/70 text-center py-8">No brokers found</p>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#1A1A1A]" />
              Assign Lead
            </DialogTitle>
          </DialogHeader>

          {step === "select" && renderSelectionScreen()}
          {step === "employees" && renderEmployeesList()}
          {step === "brokers" && renderBrokersList()}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-[#FDFBF7] border-[#1A1A1A]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#1A1A1A]" />
              Confirm Assignment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#1A1A1A]/70">
              Are you sure you want to assign{" "}
              <span className="text-white font-medium">{leadName || "this lead"}</span> to{" "}
              <span className="text-[#1A1A1A] font-medium">{selectedPerson?.name}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#1A1A1A] text-[#1A1A1A]/70 hover:bg-[#1A1A1A]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAssign}
              disabled={submitting}
              className="bg-[#EFE6D6] hover:bg-[#EFE6D6]-dark text-[#1A1A1A]"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Yes, Assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
