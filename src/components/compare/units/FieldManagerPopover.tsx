import { useState } from "react";
import { Settings2, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UNIT_FIELDS, type UnitFieldId } from "@/lib/compare/unitFieldsConfig";

interface Props {
  visible: UnitFieldId[];
  onChange: (v: UnitFieldId[]) => void;
}

export default function FieldManagerPopover({ visible, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const toggle = (id: UnitFieldId) =>
    onChange(visible.includes(id) ? visible.filter(x => x !== id) : [...visible, id]);

  const grouped = UNIT_FIELDS.reduce<Record<string, typeof UNIT_FIELDS>>((acc, f) => {
    (acc[f.group] = acc[f.group] || []).push(f);
    return acc;
  }, {});

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          data-no-contrast-guard data-allow-dark-cta
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}
        >
          <Settings2 className="w-4 h-4" /> Manage fields
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 max-h-[420px] overflow-auto"
        style={{ background: "#0F1020", border: "1px solid rgba(255,255,255,0.18)", color: "#FFFFFF" }}
      >
        <div className="p-3">
          {Object.entries(grouped).map(([group, fields]) => (
            <div key={group} className="mb-3 last:mb-0">
              <div className="text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-1.5">{group}</div>
              <div className="space-y-1">
                {fields.map((f) => {
                  const on = visible.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggle(f.id)}
                      data-no-contrast-guard
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm text-white hover:bg-white/8"
                    >
                      <span>{f.label}</span>
                      <span
                        className="w-4 h-4 rounded flex items-center justify-center"
                        style={{
                          background: on ? "linear-gradient(135deg,#7C3AED,#EC4899)" : "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                      >
                        {on && <Check className="w-3 h-3 text-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
