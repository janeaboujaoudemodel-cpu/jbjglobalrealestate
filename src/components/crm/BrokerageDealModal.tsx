import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trophy } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brokerageId: string;
  brokerageName: string;
  onSaved?: () => void;
};

/**
 * Register a deal closed with this brokerage.
 * Defaults developer to "City Developments" but is fully searchable.
 * On save: trigger refreshes deal_count_cached / total_deal_value_cached / last_deal_at on the parent brokerage.
 */
export const BrokerageDealModal = ({
  open,
  onOpenChange,
  brokerageId,
  brokerageName,
  onSaved,
}: Props) => {
  const qc = useQueryClient();

  const { data: developers = [] } = useQuery({
    queryKey: ["developers-for-deal-modal"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const defaultDeveloper = useMemo(() => {
    return (
      developers.find((d: any) =>
        /city\s*develop/i.test(d.name || "")
      ) || developers[0]
    );
  }, [developers]);

  const [form, setForm] = useState<any>({
    developer_id: "",
    developer_name_snapshot: "",
    agent_name: "",
    agent_email: "",
    unit_label: "",
    client_name: "",
    deal_value_aed: "",
    commission_aed: "",
    closed_on: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  useEffect(() => {
    if (open && defaultDeveloper && !form.developer_id) {
      setForm((f: any) => ({
        ...f,
        developer_id: defaultDeveloper.id,
        developer_name_snapshot: defaultDeveloper.name,
      }));
    }
  }, [open, defaultDeveloper]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!form.deal_value_aed || Number(form.deal_value_aed) <= 0) {
      toast.error("Enter a deal value greater than zero");
      return;
    }
    if (!form.agent_name?.trim()) {
      toast.error("Enter the agent's name");
      return;
    }
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) {
      toast.error("Not authenticated");
      return;
    }
    const developer = developers.find((d: any) => d.id === form.developer_id);
    const payload = {
      owner_id: u.user.id,
      brokerage_id: brokerageId,
      developer_id: form.developer_id || null,
      developer_name_snapshot:
        developer?.name || form.developer_name_snapshot || null,
      agent_name: form.agent_name?.trim() || null,
      agent_email: form.agent_email?.trim() || null,
      unit_label: form.unit_label || null,
      client_name: form.client_name || null,
      deal_value_aed: Number(form.deal_value_aed),
      commission_aed: form.commission_aed ? Number(form.commission_aed) : 0,
      currency: "AED",
      closed_on: form.closed_on,
      notes: form.notes || null,
      created_by: u.user.id,
    } as any;

    const { error } = await supabase
      .from("crm_brokerage_deals")
      .insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deal registered");
    qc.invalidateQueries({ queryKey: ["brokerages"] });
    qc.invalidateQueries({ queryKey: ["crm-brokerage-deals"] });
    qc.invalidateQueries({ queryKey: ["brokerage-deals", brokerageId] });
    onSaved?.();
    onOpenChange(false);
    setForm({
      developer_id: defaultDeveloper?.id || "",
      developer_name_snapshot: defaultDeveloper?.name || "",
      agent_name: "",
      agent_email: "",
      unit_label: "",
      client_name: "",
      deal_value_aed: "",
      commission_aed: "",
      closed_on: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7] text-[#1A1A1A] border border-[#1A1A1A]/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Trophy className="w-5 h-5 text-[#B89555]" />
            Register Deal — {brokerageName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#1A1A1A] mb-1 block">
                Developer
              </Label>
              <Select
                value={form.developer_id}
                onValueChange={(v) => {
                  const dev = developers.find((d: any) => d.id === v);
                  setForm({
                    ...form,
                    developer_id: v,
                    developer_name_snapshot: dev?.name || "",
                  });
                }}
              >
                <SelectTrigger className="bg-[#FDFBF7] text-[#1A1A1A]">
                  <SelectValue placeholder="Pick a developer" />
                </SelectTrigger>
                <SelectContent className="bg-[#FDFBF7] text-[#1A1A1A] max-h-72 w-[340px]">
                  {developers.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span data-developer-name className="block min-w-0 max-w-full whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">
                        {d.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-[#1A1A1A]/70 mt-1">
                Defaults to City Developments — searchable across all developers.
              </p>
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A] mb-1 block">
                Closing date
              </Label>
              <Input
                type="date"
                value={form.closed_on}
                onChange={(e) =>
                  setForm({ ...form, closed_on: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A] mb-1 block">
                Unit / project
              </Label>
              <Input
                value={form.unit_label}
                onChange={(e) =>
                  setForm({ ...form, unit_label: e.target.value })
                }
                placeholder="e.g. Tower B – Unit 2104"
              />
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A] mb-1 block">
                Client name
              </Label>
              <Input
                value={form.client_name}
                onChange={(e) =>
                  setForm({ ...form, client_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A] mb-1 block">
                Deal value (AED) *
              </Label>
              <Input
                type="number"
                value={form.deal_value_aed}
                onChange={(e) =>
                  setForm({ ...form, deal_value_aed: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A] mb-1 block">
                Commission (AED)
              </Label>
              <Input
                type="number"
                value={form.commission_aed}
                onChange={(e) =>
                  setForm({ ...form, commission_aed: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A] mb-1 block">
                Agent name *
              </Label>
              <Input
                value={form.agent_name}
                onChange={(e) =>
                  setForm({ ...form, agent_name: e.target.value })
                }
                placeholder="Agent who closed the deal"
              />
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A] mb-1 block">
                Agent email
              </Label>
              <Input
                type="email"
                value={form.agent_email}
                onChange={(e) =>
                  setForm({ ...form, agent_email: e.target.value })
                }
                placeholder="agent@brokerage.com"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-[#1A1A1A] mb-1 block">Notes</Label>
            <Textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="gold" onClick={handleSave}>
            <Trophy className="w-4 h-4 mr-1" />
            Register Deal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BrokerageDealModal;
