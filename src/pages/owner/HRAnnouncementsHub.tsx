import { useState } from "react";
import { useHRAnnouncements, useUpsertAnnouncement, usePublishAnnouncement, type AnnouncementCategory } from "@/hooks/useHRAnnouncements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Megaphone, Plus, Pin, Send, FileText } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";

const CATEGORIES: AnnouncementCategory[] = ["general","policy","training","event","recognition","urgent","holiday","payroll"];

export default function HRAnnouncementsHub() {
  const list = useHRAnnouncements({ includeAll: true });
  const upsert = useUpsertAnnouncement();
  const publish = usePublishAnnouncement();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({
    title: "", body_html: "", category: "general", audience: "all_brokers", pin: false,
  });

  const submit = async () => {
    if (!draft.title?.trim()) return;
    await upsert.mutateAsync(draft);
    setDraft({ title: "", body_html: "", category: "general", audience: "all_brokers", pin: false });
    setOpen(false);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">JBJ GLOBAL REAL ESTATE</div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] mt-1 flex items-center gap-2">
              <Megaphone className="h-6 w-6" /> HR Announcements
            </h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">
              Publish company-wide notices, policy updates, recognition, and event invitations. Brokers see these in their Messages tab.
            </p>
          </div>
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#102540] hover:bg-[#1a3d63] text-white"
            data-allow-dark-cta
          >
            <Plus className="h-4 w-4 mr-1.5" /> New announcement
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        {list.isLoading ? (
          <div className="text-sm text-[#1A1A1A]/60">Loading…</div>
        ) : (list.data ?? []).length === 0 ? (
          <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 p-8 text-center text-sm text-[#1A1A1A]/70">
            <FileText className="h-7 w-7 mx-auto text-[#1A1A1A]/60 mb-2" />
            No announcements yet. Create your first to publish company-wide.
          </div>
        ) : (
          list.data!.map((a) => (
            <div key={a.id} className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.pin && <Pin className="h-3.5 w-3.5 text-[#B89555]" />}
                    <span className="text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded bg-[#EFE6D6] border border-[#B89555]/35 text-[#1A1A1A]/75">
                      {a.category}
                    </span>
                    <span className={`text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded border ${a.status === "published" ? "bg-[#EFE6D6] border-[#B89555]/45 text-[#1A1A1A]" : "bg-white border-[#B89555]/25 text-[#1A1A1A]/65"}`}>
                      {a.status}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#1A1A1A] mt-2">{a.title}</h3>
                  <div className="text-xs text-[#1A1A1A]/65 mt-1">
                    Audience: {a.audience} · {a.published_at ? `Published ${formatDisplayDate(a.published_at)}` : `Created ${formatDisplayDate(a.created_at)}`}
                  </div>
                  <div
                    className="text-sm text-[#1A1A1A]/80 mt-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: a.body_html }}
                  />
                </div>
                {a.status !== "published" && (
                  <Button
                    size="sm"
                    onClick={() => publish.mutate(a.id)}
                    disabled={publish.isPending}
                    className="bg-[#102540] hover:bg-[#1a3d63] text-white"
                    data-allow-dark-cta
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" /> Publish
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#FDFBF7] border border-[#B89555]/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">New HR announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Title (e.g. Updated commission schedule – effective June 1)"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="bg-white border-[#B89555]/30 text-[#1A1A1A]"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="h-10 px-3 rounded-md bg-white border border-[#B89555]/30 text-sm text-[#1A1A1A]"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={draft.audience}
                onChange={(e) => setDraft({ ...draft, audience: e.target.value })}
                className="h-10 px-3 rounded-md bg-white border border-[#B89555]/30 text-sm text-[#1A1A1A]"
              >
                <option value="all_brokers">All brokers</option>
                <option value="all_employees">All employees</option>
              </select>
            </div>
            <Textarea
              placeholder="Write the announcement (HTML supported)…"
              value={draft.body_html}
              onChange={(e) => setDraft({ ...draft, body_html: e.target.value })}
              className="bg-white border-[#B89555]/30 text-[#1A1A1A] min-h-[180px]"
            />
            <label className="flex items-center gap-2 text-sm text-[#1A1A1A]/80">
              <input
                type="checkbox"
                checked={draft.pin}
                onChange={(e) => setDraft({ ...draft, pin: e.target.checked })}
                className="h-4 w-4 accent-[#B89555]"
              />
              Pin to top
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]">
              Cancel
            </Button>
            <Button
              onClick={() => { setDraft({ ...draft, status: "draft" }); submit(); }}
              variant="outline"
              className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
              disabled={upsert.isPending}
            >
              Save draft
            </Button>
            <Button
              onClick={() => { setDraft({ ...draft, status: "published" }); submit(); }}
              className="bg-[#102540] hover:bg-[#1a3d63] text-white"
              data-allow-dark-cta
              disabled={upsert.isPending}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" /> Publish now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
