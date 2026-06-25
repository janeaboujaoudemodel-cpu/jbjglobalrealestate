import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Mail,
  RefreshCw,
  Send,
  Stamp,
  X,
} from "lucide-react";
import {
  DeveloperRequestType,
  useDeveloperActionItems,
  useDismissActionItem,
  useDocumentLibraryLinks,
  useSendDeveloperReply,
  useSyncGmailInbox,
} from "@/hooks/useDeveloperActionItems";

const TYPE_LABEL: Record<DeveloperRequestType, string> = {
  docs_library: "Documents library",
  vat_certificate: "VAT certificate",
  mou: "MOU",
  license: "Trade license",
  registration: "Registration",
  contract_signature: "Contract signature",
  other: "Other",
};

const TYPE_TONE: Record<DeveloperRequestType, "gold" | "emerald" | "blue" | "amber" | "purple" | "rose" | "ink"> = {
  docs_library: "gold",
  vat_certificate: "emerald",
  mou: "blue",
  license: "amber",
  registration: "blue",
  contract_signature: "purple",
  other: "gold",
};

export default function DeveloperActionsRail() {
  const [filter, setFilter] = useState<"open" | "all">("open");
  const { data: items = [], isLoading } = useDeveloperActionItems();
  const { data: links = [] } = useDocumentLibraryLinks();
  const sync = useSyncGmailInbox();
  const sendReply = useSendDeveloperReply();
  const dismiss = useDismissActionItem();

  const visible = useMemo(() => {
    if (filter === "open") {
      return items.filter((i) => i.status === "pending" || i.status === "awaiting_owner");
    }
    return items;
  }, [items, filter]);

  const defaultLink = useMemo(() => links.find((l) => l.is_default) ?? links[0], [links]);

  function findLink(type: DeveloperRequestType) {
    return links.find((l) => l.applicable_request_types.includes(type)) ?? defaultLink;
  }

  return (
    <Card className="bg-[#F7F2EA] border-[#B89555]/20 sticky top-[104px]">
      <CardHeader className="pb-3 border-b border-[#B89555]/15">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-[#1A1A1A] text-base">
            <IconTile icon={AlertCircle} tone="amber" size="sm" />
            Required Actions
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
            className="h-8 text-xs border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${sync.isPending ? "animate-spin" : ""}`} />
            Sync inbox
          </Button>
        </div>
        <div className="flex items-center gap-1 pt-2">
          {(["open", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
 filter === f
 ? "bg-[#EFE6D6] text-[#1A1A1A]"
 : "text-[#1A1A1A]/70 hover:bg-[#EFE6D6]/10"
 }`}
            >
              {f === "open" ? `Open (${items.filter((i) => i.status === "pending" || i.status === "awaiting_owner").length})` : "All"}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-3 max-h-[70vh] overflow-y-auto">
        {isLoading && <p className="text-xs text-[#1A1A1A]/60 px-2 py-4">Loading…</p>}
        {!isLoading && visible.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="h-8 w-8 text-[color:var(--emerald-1)] mx-auto mb-2" />
            <p className="text-sm text-[#1A1A1A]/70">No pending requests.</p>
            <p className="text-xs text-[#1A1A1A]/50">Click "Sync inbox" to pull new mail.</p>
          </div>
        )}
        {visible.map((item) => {
          const matchedLink = findLink(item.request_type);
          const tone = TYPE_TONE[item.request_type];
          return (
            <div
              key={item.id}
              className="bg-[#FDFBF7] border border-[#B89555]/15 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <IconTile icon={Mail} tone={tone} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                      {item.developer_name || item.developer_email || "Unknown sender"}
                    </p>
                    <p className="text-xs text-[#1A1A1A]/60 truncate">
                      {(item.metadata as { subject?: string })?.subject || item.extracted_summary?.slice(0, 60)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-[#B89555]/40 text-[#1A1A1A] text-[10px] uppercase tracking-wide whitespace-nowrap"
                >
                  {TYPE_LABEL[item.request_type]}
                </Badge>
              </div>
              {item.extracted_summary && (
                <p className="text-xs text-[#1A1A1A]/75 line-clamp-2">
                  {item.extracted_summary}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {item.request_type === "vat_certificate" ? (
                  <Button asChild size="sm" variant="gold" className="h-7 text-xs">
                    <Link to="/owner/templates/vat" state={{ recipient: item.developer_name, email: item.developer_email }}>
                      <FileText className="h-3 w-3 mr-1" />
                      Generate VAT
                    </Link>
                  </Button>
                ) : item.request_type === "contract_signature" ? (
                  <Button asChild size="sm" variant="gold" className="h-7 text-xs">
                    <Link to="/owner/contracts">
                      <Stamp className="h-3 w-3 mr-1" />
                      Open contracts
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    className="jj-cta-emerald h-7 px-3 text-xs !text-white [&_svg]:!text-white"
                    disabled={!matchedLink || !item.developer_email || sendReply.isPending}
                    onClick={() =>
                      sendReply.mutate({
                        action_item_id: item.id,
                        to: item.developer_email!,
                        subject: `Re: ${(item.metadata as { subject?: string })?.subject ?? "Your request"}`,
                        body: item.suggested_reply ??
                          "Thank you for reaching out. Please find all the requested documents at the link below.",
                        document_link: matchedLink?.url,
                      })
                    }
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send link
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                  onClick={() => dismiss.mutate(item.id)}
                >
                  <X className="h-3 w-3 mr-1" />
                  Dismiss
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
