import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Bell, FileText, Calendar, Loader2 } from "lucide-react";

export type QuickActivityType = "note" | "calendar_event" | "reminder";
export type QuickEntity = "brokerage" | "client" | "developer" | "broker_agent";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** initial type tab; user can switch */
  defaultType?: QuickActivityType;
  /** Pre-bound entity. If omitted, dialog will let user pick a brokerage. */
  entityType?: QuickEntity;
  entityId?: string;
  entityName?: string;
  /** For broker_agent: parent brokerage id */
  brokerageId?: string;
}

const TYPE_TABS: { value: QuickActivityType; label: string; icon: any }[] = [
  { value: "note", label: "Note", icon: FileText },
  { value: "calendar_event", label: "Calendar event", icon: Calendar },
  { value: "reminder", label: "Reminder", icon: Bell },
];

const CHANNELS = [
  { v: "push", label: "In-app push" },
  { v: "email", label: "Email" },
  { v: "whatsapp", label: "WhatsApp" },
  { v: "sms", label: "SMS" },
];

export default function QuickActivityDialog({
  open, onOpenChange, defaultType = "note",
  entityType, entityId, entityName, brokerageId,
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [type, setType] = useState<QuickActivityType>(defaultType);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState<string>("");
  const [channel, setChannel] = useState<string>("push");
  const [pickedBrokerageId, setPickedBrokerageId] = useState<string>(entityType === "brokerage" ? (entityId || "") : "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (open) setType(defaultType); }, [open, defaultType]);
  useEffect(() => {
    if (open) {
      setTitle(""); setBody("");
      setDueAt(type === "note" ? "" : new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
      setChannel("push");
      setPickedBrokerageId(entityType === "brokerage" ? (entityId || "") : "");
    }
  }, [open, type, entityType, entityId]);

  // Brokerage picker (only when no entity bound)
  const needsBrokeragePicker = !entityType;
  const { data: brokerages = [] } = useQuery({
    queryKey: ["crm-brokerages-mini"],
    enabled: needsBrokeragePicker && open,
    queryFn: async () => {
      const { data } = await (supabase as any).from("crm_brokerages")
        .select("id,company_name").order("company_name").limit(500);
      return data || [];
    },
  });

  const targetLabel = useMemo(() => {
    if (entityName) return entityName;
    if (needsBrokeragePicker && pickedBrokerageId) {
      return brokerages.find((b: any) => b.id === pickedBrokerageId)?.company_name || "";
    }
    return "";
  }, [entityName, needsBrokeragePicker, pickedBrokerageId, brokerages]);

  const handleSubmit = async () => {
    if (!user) { toast.error("Please sign in"); return; }
    const effectiveBrokerageId =
      entityType === "brokerage" ? entityId :
      entityType === "broker_agent" ? brokerageId :
      needsBrokeragePicker ? pickedBrokerageId : undefined;

    if (needsBrokeragePicker && !pickedBrokerageId) {
      toast.error("Pick an agency"); return;
    }
    if (!title.trim()) { toast.error("Add a title"); return; }
    if ((type === "calendar_event" || type === "reminder") && !dueAt) {
      toast.error("Pick a date/time"); return;
    }

    setSubmitting(true);
    try {
      const sb = supabase as any;
      const dueIso = dueAt ? new Date(dueAt).toISOString() : null;

      if (type === "reminder") {
        // Reminder always lands in crm_relationship_reminders
        const row: any = {
          owner_id: user.id,
          kind: "follow_up",
          title: title.trim(),
          body: body.trim() || null,
          due_at: dueIso,
          metadata: { delivery_channel: channel, source: "quick_activity" },
        };
        if (entityType === "brokerage" || entityType === "broker_agent") {
          row.brokerage_id = effectiveBrokerageId;
          if (entityType === "broker_agent") row.metadata.agent_id = entityId;
        } else if (entityType === "client") {
          row.client_id = entityId;
        } else if (entityType === "developer") {
          row.dev_registry_id = entityId;
        } else if (effectiveBrokerageId) {
          row.brokerage_id = effectiveBrokerageId;
        }
        await sb.from("crm_relationship_reminders").insert(row);

        // Mirror to brokerage activity feed if applicable
        if (effectiveBrokerageId) {
          await sb.from("crm_brokerage_actions").insert({
            owner_id: user.id,
            brokerage_id: effectiveBrokerageId,
            action_type: "calendar_event",
            title: title.trim(),
            body: body.trim() || null,
            due_at: dueIso,
            created_by: user.id,
            metadata: { source: "quick_activity", delivery_channel: channel },
          });
        }
      } else {
        // note OR calendar_event
        if (effectiveBrokerageId) {
          await sb.from("crm_brokerage_actions").insert({
            owner_id: user.id,
            brokerage_id: effectiveBrokerageId,
            action_type: type,
            title: title.trim(),
            body: body.trim() || null,
            due_at: dueIso,
            created_by: user.id,
            metadata: {
              source: "quick_activity",
              ...(entityType === "broker_agent" ? { agent_id: entityId, agent_name: entityName } : {}),
            },
          });
        } else {
          // Client / developer fallback: use reminders table with allowed kinds
          // (kind enum: follow_up | document_expiry | birthday | meeting | renewal | custom)
          const row: any = {
            owner_id: user.id,
            kind: type === "calendar_event" ? "meeting" : "custom",
            title: title.trim(),
            body: body.trim() || null,
            // due_at is NOT NULL on this table — fall back to "now" for plain notes
            due_at: dueIso || new Date().toISOString(),
            metadata: { source: "quick_activity", subtype: type },
          };
          if (entityType === "client") row.client_id = entityId;
          if (entityType === "developer") row.dev_registry_id = entityId;
          await sb.from("crm_relationship_reminders").insert(row);
        }
      }

      toast.success(`${type === "calendar_event" ? "Calendar event" : type === "reminder" ? "Reminder" : "Note"} saved`);
      qc.invalidateQueries({ queryKey: ["crm-unified-activity"] });
      qc.invalidateQueries({ queryKey: ["crm-reminders"] });
      qc.invalidateQueries({ queryKey: ["crm-brokerage-actions"] });
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            New activity{targetLabel ? ` — ${targetLabel}` : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Type tabs */}
          <div className="flex gap-2">
            {TYPE_TABS.map((t) => {
              const Icon = t.icon;
              const active = type === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    active
                      ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A]"
                      : "bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]/80 hover:bg-[#F7F2EA]"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          {needsBrokeragePicker && (
            <div>
              <Label className="text-xs">Agency</Label>
              <Select value={pickedBrokerageId} onValueChange={setPickedBrokerageId}>
                <SelectTrigger><SelectValue placeholder="Pick an agency…" /></SelectTrigger>
                <SelectContent>
                  {brokerages.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "note" ? "What happened…" : "Follow up call, send brochure…"} />
          </div>

          <div>
            <Label className="text-xs">Details</Label>
            <Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          {(type === "calendar_event" || type === "reminder") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{type === "reminder" ? "Remind me at" : "Event date/time"}</Label>
                <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </div>
              {type === "reminder" && (
                <div>
                  <Label className="text-xs">Deliver via</Label>
                  <Select value={channel} onValueChange={setChannel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((c) => (
                        <SelectItem key={c.v} value={c.v}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
