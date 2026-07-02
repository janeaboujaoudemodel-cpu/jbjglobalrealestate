import { useMemo, useState } from "react";
import {
  ChevronRight,
  Clock,
  Download,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Filter,
  Folder,
  FolderPlus,
  Grid3x3,
  Link2,
  List as ListIcon,
  MoreHorizontal,
  Plus,
  Search,
  Share2,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
  Users,
} from "lucide-react";

/**
 * Phase 17 — Documents Library.
 * Zoho Documents parity: left folder tree, breadcrumbs, filter chips,
 * list / grid toggle, upload/new dropzone, bulk selection bar.
 * Standalone (no data source yet). All strings + folders local.
 */

type FolderNode = {
  id: string;
  label: string;
  icon: typeof Folder;
  count: number;
  children?: FolderNode[];
};

const FOLDER_TREE: FolderNode[] = [
  { id: "recent", label: "Recent", icon: Clock, count: 12 },
  { id: "starred", label: "Starred", icon: Star, count: 4 },
  { id: "shared", label: "Shared with me", icon: Users, count: 7 },
  {
    id: "my",
    label: "My Files",
    icon: Folder,
    count: 34,
    children: [
      { id: "my-listings", label: "Listing packs", icon: Folder, count: 12 },
      { id: "my-contracts", label: "Contracts", icon: Folder, count: 9 },
      { id: "my-brochures", label: "Brochures", icon: Folder, count: 7 },
      { id: "my-media", label: "Media assets", icon: Folder, count: 6 },
    ],
  },
  {
    id: "team",
    label: "Team Folders",
    icon: Folder,
    count: 58,
    children: [
      { id: "team-legal", label: "Legal templates", icon: Folder, count: 18 },
      { id: "team-hr", label: "HR & onboarding", icon: Folder, count: 11 },
      { id: "team-marketing", label: "Marketing", icon: Folder, count: 15 },
      { id: "team-finance", label: "Finance", icon: Folder, count: 14 },
    ],
  },
  { id: "trash", label: "Trash", icon: Trash2, count: 3 },
];

type FileRow = {
  id: string;
  name: string;
  kind: "doc" | "sheet" | "image" | "zip" | "pdf";
  size: string;
  owner: string;
  modified: string;
  shared?: boolean;
  starred?: boolean;
};

const FILES: FileRow[] = [
  { id: "1", name: "JBJ Master Listing Authorisation.pdf", kind: "pdf", size: "412 KB", owner: "Jane Bishop", modified: "Today · 09:14", starred: true, shared: true },
  { id: "2", name: "Palm Jebel Ali — Villa Payment Plan.xlsx", kind: "sheet", size: "88 KB", owner: "Aisha M.", modified: "Today · 08:02", shared: true },
  { id: "3", name: "Q4 Broker Onboarding Deck.pdf", kind: "pdf", size: "6.4 MB", owner: "Marketing", modified: "Yesterday · 17:38" },
  { id: "4", name: "Emaar — Golf Verde Brochure.pdf", kind: "pdf", size: "18.2 MB", owner: "Nada K.", modified: "Yesterday · 12:11", starred: true },
  { id: "5", name: "Client Journey Storyboard.docx", kind: "doc", size: "142 KB", owner: "Jane Bishop", modified: "2 days ago" },
  { id: "6", name: "Hero cover — Downtown skyline.png", kind: "image", size: "3.1 MB", owner: "Creative", modified: "3 days ago", shared: true },
  { id: "7", name: "Legal templates — bundle.zip", kind: "zip", size: "24.9 MB", owner: "Legal", modified: "Last week" },
  { id: "8", name: "Investor KYC checklist v3.pdf", kind: "pdf", size: "220 KB", owner: "Compliance", modified: "Last week" },
];

const KIND_ICON: Record<FileRow["kind"], typeof FileText> = {
  doc: FileText,
  sheet: FileSpreadsheet,
  image: FileImage,
  zip: FileArchive,
  pdf: FileText,
};

const KIND_TONE: Record<FileRow["kind"], string> = {
  doc: "#1E40AF",
  sheet: "#065F46",
  image: "#7C3AED",
  zip: "#92400E",
  pdf: "#B91C1C",
};

export default function CrmDocumentsLibrary() {
  const [activeFolder, setActiveFolder] = useState<string>("my");
  const [view, setView] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query.trim()) return FILES;
    const q = query.toLowerCase();
    return FILES.filter((f) => f.name.toLowerCase().includes(q) || f.owner.toLowerCase().includes(q));
  }, [query]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allSelected = filtered.length > 0 && filtered.every((f) => selected.has(f.id));

  const renderFolder = (n: FolderNode, depth = 0) => {
    const Icon = n.icon;
    const active = activeFolder === n.id;
    return (
      <div key={n.id}>
        <button
          type="button"
          className="jc-doclib__folder"
          data-active={active || undefined}
          style={{ paddingLeft: 12 + depth * 14 }}
          onClick={() => setActiveFolder(n.id)}
        >
          <Icon size={17} />
          <span className="jc-doclib__folder-label">{n.label}</span>
          <span className="jc-doclib__folder-count">{n.count}</span>
        </button>
        {n.children?.map((c) => renderFolder(c, depth + 1))}
      </div>
    );
  };

  return (
    <div className="jc-doclib">
      {/* LEFT — folder tree */}
      <aside className="jc-doclib__side" aria-label="Document folders">
        <button type="button" className="jc-doclib__new">
          <Plus size={18} />
          <span>New</span>
        </button>
        <div className="jc-doclib__side-scroll">
          {FOLDER_TREE.map((n) => renderFolder(n))}
        </div>
        <div className="jc-doclib__quota" aria-label="Storage quota">
          <div className="jc-doclib__quota-head">
            <span>Storage</span>
            <span className="jc-doclib__quota-num">3.4 / 25 GB</span>
          </div>
          <div className="jc-doclib__quota-bar"><span style={{ width: "13.6%" }} /></div>
          <button type="button" className="jc-doclib__quota-cta">Upgrade storage</button>
        </div>
      </aside>

      {/* RIGHT — files pane */}
      <section className="jc-doclib__main" aria-label="Documents">
        <div className="jc-doclib__crumbs">
          <span>Documents</span>
          <ChevronRight size={14} />
          <span>My Files</span>
        </div>

        <div className="jc-doclib__toolbar">
          <label className="jc-doclib__search">
            <Search size={17} />
            <input
              placeholder="Search files, folders, owners…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <button type="button" className="jc-doclib__chip"><Filter size={15} /> Filter</button>
          <button type="button" className="jc-doclib__chip"><SlidersHorizontal size={15} /> Sort: Modified</button>
          <div className="jc-doclib__toolbar-spacer" />
          <button type="button" className="jc-doclib__chip"><FolderPlus size={15} /> New folder</button>
          <button type="button" className="jc-doclib__chip jc-doclib__chip--primary"><Upload size={15} /> Upload</button>
          <div className="jc-doclib__viewtoggle" role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={view === "list"}
              data-active={view === "list" || undefined}
              onClick={() => setView("list")}
            >
              <ListIcon size={16} />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "grid"}
              data-active={view === "grid" || undefined}
              onClick={() => setView("grid")}
            >
              <Grid3x3 size={16} />
            </button>
          </div>
        </div>

        {selected.size > 0 && (
          <div className="jc-doclib__bulk">
            <span>{selected.size} selected</span>
            <div className="jc-doclib__bulk-spacer" />
            <button type="button"><Download size={15} /> Download</button>
            <button type="button"><Share2 size={15} /> Share</button>
            <button type="button"><Link2 size={15} /> Copy link</button>
            <button type="button"><Trash2 size={15} /> Delete</button>
            <button type="button" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}

        {view === "list" ? (
          <div className="jc-doclib__table" role="table">
            <div className="jc-doclib__thead" role="row">
              <div className="jc-doclib__th jc-doclib__th--check">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={() => setSelected(allSelected ? new Set() : new Set(filtered.map((f) => f.id)))}
                />
              </div>
              <div className="jc-doclib__th">Name</div>
              <div className="jc-doclib__th">Owner</div>
              <div className="jc-doclib__th">Size</div>
              <div className="jc-doclib__th">Modified</div>
              <div className="jc-doclib__th jc-doclib__th--actions" />
            </div>
            {filtered.map((f) => {
              const Icon = KIND_ICON[f.kind];
              const checked = selected.has(f.id);
              return (
                <div
                  key={f.id}
                  className="jc-doclib__row"
                  role="row"
                  data-selected={checked || undefined}
                >
                  <div className="jc-doclib__td jc-doclib__th--check">
                    <input type="checkbox" checked={checked} onChange={() => toggle(f.id)} aria-label={`Select ${f.name}`} />
                  </div>
                  <div className="jc-doclib__td jc-doclib__td--name">
                    <span className="jc-doclib__ficon" style={{ color: KIND_TONE[f.kind] }}>
                      <Icon size={18} />
                    </span>
                    <span className="jc-doclib__fname">{f.name}</span>
                    {f.starred && <Star size={13} className="jc-doclib__star" />}
                    {f.shared && <span className="jc-doclib__pill">Shared</span>}
                  </div>
                  <div className="jc-doclib__td">{f.owner}</div>
                  <div className="jc-doclib__td">{f.size}</div>
                  <div className="jc-doclib__td">{f.modified}</div>
                  <div className="jc-doclib__td jc-doclib__th--actions">
                    <button type="button" aria-label="More"><MoreHorizontal size={17} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="jc-doclib__grid">
            {filtered.map((f) => {
              const Icon = KIND_ICON[f.kind];
              const checked = selected.has(f.id);
              return (
                <div key={f.id} className="jc-doclib__card" data-selected={checked || undefined}>
                  <div className="jc-doclib__card-head">
                    <input type="checkbox" checked={checked} onChange={() => toggle(f.id)} aria-label={`Select ${f.name}`} />
                    <button type="button" aria-label="More"><MoreHorizontal size={17} /></button>
                  </div>
                  <div className="jc-doclib__card-thumb" style={{ color: KIND_TONE[f.kind] }}>
                    <Icon size={44} />
                  </div>
                  <div className="jc-doclib__card-name" title={f.name}>{f.name}</div>
                  <div className="jc-doclib__card-meta">
                    <span>{f.owner}</span>
                    <span>·</span>
                    <span>{f.size}</span>
                  </div>
                  <div className="jc-doclib__card-foot">
                    <span>{f.modified}</span>
                    {f.starred && <Star size={13} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
