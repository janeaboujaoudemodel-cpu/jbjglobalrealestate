import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, User, ChevronDown, ChevronUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuickActivityActions from "@/components/crm/QuickActivityActions";

export interface BrokerageAgentDraft {
  id?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  role?: string;
  status?: "active" | "inactive" | "unknown";
  source?: string;
  photo_path?: string;
  // Phase 2 — universal CRM fields (added to crm_brokerage_agents)
  linkedin_url?: string;
  instagram_url?: string;
  birthday?: string;
  notes?: string;
  emirate?: string;
  office_address?: string;
  google_maps_link?: string;
  google_reviews_url?: string;
  partnership_status?: string;
  verification_status?: string;
  registration_status?: string;
  inquiry_count?: number;
  closed_deals_count?: number;
  last_contact_at?: string;
  last_verified_at?: string;
  assigned_to?: string;
  nationality?: string;
  languages?: string;
}

interface Props {
  value: BrokerageAgentDraft[];
  onChange: (next: BrokerageAgentDraft[]) => void;
  brokerageId?: string;
}

const STATUS_OPTIONS = [
  { v: "active", label: "Active" },
  { v: "inactive", label: "Inactive" },
  { v: "unknown", label: "Unknown" },
];

const PARTNERSHIP_STATUS = ["prospect", "introduced", "negotiating", "active_partner", "paused", "lost"];
const VERIFICATION_STATUS = ["unverified", "pending", "verified", "rejected"];
const REGISTRATION_STATUS = ["not_started", "submitted", "approved", "expired"];

export function BrokerageAgentsEditor({ value, onChange, brokerageId }: Props) {
  const [bulkPaste, setBulkPaste] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const update = (idx: number, patch: Partial<BrokerageAgentDraft>) => {
    onChange(value.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = (role: string = "broker") => onChange([...value, { name: "", phone: "", role, status: "active", source: "manual" }]);
  const toggle = (idx: number) => setExpanded((p) => ({ ...p, [idx]: !p[idx] }));

  const importPaste = () => {
    const lines = bulkPaste
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    const parsed: BrokerageAgentDraft[] = lines.map((line) => {
      const phoneMatch = line.match(/(\+?\d[\d\s\-]{6,}\d)/);
      const phone = phoneMatch ? phoneMatch[1].replace(/\s+/g, "") : "";
      const name = line.replace(phone, "").replace(/[-,|]+/g, " ").trim() || "Unknown";
      return { name, phone, whatsapp: phone, status: "active", source: "bulk_paste" };
    });
    onChange([...value, ...parsed]);
    setBulkPaste("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-[#1A1A1A]">
          Brokers under this agency ({value.length})
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => add("broker")}>
            <Plus className="w-3 h-3 mr-1" /> Add Broker
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => add("admin")}>
            <Plus className="w-3 h-3 mr-1" /> Add Admin
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => add("manager")}>
            <Plus className="w-3 h-3 mr-1" /> Add Manager
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => add("attendee")}>
            <Plus className="w-3 h-3 mr-1" /> Add Attendee
          </Button>
        </div>
      </div>

      {value.length === 0 && (
        <div className="text-xs text-[#1A1A1A]/70">
          No brokers yet. Add them one by one, paste a list, or use the WhatsApp screenshot AI
          importer below.
        </div>
      )}

      <div className="space-y-2">
        {value.map((a, idx) => (
          <div
            key={a.id ?? idx}
            className="bg-[#FDFBF7] border border-[#B89555]/20 rounded-lg p-2"
          >
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 sm:col-span-3 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-[#1A1A1A]/60" />
                <Input
                  value={a.name || ""}
                  placeholder="Name (or Unknown)"
                  onChange={(e) => update(idx, { name: e.target.value })}
                />
              </div>
              <Input
                className="col-span-6 sm:col-span-2"
                value={a.phone || ""}
                placeholder="Phone"
                onChange={(e) => update(idx, { phone: e.target.value })}
              />
              <Input
                className="col-span-6 sm:col-span-2"
                value={a.whatsapp || ""}
                placeholder="WhatsApp"
                onChange={(e) => update(idx, { whatsapp: e.target.value })}
              />
              <Input
                className="col-span-12 sm:col-span-2"
                value={a.email || ""}
                placeholder="Email (optional)"
                onChange={(e) => update(idx, { email: e.target.value })}
              />
              <Input
                className="col-span-8 sm:col-span-2"
                value={a.role || ""}
                placeholder="Role / specialty"
                onChange={(e) => update(idx, { role: e.target.value })}
              />
              <div className="col-span-3 sm:col-span-1">
                <Select
                  value={a.status || "active"}
                  onValueChange={(v) => update(idx, { status: v as any })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.v} value={s.v}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 flex justify-end gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => toggle(idx)}
                  aria-label={expanded[idx] ? "Hide details" : "Show details"}
                  title="More details"
                >
                  {expanded[idx] ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => remove(idx)}
                  aria-label="Remove broker"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              {a.id && brokerageId && (
                <div className="col-span-12">
                  <QuickActivityActions
                    entityType="broker_agent"
                    entityId={a.id}
                    entityName={a.name || "Broker"}
                    brokerageId={brokerageId}
                  />
                </div>
              )}
            </div>

            {expanded[idx] && (
              <div className="mt-3 pt-3 border-t border-[#B89555]/15 grid grid-cols-12 gap-2">
                {/* Universal social + identity */}
                <Input
                  className="col-span-12 sm:col-span-6"
                  value={a.linkedin_url || ""}
                  placeholder="LinkedIn URL"
                  onChange={(e) => update(idx, { linkedin_url: e.target.value })}
                />
                <Input
                  className="col-span-12 sm:col-span-6"
                  value={a.instagram_url || ""}
                  placeholder="Instagram URL"
                  onChange={(e) => update(idx, { instagram_url: e.target.value })}
                />
                <Input
                  className="col-span-6 sm:col-span-3"
                  type="date"
                  value={a.birthday || ""}
                  onChange={(e) => update(idx, { birthday: e.target.value })}
                />
                <Input
                  className="col-span-6 sm:col-span-3"
                  value={a.nationality || ""}
                  placeholder="Nationality"
                  onChange={(e) => update(idx, { nationality: e.target.value })}
                />
                <Input
                  className="col-span-12 sm:col-span-6"
                  value={a.languages || ""}
                  placeholder="Languages (comma-separated)"
                  onChange={(e) => update(idx, { languages: e.target.value })}
                />

                {/* Location */}
                <Input
                  className="col-span-6 sm:col-span-3"
                  value={a.emirate || ""}
                  placeholder="Emirate"
                  onChange={(e) => update(idx, { emirate: e.target.value })}
                />
                <Input
                  className="col-span-12 sm:col-span-5"
                  value={a.office_address || ""}
                  placeholder="Office address"
                  onChange={(e) => update(idx, { office_address: e.target.value })}
                />
                <Input
                  className="col-span-12 sm:col-span-4"
                  value={a.google_maps_link || ""}
                  placeholder="Google Maps link"
                  onChange={(e) => update(idx, { google_maps_link: e.target.value })}
                />

                {/* Statuses */}
                <div className="col-span-6 sm:col-span-4">
                  <Select
                    value={a.partnership_status || ""}
                    onValueChange={(v) => update(idx, { partnership_status: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Partnership status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTNERSHIP_STATUS.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-6 sm:col-span-4">
                  <Select
                    value={a.verification_status || ""}
                    onValueChange={(v) => update(idx, { verification_status: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Verification" />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATUS.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-6 sm:col-span-4">
                  <Select
                    value={a.registration_status || ""}
                    onValueChange={(v) => update(idx, { registration_status: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Registration" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGISTRATION_STATUS.map((s) => (
                        <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Activity counters + dates */}
                <Input
                  className="col-span-6 sm:col-span-3"
                  type="number"
                  min={0}
                  value={a.inquiry_count ?? 0}
                  placeholder="Inquiries"
                  onChange={(e) => update(idx, { inquiry_count: Number(e.target.value) || 0 })}
                />
                <Input
                  className="col-span-6 sm:col-span-3"
                  type="number"
                  min={0}
                  value={a.closed_deals_count ?? 0}
                  placeholder="Closed deals"
                  onChange={(e) => update(idx, { closed_deals_count: Number(e.target.value) || 0 })}
                />
                <Input
                  className="col-span-6 sm:col-span-3"
                  type="datetime-local"
                  value={a.last_contact_at?.slice(0, 16) || ""}
                  onChange={(e) => update(idx, { last_contact_at: e.target.value })}
                />
                <Input
                  className="col-span-6 sm:col-span-3"
                  type="datetime-local"
                  value={a.last_verified_at?.slice(0, 16) || ""}
                  onChange={(e) => update(idx, { last_verified_at: e.target.value })}
                />
                <Input
                  className="col-span-12"
                  value={a.google_reviews_url || ""}
                  placeholder="Google reviews URL"
                  onChange={(e) => update(idx, { google_reviews_url: e.target.value })}
                />
                <textarea
                  className="col-span-12 text-sm rounded-md border border-[#B89555]/30 bg-[#FDFBF7] p-2 text-[#1A1A1A] min-h-[60px]"
                  value={a.notes || ""}
                  placeholder="Notes"
                  onChange={(e) => update(idx, { notes: e.target.value })}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-[#B89555]/20 pt-3">
        <div className="text-xs font-semibold text-[#1A1A1A] mb-1">
          Bulk paste (one broker per line — "Name - +9715…")
        </div>
        <textarea
          rows={3}
          value={bulkPaste}
          onChange={(e) => setBulkPaste(e.target.value)}
          placeholder={"e.g.\nAhmed Hassan +971501234567\nSara K, +971557654321"}
          className="w-full text-sm rounded-md border border-[#B89555]/30 bg-[#FDFBF7] p-2 text-[#1A1A1A]"
        />
        <div className="flex justify-end mt-2">
          <Button type="button" size="sm" variant="outline" onClick={importPaste} disabled={!bulkPaste.trim()}>
            Import pasted list
          </Button>
        </div>
      </div>
    </div>
  );
}
