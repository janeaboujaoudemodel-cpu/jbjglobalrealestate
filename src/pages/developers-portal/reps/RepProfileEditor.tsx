import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import RepAvailabilityBadge from "@/components/developers-portal/RepAvailabilityBadge";
import { useAuth } from "@/contexts/AuthContext";
import RepAvailabilityCalendar from "@/pages/developers-portal/reps/RepAvailabilityCalendar";

const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

interface Props { selfMode?: boolean }

export default function RepProfileEditor({ selfMode = false }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  // In self mode, resolve the rep tied to the current auth user
  const { data: rep, isLoading } = useQuery({
    queryKey: ["rep-profile", selfMode ? user?.id : id],
    enabled: selfMode ? !!user?.id : !!id,
    queryFn: async () => {
      const q = supabase
        .from("developer_sales_reps")
        .select("*")
        .limit(1);
      const { data, error } = selfMode && user?.id
        ? await q.eq("auth_user_id", user.id).maybeSingle()
        : await q.eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const [form, setForm] = useState<any>({});
  useEffect(() => { if (rep) setForm(rep); }, [rep]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form?.id) throw new Error("Missing rep id");
      const { error } = await supabase
        .from("developer_sales_reps")
        .update({
          full_name: form.full_name,
          title: form.title,
          position: form.position,
          phone_e164: form.phone_e164,
          email: form.email,
          nationality: form.nationality,
          languages: form.languages ?? [],
          assigned_emirates: form.assigned_emirates ?? [],
          availability_status: form.availability_status ?? "available",
          linkedin_url: form.linkedin_url,
          instagram_url: form.instagram_url,
          notes: form.notes,
        })
        .eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["rep-profile"] });
      qc.invalidateQueries({ queryKey: ["portal-reps"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  if (isLoading) return <p className="text-sm text-[#1A1A1A]/60">Loading…</p>;
  if (!rep) {
    return (
      <Card className="p-8 bg-[#F7F2EA] border border-[#B89555]/30 text-center">
        <p className="text-[#1A1A1A]">
          {selfMode ? "Your rep profile hasn't been linked yet. Ask your owner to approve your application." : "Rep not found."}
        </p>
        {selfMode && (
          <Button className="mt-4" onClick={() => navigate("/developers-portal/reps/apply")}>Open application form</Button>
        )}
      </Card>
    );
  }

  const csvToArray = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);
  const setField = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Sales Representative</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1A1A1A] mt-1">{form.full_name}</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">{form.position || form.title || "Sales Representative"}</p>
        </div>
        <RepAvailabilityBadge status={form.availability_status} />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 space-y-3">
          <h3 className="font-semibold text-[#1A1A1A]">Profile</h3>
          <div className="grid grid-cols-1 gap-3">
            <Field label="Full name"><Input value={form.full_name ?? ""} onChange={setField("full_name")} /></Field>
            <Field label="Position"><Input value={form.position ?? ""} onChange={setField("position")} placeholder="Senior Sales Manager" /></Field>
            <Field label="Title"><Input value={form.title ?? ""} onChange={setField("title")} /></Field>
            <Field label="Nationality"><Input value={form.nationality ?? ""} onChange={setField("nationality")} /></Field>
            <Field label="Languages (comma separated)">
              <Input
                value={(form.languages ?? []).join(", ")}
                onChange={(e) => setForm((f: any) => ({ ...f, languages: csvToArray(e.target.value) }))}
                placeholder="English, Arabic, Russian"
              />
            </Field>
            <Field label="Assigned Emirates">
              <div className="flex flex-wrap gap-2">
                {EMIRATES.map((em) => {
                  const active = (form.assigned_emirates ?? []).includes(em);
                  return (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setForm((f: any) => {
                        const cur = new Set<string>(f.assigned_emirates ?? []);
                        if (cur.has(em)) cur.delete(em); else cur.add(em);
                        return { ...f, assigned_emirates: Array.from(cur) };
                      })}
                      className={`px-2.5 py-1 rounded-full text-xs border ${active
                        ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A] font-semibold"
                        : "bg-white border-[#B89555]/30 text-[#1A1A1A]/70"}`}
                    >
                      {em}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Availability">
              <select
                className="h-10 rounded-md border border-[#B89555]/40 bg-white px-3 text-sm"
                value={form.availability_status ?? "available"}
                onChange={setField("availability_status")}
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="off">Off</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30 space-y-3">
          <h3 className="font-semibold text-[#1A1A1A]">Contact & Links</h3>
          <Field label="Phone (E.164)"><Input value={form.phone_e164 ?? ""} onChange={setField("phone_e164")} placeholder="+9715XXXXXXXX" /></Field>
          <Field label="Email"><Input value={form.email ?? ""} onChange={setField("email")} type="email" /></Field>
          <Field label="LinkedIn URL"><Input value={form.linkedin_url ?? ""} onChange={setField("linkedin_url")} /></Field>
          <Field label="Instagram URL"><Input value={form.instagram_url ?? ""} onChange={setField("instagram_url")} /></Field>
          <Field label="Internal notes"><Textarea rows={4} value={form.notes ?? ""} onChange={setField("notes")} /></Field>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>

      <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30">
        <h3 className="font-semibold text-[#1A1A1A] mb-3">Availability calendar</h3>
        <RepAvailabilityCalendar repId={form.id} />
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
