/**
 * CRMListSidebar — left rail showing Active / Lists / Junk Bin / Trash.
 * Used in Leads, Brokerages, Developers tabs to switch the table view.
 */
import { Folder, Inbox, Trash2, Archive, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCRMLists, type CRMListKind } from "@/hooks/useCRMLists";

export type CRMListView =
  | { kind: "active"; listId: null }
  | { kind: "list"; listId: string }
  | { kind: "junk"; listId: null }
  | { kind: "trash"; listId: null };

interface Props {
  kind: CRMListKind;
  value: CRMListView;
  onChange: (v: CRMListView) => void;
  counts?: { active?: number; junk?: number; trash?: number; perList?: Record<string, number> };
}

export function CRMListSidebar({ kind, value, onChange, counts }: Props) {
  const { data: lists = [] } = useCRMLists(kind);

  const Item = ({
    active, icon: Icon, label, badge, onClick,
  }: { active: boolean; icon: any; label: string; badge?: number; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
        active
          ? "bg-[#EFE6D6] border border-[#B89555]/40 text-[#1A1A1A] font-semibold"
          : "text-[#1A1A1A]/80 hover:bg-[#F7F2EA] border border-transparent"
      }`}
    >
      <span className="flex items-center gap-2 truncate">
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </span>
      {typeof badge === "number" && (
        <span className="text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-white/70 border border-[#B89555]/20 text-[#1A1A1A]/70">
          {badge}
        </span>
      )}
    </button>
  );

  return (
    <aside className="w-56 shrink-0 bg-[#FDFBF7] border border-[#B89555]/25 rounded-xl p-2 space-y-1 self-start sticky top-[100px]">
      <Item
        active={value.kind === "active"}
        icon={Inbox}
        label="All active"
        badge={counts?.active}
        onClick={() => onChange({ kind: "active", listId: null })}
      />

      <div className="pt-2 pb-1 px-2 text-[10px] uppercase tracking-wide font-semibold text-[#1A1A1A]/60 flex items-center justify-between">
        <span>Databases</span>
        <span className="text-[#1A1A1A]/40">{lists.length}</span>
      </div>
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {lists.length === 0 && (
          <div className="text-[11px] text-[#1A1A1A]/50 px-2 py-1">
            Upload a file to create one.
          </div>
        )}
        {lists.map((l) => (
          <Item
            key={l.id}
            active={value.kind === "list" && value.listId === l.id}
            icon={Folder}
            label={l.name}
            badge={counts?.perList?.[l.id]}
            onClick={() => onChange({ kind: "list", listId: l.id })}
          />
        ))}
      </div>

      <div className="pt-2 pb-1 px-2 text-[10px] uppercase tracking-wide font-semibold text-[#1A1A1A]/60">
        System
      </div>
      <Item
        active={value.kind === "junk"}
        icon={Archive}
        label="Junk Bin"
        badge={counts?.junk}
        onClick={() => onChange({ kind: "junk", listId: null })}
      />
      <Item
        active={value.kind === "trash"}
        icon={Trash2}
        label="Trash (30 days)"
        badge={counts?.trash}
        onClick={() => onChange({ kind: "trash", listId: null })}
      />
    </aside>
  );
}
