import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Send,
  CheckCircle,
  Clock,
  Eye,
  Shield,
  Crown,
  XCircle,
  Loader2,
  LogIn,
  FileText,
  Building2,
  Globe,
  Instagram,
} from "lucide-react";

type PartnershipStage = "submitted" | "admin_review" | "senior_management_review" | "ceo_approval" | "approved" | "rejected";

interface Application {
  id: string;
  company_name: string;
  partnership_type: string;
  stage: PartnershipStage;
  created_at: string;
  rejection_reason: string | null;
}

const STAGES: { key: PartnershipStage; label: string; icon: any }[] = [
  { key: "submitted", label: "Application Submitted", icon: FileText },
  { key: "admin_review", label: "Admin Review", icon: Eye },
  { key: "senior_management_review", label: "Senior Management Review", icon: Shield },
  { key: "ceo_approval", label: "CEO Approval", icon: Crown },
  { key: "approved", label: "Welcome Onboard!", icon: CheckCircle },
];

const PARTNERSHIP_TYPES = [
  "Developer Partnership",
  "Investor & Private Capital",
  "Brokerage & Channel",
  "Legal & Financial Institution",
  "Hospitality & Luxury Brand",
  "Other",
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function PartnerApplicationPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "", contactPerson: "", position: "", email: "", phone: "", country: "",
    partnershipType: "", portfolioSize: "", companyProfile: "", websiteUrl: "", instagramUrl: "",
    proposal: "", compliance: false,
  });

  useEffect(() => {
    if (user) fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partnership_applications")
      .select("id, company_name, partnership_type, stage, created_at, rejection_reason")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setApplications((data as any) || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.compliance) {
      toast({ title: "Please confirm regulatory compliance", variant: "destructive" });
      return;
    }
    if (!formData.proposal.trim()) {
      toast({ title: "Please write your proposal", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("partnership_applications").insert({
      user_id: user!.id,
      company_name: formData.companyName,
      contact_person: formData.contactPerson,
      position: formData.position,
      email: formData.email,
      phone: formData.phone,
      country: formData.country,
      partnership_type: formData.partnershipType,
      portfolio_size: formData.portfolioSize || null,
      company_profile: formData.companyProfile || null,
      website_url: formData.websiteUrl || null,
      instagram_url: formData.instagramUrl || null,
      proposal: formData.proposal,
      compliance_confirmed: formData.compliance,
    } as any);

    if (error) {
      toast({ title: "Failed to submit application", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Partnership application submitted!", description: "We will review your proposal and get back to you." });
      setShowForm(false);
      setFormData({ companyName: "", contactPerson: "", position: "", email: "", phone: "", country: "", partnershipType: "", portfolioSize: "", companyProfile: "", websiteUrl: "", instagramUrl: "", proposal: "", compliance: false });
      fetchApplications();
    }
    setSubmitting(false);
  };

  const getStageIndex = (stage: PartnershipStage) => {
    if (stage === "rejected") return -1;
    return STAGES.findIndex(s => s.key === stage);
  };

  if (!user) {
    return (
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="jj-card-inner p-8 md:p-10 border-2 border-gold/50 text-center">
        <LogIn className="w-10 h-10 text-gold mx-auto mb-4" />
        <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Partner Portal</h3>
        <p className="text-zinc-500 mb-6">Sign in to submit a partnership application and track your application status in real-time.</p>
        <Button variant="primary" size="lg" onClick={() => window.location.href = "/auth"}>
          <LogIn className="w-5 h-5 mr-2" /> Sign In to Apply
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* My Applications */}
      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
      ) : applications.length > 0 ? (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-black" style={{ fontFamily: "'Playfair Display', serif" }}>
            My <span className="text-gold">Applications</span>
          </h3>
          {applications.map(app => {
            const currentIdx = getStageIndex(app.stage);
            const isRejected = app.stage === "rejected";
            return (
              <motion.div key={app.id} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="jj-card-inner p-6 border-2 border-gold/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-bold text-black text-lg">{app.company_name}</h4>
                    <p className="text-sm text-zinc-500">{app.partnership_type} · {new Date(app.created_at).toLocaleDateString()}</p>
                  </div>
                  {isRejected && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                      <XCircle className="w-3.5 h-3.5" /> Rejected
                    </div>
                  )}
                  {app.stage === "approved" && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-600 text-xs font-semibold">
                      <CheckCircle className="w-3.5 h-3.5" /> Partner
                    </div>
                  )}
                </div>

                {isRejected && app.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-700">{app.rejection_reason}</p>
                  </div>
                )}

                {/* Stage Progress */}
                {!isRejected && (
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {STAGES.map((stage, idx) => {
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      const StageIcon = stage.icon;
                      return (
                        <div key={stage.key} className="flex items-center flex-shrink-0">
                          <div className={`flex flex-col items-center gap-1 px-2 ${isCurrent ? "scale-110" : ""} transition-transform`}>
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCompleted
                                ? "bg-gradient-to-br from-gold to-amber-500 border-gold text-white"
                                : "bg-white border-zinc-200 text-zinc-300"
                            }`}>
                              <StageIcon className="w-4 h-4" />
                            </div>
                            <span className={`text-[10px] md:text-xs text-center leading-tight max-w-[70px] ${isCompleted ? "text-gold font-semibold" : "text-zinc-400"}`}>
                              {stage.label}
                            </span>
                          </div>
                          {idx < STAGES.length - 1 && (
                            <div className={`w-6 md:w-10 h-0.5 mt-[-16px] ${idx < currentIdx ? "bg-gold" : "bg-zinc-200"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {app.stage === "approved" && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-bold text-lg">Welcome Onboard</p>
                    <p className="text-green-600 text-sm">You are officially a JBJ Global Real Estate Partner.</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : null}

      {/* New Application Button / Form */}
      {!showForm ? (
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-center">
          <Button variant="primary" size="lg" onClick={() => setShowForm(true)} className="px-8">
            <Send className="w-5 h-5 mr-2" />
            {applications.length > 0 ? "Submit Another Application" : "Apply for Partnership"}
          </Button>
        </motion.div>
      ) : (
        <motion.form initial="hidden" animate="visible" variants={fadeIn} onSubmit={handleSubmit} className="jj-card-inner p-8 md:p-10 border-2 border-gold/50 space-y-5">
          <h3 className="text-xl font-bold text-black text-center mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Partnership <span className="text-gold">Application</span>
          </h3>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              { label: "Company Name *", key: "companyName", type: "text", required: true },
              { label: "Contact Person *", key: "contactPerson", type: "text", required: true },
              { label: "Position / Title *", key: "position", type: "text", required: true },
              { label: "Email *", key: "email", type: "email", required: true },
              { label: "Phone *", key: "phone", type: "tel", required: true },
              { label: "Country *", key: "country", type: "text", required: true },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-semibold text-black mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  required={field.required}
                  value={(formData as any)[field.key]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gold/30 bg-white/60 text-black placeholder:text-zinc-400 focus:border-gold focus:outline-none transition-colors text-sm"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Type of Partnership *</label>
            <select
              required
              value={formData.partnershipType}
              onChange={(e) => setFormData({ ...formData, partnershipType: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gold/30 bg-white/60 text-black focus:border-gold focus:outline-none transition-colors text-sm"
            >
              <option value="">Select partnership type</option>
              {PARTNERSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-black mb-1.5">Estimated Portfolio Size</label>
            <input
              type="text"
              value={formData.portfolioSize}
              onChange={(e) => setFormData({ ...formData, portfolioSize: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gold/30 bg-white/60 text-black placeholder:text-zinc-400 focus:border-gold focus:outline-none transition-colors text-sm"
              placeholder="e.g. $5M - $50M"
            />
          </div>

          {/* Company Profile */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-black mb-1.5">
              <Building2 className="w-4 h-4 text-gold" /> Company Profile *
            </label>
            <textarea
              required
              rows={3}
              value={formData.companyProfile}
              onChange={(e) => setFormData({ ...formData, companyProfile: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gold/30 bg-white/60 text-black placeholder:text-zinc-400 focus:border-gold focus:outline-none transition-colors text-sm resize-none"
              placeholder="Brief description of your company, its history, and core business activities..."
            />
          </div>

          {/* Website & Instagram */}
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-black mb-1.5">
                <Globe className="w-4 h-4 text-gold" /> Website URL
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gold/30 bg-white/60 text-black placeholder:text-zinc-400 focus:border-gold focus:outline-none transition-colors text-sm"
                placeholder="https://www.yourcompany.com"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-black mb-1.5">
                <Instagram className="w-4 h-4 text-gold" /> Instagram Link
              </label>
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border-2 border-gold/30 bg-white/60 text-black placeholder:text-zinc-400 focus:border-gold focus:outline-none transition-colors text-sm"
                placeholder="https://www.instagram.com/yourcompany"
              />
            </div>
          </div>

          {/* Proposal */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-black mb-1.5">
              <FileText className="w-4 h-4 text-gold" /> Proposal Overview *
            </label>
            <textarea
              required
              rows={5}
              value={formData.proposal}
              onChange={(e) => setFormData({ ...formData, proposal: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-gold/30 bg-white/60 text-black placeholder:text-zinc-400 focus:border-gold focus:outline-none transition-colors text-sm resize-none"
              placeholder="Describe your partnership proposal: what value you bring, what you're looking for, proposed collaboration structure, expected outcomes..."
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.compliance}
              onChange={(e) => setFormData({ ...formData, compliance: e.target.checked })}
              className="mt-1 accent-gold w-4 h-4"
            />
            <span className="text-sm text-zinc-600">I confirm my company operates within regulatory compliance.</span>
          </label>

          <div className="flex gap-3">
            <Button type="submit" variant="primary" size="lg" className="flex-1" disabled={submitting}>
              {submitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
              Submit Partnership Request
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </motion.form>
      )}
    </div>
  );
}
