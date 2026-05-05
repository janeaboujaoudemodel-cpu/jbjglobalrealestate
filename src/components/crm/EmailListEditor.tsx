import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Plus, Trash2 } from "lucide-react";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/* ---------- Single-select with saved history (Primary sender) ---------- */
export function PrimarySenderEditor({
  saved,
  active,
  onChange,
}: {
  saved: string[];
  active: string;
  onChange: (next: { saved: string[]; active: string }) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!isEmail(v)) return;
    const nextSaved = saved.includes(v) ? saved : [...saved, v];
    onChange({ saved: nextSaved, active: v });
    setDraft("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  const remove = (v: string) => {
    const nextSaved = saved.filter((s) => s !== v);
    onChange({ saved: nextSaved, active: active === v ? (nextSaved[0] || "") : active });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {saved.length === 0 && (
          <span className="text-xs text-[#1A1A1A]/70 italic">No saved sender emails yet — add one below.</span>
        )}
        {saved.map((email) => {
          const isActive = email === active;
          return (
            <div
              key={email}
              className={`group inline-flex items-center gap-1 pl-2.5 pr-1 h-8 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60"
                  : "bg-[#FDFBF7] text-[#1A1A1A] border-[#1A1A1A]/15 hover:bg-[#F7F2EA]"
              }`}
              onClick={() => onChange({ saved, active: email })}
              title={isActive ? "Active primary sender" : "Click to use as primary sender"}
            >
              {isActive && <Check className="w-3 h-3 text-[#1A1A1A]" />}
              <span className="truncate max-w-[200px]">{email}</span>
              <button
                type="button"
                className="ml-1 p-1 rounded-full hover:bg-[#1A1A1A]/10"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(email);
                }}
                aria-label={`Remove ${email}`}
              >
                <Trash2 className="w-3 h-3 text-[#1A1A1A]/70" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="add another sender email…"
          className="h-9 text-sm"
        />
        <Button type="button" onClick={add} disabled={!isEmail(draft)} variant="outline" className="h-9 border-[#1A1A1A]/20 text-[#1A1A1A] hover:bg-[#EFE6D6]">
          <Plus className="w-3.5 h-3.5 mr-1" />Add
        </Button>
      </div>
    </div>
  );
}

/* ---------- Multi-select with saved history (CC emails) ---------- */
export function CcListEditor({
  saved,
  active,
  onChange,
}: {
  saved: string[];
  active: string[];
  onChange: (next: { saved: string[]; active: string[] }) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!isEmail(v)) return;
    const nextSaved = saved.includes(v) ? saved : [...saved, v];
    const nextActive = active.includes(v) ? active : [...active, v];
    onChange({ saved: nextSaved, active: nextActive });
    setDraft("");
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  const toggle = (v: string) => {
    const nextActive = active.includes(v) ? active.filter((x) => x !== v) : [...active, v];
    onChange({ saved, active: nextActive });
  };

  const remove = (v: string) => {
    onChange({ saved: saved.filter((s) => s !== v), active: active.filter((s) => s !== v) });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {saved.length === 0 && (
          <span className="text-xs text-[#1A1A1A]/70 italic">No saved CC emails yet — add one below.</span>
        )}
        {saved.map((email) => {
          const isActive = active.includes(email);
          return (
            <div
              key={email}
              className={`group inline-flex items-center gap-1 pl-2.5 pr-1 h-8 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60"
                  : "bg-[#FDFBF7] text-[#1A1A1A] border-[#1A1A1A]/15 hover:bg-[#F7F2EA]"
              }`}
              onClick={() => toggle(email)}
              title={isActive ? "Click to stop CCing this address" : "Click to CC this address"}
            >
              {isActive && <Check className="w-3 h-3 text-[#1A1A1A]" />}
              <span className="truncate max-w-[200px]">{email}</span>
              <button
                type="button"
                className="ml-1 p-1 rounded-full hover:bg-[#1A1A1A]/10"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(email);
                }}
                aria-label={`Remove ${email}`}
              >
                <Trash2 className="w-3 h-3 text-[#1A1A1A]/70" />
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="add another CC email…"
          className="h-9 text-sm"
        />
        <Button type="button" onClick={add} disabled={!isEmail(draft)} variant="outline" className="h-9 border-[#1A1A1A]/20 text-[#1A1A1A] hover:bg-[#EFE6D6]">
          <Plus className="w-3.5 h-3.5 mr-1" />Add
        </Button>
      </div>
      <p className="text-xs text-[#1A1A1A]/70">
        Saved CC addresses stay here forever — click a chip to toggle whether it's CC'd on the next send.
      </p>
    </div>
  );
}
