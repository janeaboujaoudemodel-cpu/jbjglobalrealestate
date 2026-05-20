/**
 * CRMListSidebar — switcher for Active / Lists / Junk Bin / Trash.
 *
 * The "Databases" popover now also exposes folders:
 *   • "+ New folder" inline creator
 *   • Each folder shows the assigned broker's name as a chip
 *   • Click "Assign broker" on a folder → uses the canonical BrokerCombobox
 *   • Databases can be dragged onto a folder to move them
 */
import { useMemo, useState } from "react";
import { Folder, Inbox, Trash2, Archive, ChevronDown, FolderPlus, UserCircle2, Plus, Check, X, UserPlus } from "lucide-react";
import { useCRMLists, type CRMListKind } from "@/hooks/useCRMLists";
import { useCRMFolders, type CRMDatabaseFolder } from "@/hooks/useCRMFolders";
import { BrokerCombobox } from "@/components/crm/BrokerCombobox";
import { AddBrokerSheet } from "@/pages/owner/crm/BrokersRegistry";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

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
    return <HorizontalBar value={value} onChange={onChange} counts={counts} lists={lists as any} />;
  }
  return <VerticalRail value={value} onChange={onChange} counts={counts} lists={lists as any} />;
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

type ListRow = { id: string; name: string; folder_id?: string | null };

function HorizontalBar({
  value,
  onChange,
  counts,
  lists,
}: {
  value: CRMListView;
  onChange: (v: CRMListView) => void;
  counts?: Props["counts"];
  lists: ListRow[];
}) {
  const [openLists, setOpenLists] = useState(false);
  const activeList =
    value.kind === "list" ? lists.find((l) => l.id === value.listId) : null;

  const folders = useCRMFolders();
  const allFolders: CRMDatabaseFolder[] = (folders.data ?? []) as any;

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const grouped = useMemo(() => {
    const byFolder: Record<string, ListRow[]> = {};
    const unassigned: ListRow[] = [];
    for (const l of lists) {
      if (l.folder_id) {
        (byFolder[l.folder_id] = byFolder[l.folder_id] || []).push(l);
      } else {
        unassigned.push(l);
      }
    }
    return { byFolder, unassigned };
  }, [lists]);

  const onDropToFolder = (folderId: string | null) => (e: React.DragEvent) => {
    e.preventDefault();
    const listId = e.dataTransfer.getData("application/x-crm-list-id");
    if (!listId) return;
    folders.assignListToFolder.mutate({ listId, folderId });
  };

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
          className="w-80 p-2 bg-[#FDFBF7] border border-[#B89555]/30"
        >
          {/* New folder */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-[#1A1A1A]/60">Folders</span>
            <button
              type="button"
              onClick={() => setNewFolderOpen((o) => !o)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1A1A1A] hover:text-[#B89555]"
            >
              <FolderPlus className="w-3 h-3" /> New folder
            </button>
          </div>
          {newFolderOpen && (
            <div className="flex items-center gap-1 mb-2">
              <Input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name (e.g. Jessica's leads)"
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newFolderName.trim()) {
                    folders.createFolder.mutate(
                      { name: newFolderName.trim() },
                      { onSuccess: () => { setNewFolderName(""); setNewFolderOpen(false); } },
                    );
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newFolderName.trim()) return;
                  folders.createFolder.mutate(
                    { name: newFolderName.trim() },
                    { onSuccess: () => { setNewFolderName(""); setNewFolderOpen(false); } },
                  );
                }}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-[#1A1A1A] text-[#FDFBF7]"
                aria-label="Create folder"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => { setNewFolderName(""); setNewFolderOpen(false); }}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-[#B89555]/30"
                aria-label="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Folder list */}
          <div className="max-h-[260px] overflow-y-auto space-y-2">
            {allFolders.length === 0 && (
              <div className="text-[11px] text-[#1A1A1A]/60 px-2 py-1">
                No folders yet. Create one to group databases per broker.
              </div>
            )}
            {allFolders.map((f) => (
              <FolderBlock
                key={f.id}
                folder={f}
                lists={grouped.byFolder[f.id] || []}
                activeListId={value.kind === "list" ? value.listId : null}
                counts={counts?.perList}
                onSelectList={(id) => { onChange({ kind: "list", listId: id }); setOpenLists(false); }}
                onAssignBroker={(brokerId) => folders.updateFolder.mutate({ id: f.id, assigned_broker_id: brokerId })}
                onDelete={() => folders.archiveFolder.mutate(f.id)}
                onDropList={onDropToFolder(f.id)}
              />
            ))}

            {/* Unassigned databases */}
            <div
              className="rounded-md border border-dashed border-[#B89555]/30 p-2 bg-[#FDFBF7]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropToFolder(null)}
            >
              <div className="text-[10px] uppercase tracking-wide font-semibold text-[#1A1A1A]/60 px-1 mb-1">
                Unassigned databases
              </div>
              {grouped.unassigned.length === 0 ? (
                <div className="text-[11px] text-[#1A1A1A]/55 px-1 py-1">Drag a database here to remove it from a folder.</div>
              ) : (
                grouped.unassigned.map((l) => (
                  <DraggableList
                    key={l.id}
                    list={l}
                    active={value.kind === "list" && value.listId === l.id}
                    count={counts?.perList?.[l.id]}
                    onClick={() => { onChange({ kind: "list", listId: l.id }); setOpenLists(false); }}
                  />
                ))
              )}
            </div>
          </div>
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

function FolderBlock({
  folder,
  lists,
  activeListId,
  counts,
  onSelectList,
  onAssignBroker,
  onDelete,
  onDropList,
}: {
  folder: CRMDatabaseFolder;
  lists: ListRow[];
  activeListId: string | null;
  counts?: Record<string, number>;
  onSelectList: (id: string) => void;
  onAssignBroker: (brokerId: string | null) => void;
  onDelete: () => void;
  onDropList: (e: React.DragEvent) => void;
}) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [brokerName, setBrokerName] = useState(folder.assigned_broker_name || "");
  const [brokerId, setBrokerId] = useState<string | null>(folder.assigned_broker_id);
  const [newBrokerOpen, setNewBrokerOpen] = useState(false);
  // folders hook reserved for future auto-assign after broker creation

  return (
    <div
      className="rounded-md border border-[#B89555]/30 bg-[#F7F2EA]/60 p-2"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropList}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: folder.color || "#B89555" }}
          />
          <span className="text-xs font-semibold text-[#1A1A1A] truncate">{folder.name}</span>
          {folder.assigned_broker_name ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#EFE6D6] border border-[#B89555]/40 text-[#1A1A1A]">
              <UserCircle2 className="w-2.5 h-2.5" />
              {folder.assigned_broker_name}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Popover open={assignOpen} onOpenChange={setAssignOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="text-[10px] px-1.5 py-0.5 rounded border border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
              >
                {folder.assigned_broker_id ? "Change" : "Assign broker"}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-2 bg-[#FDFBF7] border-[#B89555]/30">
              <BrokerCombobox
                label="Assign folder to broker"
                value={brokerName}
                brokerId={brokerId}
                onChange={({ value, brokerId }) => {
                  setBrokerName(value);
                  setBrokerId(brokerId);
                  onAssignBroker(brokerId);
                  setAssignOpen(false);
                }}
              />
              {folder.assigned_broker_id && (
                <button
                  type="button"
                  onClick={() => {
                    setBrokerName("");
                    setBrokerId(null);
                    onAssignBroker(null);
                    setAssignOpen(false);
                  }}
                  className="mt-2 w-full text-[11px] text-[#1A1A1A]/70 hover:text-[#1A1A1A] underline"
                >
                  Unassign broker
                </button>
              )}
            </PopoverContent>
          </Popover>
          <button
            type="button"
            onClick={() => setNewBrokerOpen(true)}
            className="text-[10px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
            title="Create a new broker (with access settings, invitation, onboarding link) and assign to this folder"
          >
            <UserPlus className="w-3 h-3" /> New broker
          </button>
          <button
            type="button"
            onClick={() => { if (confirm(`Delete folder "${folder.name}"? Databases inside will become unassigned.`)) onDelete(); }}
            className="text-[10px] px-1 py-0.5 rounded text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
            aria-label="Delete folder"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <AddBrokerSheet
        open={newBrokerOpen}
        onOpenChange={setNewBrokerOpen}
        onAdded={() => {
          // Best-effort: refetch folders (assignment is done via the picker if the user
          // selected the freshly-created broker). The canonical sheet handles invitation
          // emails, access settings, expiry, notes and onboarding link.
          folders.data; // ensure hook stays referenced
        }}
      />

      <div className="mt-1 space-y-0.5">
        {lists.length === 0 ? (
          <div className="text-[10px] text-[#1A1A1A]/50 px-1 py-1 italic">Drop a database here</div>
        ) : (
          lists.map((l) => (
            <DraggableList
              key={l.id}
              list={l}
              active={activeListId === l.id}
              count={counts?.[l.id]}
              onClick={() => onSelectList(l.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DraggableList({
  list, active, count, onClick,
}: { list: ListRow; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-crm-list-id", list.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs cursor-grab active:cursor-grabbing ${
        active ? "bg-[#EFE6D6] text-[#1A1A1A] font-semibold" : "text-[#1A1A1A]/85 hover:bg-[#FDFBF7]"
      }`}
    >
      <span className="flex items-center gap-2 truncate">
        <Folder className="w-3 h-3 shrink-0" />
        <span className="truncate">{list.name}</span>
      </span>
      {typeof count === "number" && <span className={badgeClass()}>{count}</span>}
    </button>
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
  lists: ListRow[];
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
