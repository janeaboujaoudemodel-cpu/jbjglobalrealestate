import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, User } from "lucide-react";
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

export function BrokerageAgentsEditor({ value, onChange, brokerageId }: Props) {
  const [bulkPaste, setBulkPaste] = useState("");

  const update = (idx: number, patch: Partial<BrokerageAgentDraft>) => {
    onChange(value.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };
  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));
  const add = () => onChange([...value, { name: "", phone: "", status: "active", source: "manual" }]);

  const importPaste = () => {
    const lines = bulkPaste
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;
    const parsed: BrokerageAgentDraft[] = lines.map((line) => {
      // accept "Name - phone" / "Name, phone" / "phone" formats
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
        <div className="ml-auto flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={add}>
            <Plus className="w-3 h-3 mr-1" /> Add broker
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
            className="grid grid-cols-12 gap-2 items-center bg-[#FDFBF7] border border-[#B89555]/20 rounded-lg p-2"
          >
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
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="col-span-1"
              onClick={() => remove(idx)}
              aria-label="Remove broker"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
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
