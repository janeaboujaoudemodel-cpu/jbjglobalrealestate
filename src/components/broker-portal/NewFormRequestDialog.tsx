/**
 * Broker form-request composer.
 *
 * The broker picks a form type, fills in the parties' details that the
 * owner needs in order to actually draft the document, optionally attaches
 * supporting files (passport copy, title deed, draft brochure…) and submits
 * for owner review. Brokers DO NOT draft JBJ paperwork themselves.
 */
import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { BROKER_FORM_TYPES, useCreateBrokerFormRequest } from "@/hooks/useBrokerFormRequests";
import { Paperclip, Trash2, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

type Attachment = { name: string; path: string; url: string; size: number };

type Schema =
  | "client"     // buyer/tenant agreement (Form B, NDA, Tenancy)
  | "viewing"   // Form I — agent + client + property
  | "listing"   // Form A / F / MOU — seller/landlord + property
  | "termination" // Form U
  | "generic";

function schemaFor(formType: string): Schema {
  if (!formType) return "generic";
  if (/Form I|Viewing/i.test(formType)) return "viewing";
  if (/Form A|Form F|MOU|Memorandum/i.test(formType)) return "listing";
  if (/Form B|Buyer|NDA|Tenancy/i.test(formType)) return "client";
  if (/Form U|Termination/i.test(formType)) return "termination";
  return "generic";
}

const emptyDetails = {
  // Client / counterparty
  client_full_name: "",
  client_email: "",
  client_phone: "",
  client_id_type: "passport", // passport | emirates_id
  client_id_number: "",
  client_nationality: "",
  // Property
  property_address: "",
  property_unit: "",
  property_type: "",
  property_price: "",
  property_currency: "AED",
  // Agent (broker fills as themselves)
  agent_full_name: "",
  agent_rera: "",
  agent_phone: "",
  // Viewing-specific
  viewing_date: "",
  viewing_notes: "",
};

type Details = typeof emptyDetails;

export default function NewFormRequestDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [formType, setFormType] = useState<string>("");
  const [leadId, setLeadId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const create = useCreateBrokerFormRequest();

  const schema = useMemo(() => schemaFor(formType), [formType]);

  // Only leads explicitly assigned to this broker — used to pre-fill the client section.
  const { data: leads = [] } = useQuery({
    queryKey: ["broker-assigned-leads-min", user?.id],
    enabled: !!user?.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("id, full_name, email, phone, preferred_project, preferred_location, property_type, budget_max, budget_currency")
        .eq("assigned_broker_id", user!.id)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });

  const onPickLead = (id: string) => {
    setLeadId(id);
    if (id === "none") return;
    const l: any = leads.find((x: any) => x.id === id);
    if (!l) return;
    setDetails((d) => ({
      ...d,
      client_full_name: d.client_full_name || l.full_name || "",
      client_email:     d.client_email     || l.email     || "",
      client_phone:     d.client_phone     || l.phone     || "",
      property_address: d.property_address || l.preferred_project || l.preferred_location || "",
      property_type:    d.property_type    || l.property_type || "",
      property_price:   d.property_price   || (l.budget_max ? String(l.budget_max) : ""),
      property_currency: d.property_currency || l.budget_currency || "AED",
    }));
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    try {
      const next: Attachment[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 15 MB`);
          continue;
        }
        const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const path = `${user.id}/form-requests/${Date.now()}-${safe}`;
        const { error } = await supabase.storage
          .from("broker-documents")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) { toast.error(`Upload failed: ${file.name}`); continue; }
        const { data: signed } = await supabase.storage
          .from("broker-documents")
          .createSignedUrl(path, 60 * 60 * 24 * 7);
        next.push({ name: file.name, path, url: signed?.signedUrl || "", size: file.size });
      }
      setAttachments((a) => [...a, ...next]);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (att: Attachment) => {
    await supabase.storage.from("broker-documents").remove([att.path]).catch(() => {});
    setAttachments((a) => a.filter((x) => x.path !== att.path));
  };

  const reset = () => {
    setFormType(""); setLeadId("none"); setNotes("");
    setDetails(emptyDetails); setAttachments([]);
  };

  const submit = async () => {
    if (!formType) { toast.error("Pick a form type"); return; }
    if (schema !== "generic" && !details.client_full_name.trim()) {
      toast.error("Client / counterparty name is required");
      return;
    }
    try {
      await create.mutateAsync({
        form_type: formType,
        lead_id: leadId === "none" ? null : leadId,
        notes: notes.trim() || null,
        client_details: details,
        attachments,
      });
      toast.success("Request sent to JBJ");
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Could not send request");
    }
  };

  const showClient = schema !== "generic";
  const showProperty = schema === "listing" || schema === "viewing" || schema === "termination";
  const showAgent = schema === "viewing" || schema === "listing";
  const showViewing = schema === "viewing";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Request a form from JBJ</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Pick the form, fill in the parties' details and attach supporting documents.
            JBJ owner reviews every request and sends the prepared document back to you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Form + lead */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Form type *">
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]">
                  <SelectValue placeholder="Select a form…" />
                </SelectTrigger>
                <SelectContent>
                  {BROKER_FORM_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Related lead (optional)">
              <Select value={leadId} onValueChange={onPickLead}>
                <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]">
                  <SelectValue placeholder="No specific lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific lead</SelectItem>
                  {leads.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>{l.full_name || l.id.slice(0, 8)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Client / Counterparty */}
          {showClient && (
            <Group title="Client / Counterparty">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Full name *">
                  <Input value={details.client_full_name} onChange={(e) => setDetails({ ...details, client_full_name: e.target.value })} />
                </Field>
                <Field label="Nationality">
                  <Input value={details.client_nationality} onChange={(e) => setDetails({ ...details, client_nationality: e.target.value })} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={details.client_email} onChange={(e) => setDetails({ ...details, client_email: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <Input value={details.client_phone} onChange={(e) => setDetails({ ...details, client_phone: e.target.value })} />
                </Field>
                <Field label="ID type">
                  <Select value={details.client_id_type} onValueChange={(v) => setDetails({ ...details, client_id_type: v })}>
                    <SelectTrigger className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="emirates_id">Emirates ID</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="ID number">
                  <Input value={details.client_id_number} onChange={(e) => setDetails({ ...details, client_id_number: e.target.value })} />
                </Field>
              </div>
            </Group>
          )}

          {/* Property */}
          {showProperty && (
            <Group title="Property">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Address / project">
                  <Input value={details.property_address} onChange={(e) => setDetails({ ...details, property_address: e.target.value })} />
                </Field>
                <Field label="Unit number">
                  <Input value={details.property_unit} onChange={(e) => setDetails({ ...details, property_unit: e.target.value })} />
                </Field>
                <Field label="Type">
                  <Input value={details.property_type} onChange={(e) => setDetails({ ...details, property_type: e.target.value })} placeholder="Apartment, Villa…" />
                </Field>
                <Field label="Price">
                  <div className="flex gap-2">
                    <Input className="flex-1" value={details.property_price} onChange={(e) => setDetails({ ...details, property_price: e.target.value })} />
                    <Input className="w-20" value={details.property_currency} onChange={(e) => setDetails({ ...details, property_currency: e.target.value })} />
                  </div>
                </Field>
              </div>
            </Group>
          )}

          {/* Agent */}
          {showAgent && (
            <Group title="Listing agent (you)">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Full name">
                  <Input value={details.agent_full_name} onChange={(e) => setDetails({ ...details, agent_full_name: e.target.value })} />
                </Field>
                <Field label="RERA / BRN">
                  <Input value={details.agent_rera} onChange={(e) => setDetails({ ...details, agent_rera: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <Input value={details.agent_phone} onChange={(e) => setDetails({ ...details, agent_phone: e.target.value })} />
                </Field>
              </div>
            </Group>
          )}

          {/* Viewing */}
          {showViewing && (
            <Group title="Viewing">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Viewing date">
                  <Input type="datetime-local" value={details.viewing_date} onChange={(e) => setDetails({ ...details, viewing_date: e.target.value })} />
                </Field>
                <Field label="Notes for the viewing">
                  <Input value={details.viewing_notes} onChange={(e) => setDetails({ ...details, viewing_notes: e.target.value })} />
                </Field>
              </div>
            </Group>
          )}

          {/* Attachments */}
          <Group title="Supporting documents">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#1A1A1A] hover:text-[#0A0A0A]">
              <span className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#EFE6D6] border border-[#B89555]/40">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                {uploading ? "Uploading…" : "Attach files"}
              </span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
              />
              <span className="text-[11px] text-[#1A1A1A]/55">PDF, images, max 15 MB each</span>
            </label>
            {attachments.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {attachments.map((a) => (
                  <li key={a.path} className="flex items-center justify-between text-xs bg-[#F7F2EA] border border-[#B89555]/25 rounded-md px-3 py-2">
                    <span className="truncate text-[#1A1A1A]">{a.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(a)}
                      className="text-[#1A1A1A]/60 hover:text-red-600"
                      aria-label="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Group>

          {/* Notes */}
          <Field label="Notes for JBJ">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Specific clauses, deadline, special instructions…"
              className="bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A] min-h-[90px]"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <button
            type="button"
            onClick={submit}
            disabled={create.isPending || !formType}
            data-allow-dark-cta
            className="allow-white inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md jj-surface-emerald allow-white text-white text-sm font-semibold hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed border border-[#B89555]/40 transition-colors"
          >
            {create.isPending ? "Sending…" : "Send request"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-[0.12em] text-[#1A1A1A]/65">{label}</Label>
      {children}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-[#F7F2EA]/60 border border-[#B89555]/25 p-3.5">
      <h3 className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A] font-semibold mb-3">{title}</h3>
      {children}
    </section>
  );
}
