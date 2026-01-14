import { useMemo, useState } from "react";
import { DELIVERY_REQUIREMENTS, type DeliveryRequirement, type DeliveryScope, type DeliveryStatus } from "@/config/delivery-checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle2, CircleDashed, HelpCircle, XCircle, Copy, Filter } from "lucide-react";

const scopeLabels: Record<DeliveryScope, string> = {
  founders_assistant: "Founder’s Assistant",
  crm: "CRM",
  employees_hub: "Employees Hub",
  notifications: "Notifications",
  integrations: "Integrations",
  security: "Security",
};

const statusMeta: Record<DeliveryStatus, { label: string; icon: React.ReactNode; badgeVariant: "default" | "secondary" | "destructive" | "outline" } > = {
  done: { label: "Done", icon: <CheckCircle2 className="h-3.5 w-3.5" />, badgeVariant: "secondary" },
  partial: { label: "Partial", icon: <CircleDashed className="h-3.5 w-3.5" />, badgeVariant: "outline" },
  missing: { label: "Missing", icon: <XCircle className="h-3.5 w-3.5" />, badgeVariant: "destructive" },
  needs_verification: { label: "Verify", icon: <HelpCircle className="h-3.5 w-3.5" />, badgeVariant: "outline" },
};

type ScopeFilter = "all" | DeliveryScope;
type StatusFilter = "all" | DeliveryStatus;

export function DeliveryChecklistPanel({
  defaultScope = "all",
  title = "Delivery Checklist",
}: {
  defaultScope?: ScopeFilter;
  title?: string;
}) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeFilter>(defaultScope);
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DELIVERY_REQUIREMENTS.filter((item) => {
      if (scope !== "all" && item.scope !== scope) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.requirement.toLowerCase().includes(q) ||
        item.scope.toLowerCase().includes(q) ||
        (item.notes || "").toLowerCase().includes(q)
      );
    });
  }, [query, scope, status]);

  const stats = useMemo(() => {
    const all = scope === "all" ? DELIVERY_REQUIREMENTS : DELIVERY_REQUIREMENTS.filter((i) => i.scope === scope);
    const done = all.filter((i) => i.status === "done").length;
    const partial = all.filter((i) => i.status === "partial").length;
    const missing = all.filter((i) => i.status === "missing").length;
    const verify = all.filter((i) => i.status === "needs_verification").length;
    const total = all.length;
    const score = total ? Math.round(((done + partial * 0.5) / total) * 100) : 0;
    return { total, done, partial, missing, verify, score };
  }, [scope]);

  const copyAsText = () => {
    const lines = filtered.map((i) => {
      const ev = i.evidence?.length ? `\n  Evidence: ${i.evidence.join(" | ")}` : "";
      const notes = i.notes ? `\n  Notes: ${i.notes}` : "";
      return `- [${i.status.toUpperCase()}] (${scopeLabels[i.scope]}) ${i.title}\n  Requirement: ${i.requirement}${ev}${notes}`;
    });
    navigator.clipboard.writeText(lines.join("\n\n"));
    toast.success("Checklist copied");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Snapshot from code review (not runtime) • {stats.score}% coverage
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={copyAsText}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
        <div className="mt-3">
          <Progress value={stats.score} className="h-2" />
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">Done: {stats.done}</Badge>
            <Badge variant="outline">Partial: {stats.partial}</Badge>
            <Badge variant="destructive">Missing: {stats.missing}</Badge>
            <Badge variant="outline">Verify: {stats.verify}</Badge>
            <Badge variant="outline">Total: {stats.total}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
          <div className="flex-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search requirements…"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={scope === "all" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setScope("all")}
            >
              <Filter className="h-4 w-4 mr-2" />
              All scopes
            </Button>
            {(Object.keys(scopeLabels) as DeliveryScope[]).map((s) => (
              <Button
                key={s}
                variant={scope === s ? "secondary" : "outline"}
                size="sm"
                onClick={() => setScope(s)}
              >
                {scopeLabels[s]}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button variant={status === "all" ? "secondary" : "outline"} size="sm" onClick={() => setStatus("all")}>
            All statuses
          </Button>
          {(Object.keys(statusMeta) as DeliveryStatus[]).map((st) => (
            <Button
              key={st}
              variant={status === st ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatus(st)}
            >
              {statusMeta[st].label}
            </Button>
          ))}
        </div>

        <ScrollArea className="h-[520px] pr-3">
          <div className="space-y-3">
            {filtered.map((item) => (
              <RequirementRow key={item.id} item={item} />
            ))}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No items match your filters.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function RequirementRow({ item }: { item: DeliveryRequirement }) {
  const meta = statusMeta[item.status];

  const copyEvidence = () => {
    const payload = {
      id: item.id,
      scope: item.scope,
      title: item.title,
      requirement: item.requirement,
      status: item.status,
      evidence: item.evidence || [],
      notes: item.notes || "",
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("Copied as JSON");
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={meta.badgeVariant} className="gap-1">
                {meta.icon}
                {meta.label}
              </Badge>
              <Badge variant="outline">{scopeLabels[item.scope]}</Badge>
              <h4 className="font-semibold truncate">{item.title}</h4>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.requirement}</p>

            {(item.notes || item.evidence?.length) && (
              <div className="mt-3 space-y-1">
                {item.notes && (
                  <p className="text-sm">{item.notes}</p>
                )}
                {item.evidence?.length ? (
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {item.evidence.map((ev) => (
                      <li key={ev}>{ev}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={copyEvidence}>
            <Copy className="h-4 w-4 mr-2" />
            Copy proof
          </Button>
        </div>
      </div>
    </div>
  );
}
