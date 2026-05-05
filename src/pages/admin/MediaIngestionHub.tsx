import { Component, type ErrorInfo, type ReactNode, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Inbox, ListChecks, History as HistoryIcon, Search } from "lucide-react";
import { useMediaIngestion, type IngestionJob } from "@/hooks/useMediaIngestion";
import { DropZone } from "@/components/listing-admin/media-ingestion/DropZone";
import { IngestionCard } from "@/components/listing-admin/media-ingestion/IngestionCard";
import { BulkToolbar } from "@/components/listing-admin/media-ingestion/BulkToolbar";
import { MergeHistory } from "@/components/listing-admin/media-ingestion/MergeHistory";

class HubErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[MediaIngestionHub] crashed", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto w-full max-w-2xl p-6">
          <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-6 text-center">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Media Ingestion Hub hit an error</h2>
            <p className="mt-2 text-sm text-[#1A1A1A]/70">
              {this.state.error.message || "Something went wrong rendering this page."}
            </p>
            <button
              onClick={() => this.setState({ error: null })}
              className="mt-4 rounded border border-[#B89555]/40 bg-[#EFE6D6] px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#E7DCC8]"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const STATUS_OPTIONS = [
  "all",
  "pending",
  "processing",
  "auto_matched",
  "needs_review",
  "unmatched",
  "merged",
  "skipped",
  "error",
];

interface MediaIngestionHubProps {
  embedded?: boolean;
}

const tabTriggerCls =
  "data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] " +
  "data-[state=active]:font-semibold data-[state=active]:border-b-2 " +
  "data-[state=active]:border-[#B89555] text-[#1A1A1A]/70 hover:text-[#1A1A1A] " +
  "rounded-md px-3 py-1.5 transition-colors";

function MediaIngestionHubInner({ embedded = false }: MediaIngestionHubProps = {}) {
  const {
    jobs,
    loading,
    busy,
    uploadFiles,
    addLinks,
    classify,
    approveAndMerge,
    extractOnly,
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
    const header = ["file_name", "source_url", "developer", "project", "doc_type", "status", "match_confidence"];
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
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-[#1A1A1A]">Media Ingestion Hub</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1 max-w-2xl mx-auto">
          Drop videos, PDFs, brochures and links in bulk. AI matches each one to the right
          developer & project. Review, then attach to your listings — or extract only the
          information without exposing the source file.
        </p>
      </header>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-[#F7F2EA] border border-[#B89555]/30 mx-auto flex justify-center">
          <TabsTrigger value="drop" className={tabTriggerCls}>
            <Inbox className="w-4 h-4 mr-2" /> Drop Zone
          </TabsTrigger>
          <TabsTrigger value="queue" className={tabTriggerCls}>
            <ListChecks className="w-4 h-4 mr-2" />
            Staging Queue ({jobs.filter((j) => j.status !== "merged" && j.status !== "skipped").length})
          </TabsTrigger>
          <TabsTrigger value="history" className={tabTriggerCls}>
            <HistoryIcon className="w-4 h-4 mr-2" /> Merge History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drop" className="mt-4">
          <DropZone onFiles={uploadFiles} onLinks={addLinks} busy={busy} />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
            {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
              <div
                key={s}
                className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-2 text-center"
              >
                <div className="text-[#1A1A1A] font-semibold">{counts[s] ?? 0}</div>
                <div className="text-[#1A1A1A]/60 capitalize">{s.replace("_", " ")}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="queue" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search filename, developer, project…"
                className="pl-8 bg-white border-[#B89555]/30 text-[#1A1A1A]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-[#B89555]/30 bg-white p-2 text-sm text-[#1A1A1A]"
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
            onAttach={() => approveAndMerge(selectedIds)}
            onExtract={() => extractOnly(selectedIds)}
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

          {loading && <p className="text-sm text-[#1A1A1A]/60">Loading queue…</p>}
          {!loading && filtered.length === 0 && (
            <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-8 text-center text-[#1A1A1A]/70">
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
                onAttach={() => approveAndMerge([job.id])}
                onExtract={() => extractOnly([job.id])}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <MergeHistory />
        </TabsContent>
      </Tabs>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[88px] [body.jj-vertical-nav-active_&]:md:pl-[200px] [body.jj-vertical-nav-collapsed_&]:md:pl-[48px] transition-all duration-300">
      <div className="p-6">{body}</div>
    </div>
  );
}

export default function MediaIngestionHub(props: MediaIngestionHubProps = {}) {
  return (
    <HubErrorBoundary>
      <MediaIngestionHubInner {...props} />
    </HubErrorBoundary>
  );
}
