import { useState } from "react";
import { FileText, Video, Image as ImageIcon, Link2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { MatchEditor } from "./MatchEditor";
import type { IngestionJob } from "@/hooks/useMediaIngestion";

interface IngestionCardProps {
  job: IngestionJob;
  selected: boolean;
  onSelect: (sel: boolean) => void;
  onReassign: (patch: any) => void;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function statusStyle(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case "auto_matched":
      return { bg: "bg-emerald-100", text: "text-emerald-800", label: "Auto-matched" };
    case "needs_review":
      return { bg: "bg-amber-100", text: "text-amber-800", label: "Needs review" };
    case "unmatched":
      return { bg: "bg-red-100", text: "text-red-800", label: "Unmatched" };
    case "merged":
      return { bg: "bg-blue-100", text: "text-blue-800", label: "Merged" };
    case "skipped":
      return { bg: "bg-zinc-200", text: "text-zinc-700", label: "Skipped" };
    case "processing":
      return { bg: "bg-purple-100", text: "text-purple-800", label: "Processing…" };
    case "pending":
      return { bg: "bg-zinc-100", text: "text-zinc-700", label: "Pending" };
    default:
      return { bg: "bg-zinc-100", text: "text-zinc-700", label: status };
  }
}

function FileIcon({ kind }: { kind: string | null }) {
  if (kind === "video" || kind === "video_tour")
    return <Video className="w-4 h-4" />;
  if (kind === "link") return <Link2 className="w-4 h-4" />;
  if (kind === "render" || kind === "image") return <ImageIcon className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

export function IngestionCard({ job, selected, onSelect, onReassign }: IngestionCardProps) {
  const [open, setOpen] = useState(false);
  const status = statusStyle(job.status);
  const isAi = (job.match_confidence ?? 0) > 0;

  return (
    <div
      className={`rounded-xl border bg-[#F7F2EA] p-3 transition-colors ${
        selected ? "border-gold ring-1 ring-gold" : "border-gold/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={(v) => onSelect(!!v)} />

        <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] text-gold flex items-center justify-center flex-shrink-0">
          <FileIcon
            kind={
              job.source_kind === "link"
                ? "link"
                : job.detected_doc_type ?? job.source_type
            }
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground truncate">
              {job.file_name || job.source_url || "(unnamed)"}
            </p>
            <Badge className={`${status.bg} ${status.text} border-0`}>{status.label}</Badge>
            {isAi && (
              <Badge className="bg-purple-600 text-white border-0">
                <Sparkles className="w-3 h-3 mr-1" />
                AI
              </Badge>
            )}
          </div>

          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {job.file_size ? <span>{formatSize(job.file_size)}</span> : null}
            {job.mime_type ? <span>{job.mime_type}</span> : null}
            {job.detected_doc_type ? <span>type: {job.detected_doc_type}</span> : null}
          </div>

          <div className="text-xs mt-2 space-y-0.5">
            <div className="text-foreground">
              <span className="text-muted-foreground">Developer:</span>{" "}
              <span className="font-medium">
                {job.detected_developer_name ?? "—"}
              </span>
              {job.developer_confidence ? (
                <span className="text-muted-foreground ml-1">
                  ({Math.round((job.developer_confidence ?? 0) * 100)}%)
                </span>
              ) : null}
            </div>
            <div className="text-foreground">
              <span className="text-muted-foreground">Project:</span>{" "}
              <span className="font-medium">{job.matched_project_name ?? "—"}</span>
              {job.match_confidence ? (
                <span className="text-muted-foreground ml-1">
                  ({Math.round((job.match_confidence ?? 0) * 100)}%)
                </span>
              ) : null}
            </div>
            {job.ai_summary && (
              <div className="text-muted-foreground italic line-clamp-2">
                {job.ai_summary}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-muted-foreground hover:text-foreground p-1"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="mt-3 pl-7">
          <MatchEditor
            developerId={job.detected_developer_id}
            projectId={job.matched_project_id}
            docType={job.detected_doc_type}
            onApply={onReassign}
          />
        </div>
      )}
    </div>
  );
}
