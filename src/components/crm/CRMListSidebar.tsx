/**
 * CRMListSidebar — switcher for Active / Lists / Junk Bin / Trash.
 * Default `orientation="horizontal"` renders a single-row pill bar above
 * the filters so it never narrows the main column. Set `orientation="vertical"`
 * to keep the legacy left-rail layout.
 */
import { useState } from "react";
import { Folder, Inbox, Trash2, Archive, ChevronDown } from "lucide-react";
import { useCRMLists, type CRMListKind } from "@/hooks/useCRMLists";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  orientation?: "horizontal" | "vertical";
}

export function CRMListSidebar({ kind, value, onChange, counts, orientation = "horizontal" }: Props) {
  const { data: lists = [] } = useCRMLists(kind);

  if (orientation === "horizontal") {
    return <HorizontalBar value={value} onChange={onChange} counts={counts} lists={lists} />;
  }
  return <VerticalRail value={value} onChange={onChange} counts={counts} lists={lists} />;
}

function pillClass(active: boolean) {
  return `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
    active
      ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60"
      : "bg-[#FDFBF7] text-[#1A1A1A]/80 border-[#B89555]/25 hover:bg-[#F7F2EA] hover:text-[#1A1A1A]"
  }`;
}

function badgeClass() {
  return "ml-1 text-[10px] tabular-nums px-1.5 py-0.5 rounded bg-white/80 border border-[#B89555]/25 text-[#1A1A1A]/70";
}

function HorizontalBar({
  value,
  onChange,
  counts,
  lists,
}: {
  value: CRMListView;
  onChange: (v: CRMListView) => void;
  counts?: Props["counts"];
  lists: { id: string; name: string }[];
}) {
  const [openLists, setOpenLists] = useState(false);
  const activeList =
    value.kind === "list" ? lists.find((l) => l.id === value.listId) : null;

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <button
        type="button"
        className={pillClass(value.kind === "active")}
        onClick={() => onChange({ kind: "active", listId: null })}
      >
        <Inbox className="w-3.5 h-3.5" />
        All active
        {typeof counts?.active === "number" && <span className={badgeClass()}>{counts.active}</span>}
      </button>

      <Popover open={openLists} onOpenChange={setOpenLists}>
        <PopoverTrigger asChild>
          <button type="button" className={pillClass(value.kind === "list")}>
            <Folder className="w-3.5 h-3.5" />
            {activeList ? activeList.name : "Databases"}
            <span className={badgeClass()}>{lists.length}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-64 p-1 bg-[#FDFBF7] border border-[#B89555]/30"
        >
          {lists.length === 0 && (
            <div className="text-[11px] text-[#1A1A1A]/60 px-2 py-2">
              Upload a file to create a database.
            </div>
          )}
          {lists.map((l) => {
            const active = value.kind === "list" && value.listId === l.id;
            return (
              <button
                key={l.id}
                onClick={() => {
                  onChange({ kind: "list", listId: l.id });
                  setOpenLists(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs ${
                  active
                    ? "bg-[#EFE6D6] text-[#1A1A1A] font-semibold"
                    : "text-[#1A1A1A]/85 hover:bg-[#F7F2EA]"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Folder className="w-3 h-3 shrink-0" />
                  <span className="truncate">{l.name}</span>
                </span>
                {typeof counts?.perList?.[l.id] === "number" && (
                  <span className={badgeClass()}>{counts.perList[l.id]}</span>
                )}
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      <button
        type="button"
        className={pillClass(value.kind === "junk")}
        onClick={() => onChange({ kind: "junk", listId: null })}
      >
        <Archive className="w-3.5 h-3.5" />
        Junk Bin
        {typeof counts?.junk === "number" && <span className={badgeClass()}>{counts.junk}</span>}
      </button>

      <button
        type="button"
        className={pillClass(value.kind === "trash")}
        onClick={() => onChange({ kind: "trash", listId: null })}
      >
        <Trash2 className="w-3.5 h-3.5" />
        Trash · 30 days
        {typeof counts?.trash === "number" && <span className={badgeClass()}>{counts.trash}</span>}
      </button>
    </div>
  );
}

function VerticalRail({
  value,
  onChange,
  counts,
  lists,
}: {
  value: CRMListView;
  onChange: (v: CRMListView) => void;
  counts?: Props["counts"];
  lists: { id: string; name: string }[];
}) {
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
      {typeof badge === "number" && <span className={badgeClass()}>{badge}</span>}
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
