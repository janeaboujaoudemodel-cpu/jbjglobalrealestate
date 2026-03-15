import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Upload, CheckCircle2, Clock, AlertTriangle, Send, Save, Plus, Trash2 } from "lucide-react";
import ApprovalTimeline, { ApprovalStep, JBJ_APPROVAL_STEPS } from "@/components/shared/ApprovalTimeline";

interface KeyContact {
  name: string;
  position: string;
  email: string;
  phone: string;
}

const STEPS = ["Company Details", "Trade License", "Key Contacts", "Review & Submit"];
const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];

const DeveloperCompanyRegistration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    company_name: "",
    trade_license_number: "",
    trade_license_url: "",
    company_logo_url: "",
    company_website: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    emirate: "",
    rera_number: "",
    year_established: "",
    key_contacts: [{ name: "", position: "", email: "", phone: "" }] as KeyContact[],
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ["dev-registration", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_registrations")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        company_name: existing.company_name || "",
        trade_license_number: existing.trade_license_number || "",
        trade_license_url: existing.trade_license_url || "",
        company_logo_url: existing.company_logo_url || "",
        company_website: existing.company_website || "",
        company_email: existing.company_email || "",
        company_phone: existing.company_phone || "",
        company_address: existing.company_address || "",
        emirate: existing.emirate || "",
        rera_number: existing.rera_number || "",
        year_established: existing.year_established?.toString() || "",
        key_contacts: (existing.key_contacts as unknown as KeyContact[]) || [{ name: "", position: "", email: "", phone: "" }],
      });
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async (status: string) => {
      const payload = {
        user_id: user!.id,
        company_name: form.company_name,
        trade_license_number: form.trade_license_number || null,
        trade_license_url: form.trade_license_url || null,
        company_logo_url: form.company_logo_url || null,
        company_website: form.company_website || null,
        company_email: form.company_email || null,
        company_phone: form.company_phone || null,
        company_address: form.company_address || null,
        emirate: form.emirate || null,
        rera_number: form.rera_number || null,
        year_established: form.year_established ? parseInt(form.year_established) : null,
        key_contacts: JSON.parse(JSON.stringify(form.key_contacts)),
        status: status as "draft" | "submitted" | "under_review" | "approved" | "rejected",
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        const { error } = await supabase
          .from("developer_registrations")
          .update(payload)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("developer_registrations")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["dev-registration"] });
      toast.success(status === "submitted" ? "Registration submitted for review!" : "Draft saved.");
    },
    onError: () => toast.error("Failed to save registration."),
  });

  const addContact = () => setForm({ ...form, key_contacts: [...form.key_contacts, { name: "", position: "", email: "", phone: "" }] });
  const removeContact = (i: number) => setForm({ ...form, key_contacts: form.key_contacts.filter((_, idx) => idx !== i) });
  const updateContact = (i: number, field: keyof KeyContact, value: string) => {
    const updated = [...form.key_contacts];
    updated[i] = { ...updated[i], [field]: value };
    setForm({ ...form, key_contacts: updated });
  };

  const isReadOnly = existing?.status === "submitted" || existing?.status === "under_review" || existing?.status === "approved";

  const statusInfo = {
    approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600", icon: CheckCircle2 },
    submitted: { label: "Submitted — Awaiting Review", className: "bg-amber-500/10 text-amber-600", icon: Clock },
    under_review: { label: "Under Review", className: "bg-blue-500/10 text-blue-600", icon: Clock },
    rejected: { label: "Rejected — Please Revise", className: "bg-destructive/10 text-destructive", icon: AlertTriangle },
    draft: { label: "Draft", className: "bg-muted text-muted-foreground", icon: Clock },
  };

  const currentStatus = statusInfo[(existing?.status as keyof typeof statusInfo) || "draft"];
  const StatusIcon = currentStatus.icon;

  if (isLoading) return <div className="flex items-center justify-center p-12"><Clock className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Registration</h1>
          <p className="text-muted-foreground mt-1">Register your developer company with JBJ Global Real Estate.</p>
        </div>
        <Badge className={currentStatus.className}>
          <StatusIcon className="w-3.5 h-3.5 mr-1" />
          {currentStatus.label}
        </Badge>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => !isReadOnly && setStep(i)}
            className={`flex-1 text-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
              step === i ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Step 0: Company Details */}
      {step === 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Company Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Company Name *</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} disabled={isReadOnly} placeholder="Enter company name" />
            </div>
            <div>
              <Label>Emirate</Label>
              <Select value={form.emirate} onValueChange={(v) => setForm({ ...form, emirate: v })} disabled={isReadOnly}>
                <SelectTrigger><SelectValue placeholder="Select emirate" /></SelectTrigger>
                <SelectContent>{EMIRATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year Established</Label>
              <Input type="number" value={form.year_established} onChange={(e) => setForm({ ...form, year_established: e.target.value })} disabled={isReadOnly} placeholder="2010" />
            </div>
            <div>
              <Label>RERA Number</Label>
              <Input value={form.rera_number} onChange={(e) => setForm({ ...form, rera_number: e.target.value })} disabled={isReadOnly} placeholder="RERA registration number" />
            </div>
            <div>
              <Label>Company Email</Label>
              <Input type="email" value={form.company_email} onChange={(e) => setForm({ ...form, company_email: e.target.value })} disabled={isReadOnly} />
            </div>
            <div>
              <Label>Company Phone</Label>
              <Input value={form.company_phone} onChange={(e) => setForm({ ...form, company_phone: e.target.value })} disabled={isReadOnly} />
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.company_website} onChange={(e) => setForm({ ...form, company_website: e.target.value })} disabled={isReadOnly} />
            </div>
            <div className="md:col-span-2">
              <Label>Company Address</Label>
              <Textarea value={form.company_address} onChange={(e) => setForm({ ...form, company_address: e.target.value })} disabled={isReadOnly} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Trade License */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Trade License</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Trade License Number</Label>
              <Input value={form.trade_license_number} onChange={(e) => setForm({ ...form, trade_license_number: e.target.value })} disabled={isReadOnly} placeholder="Enter license number" />
            </div>
            <div>
              <Label>Trade License Document URL</Label>
              <Input value={form.trade_license_url} onChange={(e) => setForm({ ...form, trade_license_url: e.target.value })} disabled={isReadOnly} placeholder="https://..." />
              <p className="text-xs text-muted-foreground mt-1">Upload your trade license to the document portal first, then paste the URL here.</p>
            </div>
            <div>
              <Label>Company Logo URL</Label>
              <Input value={form.company_logo_url} onChange={(e) => setForm({ ...form, company_logo_url: e.target.value })} disabled={isReadOnly} placeholder="https://..." />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Key Contacts */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Key Contacts</CardTitle>
              {!isReadOnly && (
                <Button variant="outline" size="sm" onClick={addContact}><Plus className="w-4 h-4 mr-1" /> Add Contact</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {form.key_contacts.map((contact, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-muted/30 relative">
                {!isReadOnly && form.key_contacts.length > 1 && (
                  <button onClick={() => removeContact(i)} className="absolute top-2 right-2 text-destructive/60 hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div><Label>Name</Label><Input value={contact.name} onChange={(e) => updateContact(i, "name", e.target.value)} disabled={isReadOnly} /></div>
                <div><Label>Position</Label><Input value={contact.position} onChange={(e) => updateContact(i, "position", e.target.value)} disabled={isReadOnly} /></div>
                <div><Label>Email</Label><Input type="email" value={contact.email} onChange={(e) => updateContact(i, "email", e.target.value)} disabled={isReadOnly} /></div>
                <div><Label>Phone</Label><Input value={contact.phone} onChange={(e) => updateContact(i, "phone", e.target.value)} disabled={isReadOnly} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Review Your Registration</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Company:</span><span className="font-medium">{form.company_name || "—"}</span>
                <span className="text-muted-foreground">Emirate:</span><span className="font-medium">{form.emirate || "—"}</span>
                <span className="text-muted-foreground">RERA:</span><span className="font-medium">{form.rera_number || "—"}</span>
                <span className="text-muted-foreground">License:</span><span className="font-medium">{form.trade_license_number || "—"}</span>
                <span className="text-muted-foreground">Contacts:</span><span className="font-medium">{form.key_contacts.filter(c => c.name).length}</span>
              </div>
            </CardContent>
          </Card>

          {existing?.status === "rejected" && existing.admin_notes && (
            <Card className="border-destructive/30">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Rejection Notes</p>
                    <p className="text-sm text-muted-foreground mt-1">{existing.admin_notes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval Timeline */}
          {existing && existing.status !== "draft" && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Approval Progress</CardTitle></CardHeader>
              <CardContent>
                <ApprovalTimeline steps={JBJ_APPROVAL_STEPS.map((s, i) => ({
                  ...s,
                  status: existing.status === "approved" ? "approved"
                    : existing.status === "rejected" && i === 0 ? "rejected"
                    : existing.status === "under_review" && i === 0 ? "in_review"
                    : existing.status === "submitted" && i === 0 ? "in_review"
                    : "pending",
                }))} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex items-center justify-between gap-3 pt-4">
          <div className="flex gap-2">
            {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveMutation.mutate("draft")} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-1" /> Save Draft
            </Button>
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button onClick={() => saveMutation.mutate("submitted")} disabled={saveMutation.isPending || !form.company_name}>
                <Send className="w-4 h-4 mr-1" /> Submit for Review
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeveloperCompanyRegistration;
