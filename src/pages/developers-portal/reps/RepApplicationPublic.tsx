import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

/**
 * Public self-serve application form for Developer Sales Representatives.
 * Anyone (anon) can submit; owner approves in /developers-portal/access-requests.
 */
export default function RepApplicationPublic() {
  const navigate = useNavigate();
  const [form, setForm] = useState<any>({
    full_name: "", email: "", phone_e164: "", nationality: "",
    position: "", languages: "", requested_developer_name: "",
    assigned_emirates: [] as string[], message: "",
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!form.full_name?.trim() || !form.email?.trim()) {
        throw new Error("Full name and email are required.");
      }
      const { error } = await supabase.from("developer_rep_applications").insert({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone_e164: form.phone_e164 || null,
        nationality: form.nationality || null,
        position: form.position || null,
        languages: form.languages
          ? form.languages.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [],
        requested_developer_name: form.requested_developer_name || null,
        assigned_emirates: form.assigned_emirates,
        message: form.message || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application submitted — we'll contact you after review.");
      setTimeout(() => navigate("/"), 1500);
    },
    onError: (e: any) => toast.error(e?.message ?? "Submission failed"),
  });

  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[88px] pb-16">
      <div className="max-w-2xl mx-auto px-6">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Developers Portal</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1A1A1A] mt-1">Sales Representative Application</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-2">
            Apply to be listed as a Developer Sales Representative on JBJ GLOBAL REAL ESTATE.
            We'll review your application and reach out by email.
          </p>
        </header>

        <Card className="p-6 bg-[#F7F2EA] border border-[#B89555]/30 space-y-4">
          <Field label="Full name *"><Input value={form.full_name} onChange={set("full_name")} /></Field>
          <Field label="Email *"><Input type="email" value={form.email} onChange={set("email")} /></Field>
          <Field label="Phone (E.164)"><Input value={form.phone_e164} onChange={set("phone_e164")} placeholder="+9715XXXXXXXX" /></Field>
          <Field label="Position"><Input value={form.position} onChange={set("position")} placeholder="Senior Sales Manager" /></Field>
          <Field label="Nationality"><Input value={form.nationality} onChange={set("nationality")} /></Field>
          <Field label="Languages (comma separated)">
            <Input value={form.languages} onChange={set("languages")} placeholder="English, Arabic, Russian" />
          </Field>
          <Field label="Requested developer (optional)">
            <Input value={form.requested_developer_name} onChange={set("requested_developer_name")} placeholder="Emaar, Damac, Sobha…" />
          </Field>
          <Field label="Assigned Emirates">
            <div className="flex flex-wrap gap-2">
              {EMIRATES.map((em) => {
                const active = form.assigned_emirates.includes(em);
                return (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setForm((f: any) => {
                      const cur = new Set<string>(f.assigned_emirates);
                      if (cur.has(em)) cur.delete(em); else cur.add(em);
                      return { ...f, assigned_emirates: Array.from(cur) };
                    })}
                    className={`px-2.5 py-1 rounded-full text-xs border ${active
                      ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A] font-semibold"
                      : "bg-white border-[#B89555]/30 text-[#1A1A1A]/70"}`}
                  >{em}</button>
                );
              })}
            </div>
          </Field>
          <Field label="Message"><Textarea rows={4} value={form.message} onChange={set("message")} placeholder="Briefly introduce yourself…" /></Field>

          <Button className="w-full" onClick={() => submit.mutate()} disabled={submit.isPending}>
            {submit.isPending ? "Submitting…" : "Submit application"}
          </Button>
        </Card>
      </div>
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
