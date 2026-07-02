import { useState } from "react";
import {
  FileText,
  Video,
  Image as ImageIcon,
  Link2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchEditor } from "./MatchEditor";
import type { IngestionJob } from "@/hooks/useMediaIngestion";

interface IngestionCardProps {
  job: IngestionJob;
  selected: boolean;
  onSelect: (sel: boolean) => void;
  onReassign: (patch: any) => void;
  onAttach: () => void;
  onExtract: () => void;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function statusStyle(status: string): { cls: string; label: string } {
  switch (status) {
    case "auto_matched":
      return { cls: "bg-[#ECFDF5] text-[#065F46] border border-[#10B981]/40", label: "Auto-matched" };
    case "needs_review":
      return { cls: "bg-[#FFFBEB] text-[#92400E] border border-[#F59E0B]/40", label: "Needs review" };
    case "unmatched":
      return { cls: "bg-[#FEF2F2] text-[#991B1B] border border-[#EF4444]/40", label: "Unmatched" };
    case "merged":
      return { cls: "bg-[#EFF6FF] text-[#1E40AF] border border-[#3B82F6]/40", label: "Merged" };
    case "skipped":
      return { cls: "bg-[#F7F2EA] text-[#1A1A1A]/70 border border-[#B89555]/30", label: "Skipped" };
    case "processing":
      return { cls: "bg-[#F5F3FF] text-[#5B21B6] border border-[#B89555]/40", label: "Processing…" };
    case "error":
      return { cls: "bg-[#FEF2F2] text-[#991B1B] border border-[#EF4444]/40", label: "Error" };
    case "pending":
      return { cls: "bg-[#F7F2EA] text-[#1A1A1A]/70 border border-[#B89555]/30", label: "Pending" };
    default:
      return { cls: "bg-[#F7F2EA] text-[#1A1A1A]/70 border border-[#B89555]/30", label: status };
  }
}

function FileIcon({ kind }: { kind: string | null }) {
  if (kind === "video" || kind === "video_tour") return <Video className="w-4 h-4" />;
  if (kind === "link") return <Link2 className="w-4 h-4" />;
  if (kind === "render" || kind === "image") return <ImageIcon className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
}

export function IngestionCard({
  job,
  selected,
  onSelect,
  onReassign,
  onAttach,
  onExtract,
}: IngestionCardProps) {
  const [open, setOpen] = useState(false);
  const status = statusStyle(job.status);
  const isAi = (job.match_confidence ?? 0) > 0;
  const canAct =
    !!job.matched_project_id &&
    job.status !== "merged" &&
    job.status !== "skipped" &&
    job.status !== "error";

  return (
    <div
      className={`rounded-xl border bg-[#F7F2EA] p-3 transition-colors ${
        selected ? "border-[#B89555] ring-1 ring-[#B89555]" : "border-[#B89555]/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={(v) => onSelect(!!v)} />

        <div className="w-10 h-10 rounded-xl bg-[#EFE6D6] ring-1 ring-[#B89555] flex items-center justify-center flex-shrink-0 text-[#1A1A1A]">
          <FileIcon
            kind={job.source_kind === "link" ? "link" : job.detected_doc_type ?? job.source_type}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-[#1A1A1A] truncate">
              {job.file_name || job.source_url || "(unnamed)"}
            </p>
            <Badge className={`${status.cls} font-medium`}>{status.label}</Badge>
            {isAi && (
              <Badge className="bg-[#F5F3FF] text-[#5B21B6] border border-[#B89555]/40">
                <Sparkles className="w-3 h-3 mr-1" /> AI
              </Badge>
            )}
            {job.merge_mode === "extract" && job.status === "merged" && (
              <Badge className="bg-[#F5F3FF] text-[#5B21B6] border border-[#B89555]/40">
                Extract-only
              </Badge>
            )}
          </div>

          <div className="text-xs text-[#1A1A1A]/60 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {job.file_size ? <span>{formatSize(job.file_size)}</span> : null}
            {job.mime_type ? <span>{job.mime_type}</span> : null}
            {job.detected_doc_type ? <span>type: {job.detected_doc_type}</span> : null}
          </div>

          {job.last_error && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-[#991B1B] bg-[#FEF2F2] border border-[#EF4444]/30 rounded p-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{job.last_error}</span>
            </div>
          )}

          <div className="text-xs mt-2 space-y-0.5">
            <div className="text-[#1A1A1A]">
              <span className="text-[#1A1A1A]/60">Developer:</span>{" "}
              <span className="font-medium">{job.detected_developer_name ?? "—"}</span>
              {job.developer_confidence ? (
                <span className="text-[#1A1A1A]/60 ml-1">
                  ({Math.round((job.developer_confidence ?? 0) * 100)}%)
                </span>
              ) : null}
            </div>
            <div className="text-[#1A1A1A]">
              <span className="text-[#1A1A1A]/60">Project:</span>{" "}
              <span className="font-medium">{job.matched_project_name ?? "—"}</span>
              {job.match_confidence ? (
                <span className="text-[#1A1A1A]/60 ml-1">
                  ({Math.round((job.match_confidence ?? 0) * 100)}%)
                </span>
              ) : null}
            </div>
            {job.ai_summary && (
              <div className="text-[#1A1A1A]/70 italic line-clamp-2">{job.ai_summary}</div>
            )}
          </div>

          {canAct && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="gold" onClick={onAttach}>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Attach to listing
              </Button>
              <Button size="sm" data-cta="dark" className="jj-cta-dark" onClick={onAttach}>
                <UploadCloud className="w-3.5 h-3.5 mr-1" /> Publish
              </Button>
              <Button size="sm" variant="outline" onClick={onExtract}>
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Extract only
              </Button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[#1A1A1A]/60 hover:text-[#1A1A1A] p-1"
          aria-label={open ? "Collapse" : "Expand"}
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
