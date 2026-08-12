/**
 * NoteAlertEditor — sets the alert / repeat / reminder on an owner note.
 * Notes never become calendar events (owner rule); they raise bell + email alerts.
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Repeat, Mail, Smartphone } from "lucide-react";

export interface NoteAlertValue {
  reminder_at: string | null;
  repeat_rule: string;
  repeat_until: string | null;
  lead_minutes: number;
  alert_channels: string[];
}

const REPEATS: { value: string; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Every weekday" },
  { value: "weekly", label: "Every week" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
];

const LEADS = [0, 10, 30, 60, 120, 1440];
const leadLabel = (m: number) =>
  m === 0 ? "At time" : m < 60 ? `${m} min early` : m < 1440 ? `${m / 60}h early` : `${m / 1440}d early`;

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: NoteAlertValue;
  noteTitle: string;
  onSave: (v: NoteAlertValue) => void;
}

const chip = (active: boolean) =>
  `rounded-full px-3 py-1.5 text-xs font-medium transition-colors border ${
    active
      ? "bg-[color:var(--emerald-1,#064E3B)] text-white border-transparent"
      : "bg-transparent text-foreground/80 border-border hover:border-[color:var(--emerald-1,#064E3B)]"
  }`;

export default function NoteAlertEditor({ open, onOpenChange, value, noteTitle, onSave }: Props) {
  const [when, setWhen] = useState(toLocalInput(value.reminder_at));
  const [repeat, setRepeat] = useState(value.repeat_rule || "none");
  const [until, setUntil] = useState(toLocalInput(value.repeat_until));
  const [lead, setLead] = useState(value.lead_minutes ?? 0);
  const [channels, setChannels] = useState<string[]>(
    value.alert_channels?.length ? value.alert_channels : ["in_app"],
  );

  useEffect(() => {
    if (!open) return;
    setWhen(toLocalInput(value.reminder_at));
    setRepeat(value.repeat_rule || "none");
    setUntil(toLocalInput(value.repeat_until));
    setLead(value.lead_minutes ?? 0);
    setChannels(value.alert_channels?.length ? value.alert_channels : ["in_app"]);
  }, [open, value]);

  const toggleChannel = (c: string) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const save = () =>
    onSave({
      reminder_at: when ? new Date(when).toISOString() : null,
      repeat_rule: when ? repeat : "none",
      repeat_until: when && repeat !== "none" && until ? new Date(until).toISOString() : null,
      lead_minutes: lead,
      alert_channels: channels.length ? channels : ["in_app"],
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alert · {noteTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Remind me at</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Reminders alert you inside JBJ — they are never added to your calendar.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Repeat className="h-3.5 w-3.5" /> Repeat
            </Label>
            <div className="flex flex-wrap gap-2">
              {REPEATS.map((r) => (
                <button key={r.value} type="button" className={chip(repeat === r.value)} onClick={() => setRepeat(r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
            {repeat !== "none" && (
              <div className="pt-2">
                <Label className="text-xs text-muted-foreground">Stop repeating after (optional)</Label>
                <Input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Warn me</Label>
            <div className="flex flex-wrap gap-2">
              {LEADS.map((m) => (
                <button key={m} type="button" className={chip(lead === m)} onClick={() => setLead(m)}>
                  {leadLabel(m)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide">Alert me by</Label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={chip(channels.includes("in_app"))} onClick={() => toggleChannel("in_app")}>
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" /> In-app bell
                </span>
              </button>
              <button type="button" className={chip(channels.includes("email"))} onClick={() => toggleChannel("email")}>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </span>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {value.reminder_at && (
            <Button
              variant="secondary"
              onClick={() =>
                onSave({
                  reminder_at: null,
                  repeat_rule: "none",
                  repeat_until: null,
                  lead_minutes: 0,
                  alert_channels: channels,
                })
              }
            >
              <BellOff className="h-4 w-4 mr-2" />
              Remove alert
            </Button>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            <Bell className="h-4 w-4 mr-2" />
            Save alert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
