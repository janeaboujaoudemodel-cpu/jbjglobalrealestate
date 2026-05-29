import { useMemo, useState } from "react";
import { useCompanyDirectory } from "@/hooks/useCompanyDirectory";
import { useMyBrokerRequests, useCreateBrokerRequest, useCancelBrokerRequest, type BrokerRequest } from "@/hooks/useBrokerRequests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";

const REQUEST_TYPES = [
  "Salary certificate",
  "Leave request",
  "NOC letter",
  "Marketing material",
  "IT support",
  "Visa / HR document",
  "Expense reimbursement",
  "Other",
];

const STATUS_BADGE: Record<BrokerRequest["status"], string> = {
  open: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/35",
  in_review: "bg-blue-50 text-blue-900 border-blue-300",
  approved: "bg-emerald-50 text-emerald-900 border-emerald-300",
  resolved: "bg-emerald-50 text-emerald-900 border-emerald-300",
  rejected: "bg-red-50 text-red-900 border-red-300",
  cancelled: "bg-zinc-100 text-zinc-700 border-zinc-300",
};

export default function BrokerRequestsTab() {
  const dir = useCompanyDirectory();
  const requests = useMyBrokerRequests();
  const create = useCreateBrokerRequest();
  const cancel = useCancelBrokerRequest();

  const [open, setOpen] = useState(false);
  const [department, setDepartment] = useState<string>("Executive");
  const [recipient, setRecipient] = useState<string>("any");
  const [type, setType] = useState<string>("Salary certificate");
  const [customType, setCustomType] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal");

  const departments = useMemo(() => {
    const set = new Set<string>();
    (dir.data ?? []).forEach((e) => e.department && set.add(e.department));
    return Array.from(set).sort();
  }, [dir.data]);

  const peopleInDept = useMemo(
    () => (dir.data ?? []).filter((e) => e.department === department),
    [dir.data, department]
  );

  const reset = () => {
    setSubject("");
    setBody("");
    setType("Salary certificate");
    setCustomType("");
    setPriority("normal");
    setRecipient("any");
  };

  const submit = async () => {
    const finalType = type === "Other" ? (customType.trim() || "Other") : type;
    if (!subject.trim()) return;
    await create.mutateAsync({
      recipientUserId: recipient === "any" ? null : recipient,
      recipientDepartment: department,
      requestType: finalType,
      subject: subject.trim(),
      body: body.trim() || undefined,
      priority,
    });
    setOpen(false);
    reset();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#1A1A1A]/70">
          Send a request to a teammate or a department. Track approvals and status live.
        </p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#102540] hover:bg-[#1a3d63] text-white" data-allow-dark-cta>
              <Plus className="h-4 w-4 mr-1.5" /> New request
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#FDFBF7] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[#1A1A1A]">New request</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/65">Department</label>
                  <Select value={department} onValueChange={(v) => { setDepartment(v); setRecipient("any"); }}>
                    <SelectTrigger className="bg-white border-[#B89555]/30 text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Executive", ...departments.filter((d) => d !== "Executive"), "HR", "Marketing", "Admin", "IT"].filter((v, i, a) => a.indexOf(v) === i).map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/65">Send to</label>
                  <Select value={recipient} onValueChange={setRecipient}>
                    <SelectTrigger className="bg-white border-[#B89555]/30 text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Whole {department} team</SelectItem>
                      {peopleInDept.map((p) => (
                        <SelectItem key={p.user_id} value={p.user_id}>
                          {p.full_name} {p.title ? `· ${p.title}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/65">Request type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-white border-[#B89555]/30 text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {type === "Other" && (
                  <Input
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Describe the request type…"
                    className="mt-2 bg-white border-[#B89555]/30 text-[#1A1A1A]"
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/65">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Salary certificate for visa renewal"
                  className="bg-white border-[#B89555]/30 text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/65">Details</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Add any context, dates, attachments info…"
                  rows={4}
                  className="bg-white border-[#B89555]/30 text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/65">Priority</label>
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger className="bg-white border-[#B89555]/30 text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                disabled={!subject.trim() || create.isPending}
                onClick={submit}
                className="bg-[#102540] hover:bg-[#1a3d63] text-white"
                data-allow-dark-cta
              >
                Submit request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {requests.isLoading ? (
          <div className="text-sm text-[#1A1A1A]/60">Loading…</div>
        ) : (requests.data ?? []).length === 0 ? (
          <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 p-8 text-center text-sm text-[#1A1A1A]/70">
            No requests yet — click <strong>New request</strong> to get started.
          </div>
        ) : (
          (requests.data ?? []).map((r) => (
            <article key={r.id} className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded border ${STATUS_BADGE[r.status]}`}>
                      {r.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded bg-[#EFE6D6] border border-[#B89555]/35 text-[#1A1A1A]/75">
                      {r.request_type}
                    </span>
                    {r.priority !== "normal" && (
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/65">
                        {r.priority}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-[#1A1A1A] mt-1.5">{r.subject}</h3>
                  {r.body && <p className="text-sm text-[#1A1A1A]/75 mt-1 whitespace-pre-wrap">{r.body}</p>}
                  <div className="text-[11px] text-[#1A1A1A]/55 mt-2">
                    To {r.recipient_department || "any team"} · sent {formatDisplayDate(r.created_at)}
                    {r.resolved_at && ` · resolved ${formatDisplayDate(r.resolved_at)}`}
                  </div>
                  {r.resolution_note && (
                    <div className="mt-2 text-sm text-[#1A1A1A]/80 italic">Response: {r.resolution_note}</div>
                  )}
                </div>
                {r.status === "open" && (
                  <Button size="sm" variant="ghost" onClick={() => cancel.mutate(r.id)} className="shrink-0">
                    <X className="h-3.5 w-3.5 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
