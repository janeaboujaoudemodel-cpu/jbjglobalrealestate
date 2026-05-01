import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Inbox, ListChecks, History as HistoryIcon, Search } from "lucide-react";
import { useMediaIngestion, type IngestionJob } from "@/hooks/useMediaIngestion";
import { DropZone } from "@/components/listing-admin/media-ingestion/DropZone";
import { IngestionCard } from "@/components/listing-admin/media-ingestion/IngestionCard";
import { BulkToolbar } from "@/components/listing-admin/media-ingestion/BulkToolbar";
import { MergeHistory } from "@/components/listing-admin/media-ingestion/MergeHistory";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "processing",
  "auto_matched",
  "needs_review",
  "unmatched",
  "merged",
  "skipped",
];

interface MediaIngestionHubProps {
  /**
   * When true, render without the full-screen page wrapper (no min-h-screen,
   * no top spacer, no max-width container). Use when embedding inside another
   * page such as Owner Templates.
   */
  embedded?: boolean;
}

export default function MediaIngestionHub({ embedded = false }: MediaIngestionHubProps = {}) {
  const {
    jobs,
    loading,
    busy,
    uploadFiles,
    addLinks,
    classify,
    approveAndMerge,
    skip,
    remove,
    duplicate,
    reassign,
  } = useMediaIngestion();

  const [tab, setTab] = useState("drop");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (statusFilter !== "all" && j.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [
          j.file_name,
          j.source_url,
          j.detected_developer_name,
          j.matched_project_name,
          j.detected_doc_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [jobs, statusFilter, search]);

  const toggleOne = (id: string, sel: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (sel) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectedIds = Array.from(selected);

  const exportCsv = () => {
    const rows = jobs.filter((j) => selected.has(j.id));
    const header = [
      "file_name",
      "source_url",
      "developer",
      "project",
      "doc_type",
      "status",
      "match_confidence",
    ];
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        [
          r.file_name ?? "",
          r.source_url ?? "",
          r.detected_developer_name ?? "",
          r.matched_project_name ?? "",
          r.detected_doc_type ?? "",
          r.status ?? "",
          r.match_confidence ?? "",
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `media-ingestion-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const j of jobs) c[j.status] = (c[j.status] ?? 0) + 1;
    return c;
  }, [jobs]);

  const body = (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Media Ingestion Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Drop videos, PDFs, brochures and links in bulk. AI matches each one to the right
          developer & project. Review, then merge into your published listings.
        </p>
      </header>
      <IngestionTabs
        tab={tab}
        setTab={setTab}
        jobs={jobs}
        filtered={filtered}
        loading={loading}
        busy={busy}
        counts={counts}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        search={search}
        setSearch={setSearch}
        selected={selected}
        setSelected={setSelected}
        selectedIds={selectedIds}
        toggleOne={toggleOne}
        uploadFiles={uploadFiles}
        addLinks={addLinks}
        classify={classify}
        approveAndMerge={approveAndMerge}
        skip={skip}
        remove={remove}
        duplicate={duplicate}
        reassign={reassign}
        exportCsv={exportCsv}
      />
    </div>
  );

  if (embedded) {
    return body;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[88px] [body.jj-vertical-nav-active_&]:md:pl-[200px] [body.jj-vertical-nav-collapsed_&]:md:pl-[48px] transition-all duration-300">
      <div className="max-w-7xl mx-auto p-6">{body}</div>
    </div>
  );
}

interface IngestionTabsProps {
  tab: string;
  setTab: (v: string) => void;
  jobs: IngestionJob[];
  filtered: IngestionJob[];
  loading: boolean;
  busy: boolean;
  counts: Record<string, number>;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedIds: string[];
  toggleOne: (id: string, sel: boolean) => void;
  uploadFiles: (files: File[]) => Promise<void>;
  addLinks: (urls: string[]) => Promise<void>;
  classify: (ids: string[]) => Promise<void>;
  approveAndMerge: (ids: string[]) => Promise<void>;
  skip: (ids: string[]) => Promise<void>;
  remove: (ids: string[]) => Promise<void>;
  duplicate: (ids: string[]) => Promise<void>;
  reassign: (ids: string[], patch: any) => Promise<void>;
  exportCsv: () => void;
}

function IngestionTabs(props: IngestionTabsProps) {
  const {
    tab, setTab, jobs, filtered, loading, busy, counts,
    statusFilter, setStatusFilter, search, setSearch,
    selected, setSelected, selectedIds, toggleOne,
    uploadFiles, addLinks, classify, approveAndMerge,
    skip, remove, duplicate, reassign, exportCsv,
  } = props;
  return (
    <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#EFE6D6] border border-gold/30">
            <TabsTrigger
              value="drop"
              className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-gold"
            >
              <Inbox className="w-4 h-4 mr-2" /> Drop Zone
            </TabsTrigger>
            <TabsTrigger
              value="queue"
              className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-gold"
            >
              <ListChecks className="w-4 h-4 mr-2" />
              Staging Queue ({jobs.filter((j) => j.status !== "merged" && j.status !== "skipped").length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-[#1A1A1A] data-[state=active]:text-gold"
            >
              <HistoryIcon className="w-4 h-4 mr-2" /> Merge History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drop" className="mt-4">
            <DropZone onFiles={uploadFiles} onLinks={addLinks} busy={busy} />
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
              {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                <div
                  key={s}
                  className="rounded-lg border border-gold/30 bg-[#F7F2EA] p-2 text-center"
                >
                  <div className="text-foreground font-semibold">{counts[s] ?? 0}</div>
                  <div className="text-muted-foreground capitalize">{s.replace("_", " ")}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="queue" className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search filename, developer, project…"
                  className="pl-8 bg-white border-gold/30"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded border border-gold/30 bg-white p-2 text-sm text-foreground"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s === "all" ? "All statuses" : s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <BulkToolbar
              count={selected.size}
              total={filtered.length}
              busy={busy}
              onSelectAll={() => setSelected(new Set(filtered.map((j) => j.id)))}
              onInvert={() =>
                setSelected((prev) => {
                  const next = new Set<string>();
                  for (const j of filtered) if (!prev.has(j.id)) next.add(j.id);
                  return next;
                })
              }
              onClear={() => setSelected(new Set())}
              onApprove={() => approveAndMerge(selectedIds)}
              onSkip={() => skip(selectedIds)}
              onDelete={() => {
                if (confirm(`Delete ${selectedIds.length} item(s)? This cannot be undone.`)) {
                  remove(selectedIds);
                  setSelected(new Set());
                }
              }}
              onDuplicate={() => duplicate(selectedIds)}
              onReclassify={() => classify(selectedIds)}
              onExportCsv={exportCsv}
            />

            {loading && <p className="text-sm text-muted-foreground">Loading queue…</p>}
            {!loading && filtered.length === 0 && (
              <div className="rounded-xl border border-gold/30 bg-[#F7F2EA] p-8 text-center text-muted-foreground">
                Nothing in the queue. Drop files in the Drop Zone tab.
              </div>
            )}

            <div className="space-y-2">
              {filtered.map((job: IngestionJob) => (
                <IngestionCard
                  key={job.id}
                  job={job}
                  selected={selected.has(job.id)}
                  onSelect={(sel) => toggleOne(job.id, sel)}
                  onReassign={(patch) => reassign([job.id], patch)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <MergeHistory />
          </TabsContent>
        </Tabs>
  );
}
