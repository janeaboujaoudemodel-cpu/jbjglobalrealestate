import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Trash2,
  Edit2,
  Check,
  X,
  User,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  Smartphone,
  FileText,
  Lock,
  UserPlus,
  Loader2,
  CheckCircle2,
  Linkedin,
  Instagram,
} from "lucide-react";
import {
  ScannedContact,
  ContactTypeLabel,
} from "@/utils/businessCardEncryption";
import { isContactSaveable } from "@/utils/businessCardValidation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CONTACT_TYPE_OPTIONS: { value: ContactTypeLabel; label: string }[] = [
  { value: "broker", label: "Broker" },
  { value: "brokerage_agency", label: "Brokerage Agency" },
  { value: "developer", label: "Developer" },
  { value: "investor", label: "Investor" },
  { value: "client", label: "Client" },
  { value: "partner", label: "Partner" },
  { value: "media", label: "Media" },
  { value: "supplier", label: "Supplier" },
  { value: "other", label: "Other" },
];

const LABEL_OPTIONS = [
  "VIP",
  "Hot Lead",
  "Follow Up",
  "Event Contact",
  "Broker",
  "Investor",
  "Developer",
  "Potential Partner",
  "Needs Verification",
  "Urgent",
];

interface BusinessCardResultsProps {
  contacts: ScannedContact[];
  onDelete: (id: string) => void;
  showEncrypted: boolean;
  onUpdateContact: (id: string, updates: Partial<ScannedContact>) => void;
  onSaveContact?: (id: string) => void;
}

const BusinessCardResults = ({
  contacts,
  onDelete,
  showEncrypted,
  onUpdateContact,
  onSaveContact,
}: BusinessCardResultsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ScannedContact>>({});

  const startEditing = (contact: ScannedContact) => {
    setEditingId(contact.id);
    setEditData({ ...contact });
  };

  const saveEdit = () => {
    if (editingId && editData) {
      onUpdateContact(editingId, editData);
      setEditingId(null);
      setEditData({});
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const maskData = (value: string | undefined): string => {
    if (!value) return "—";
    if (showEncrypted) return "●".repeat(Math.min(value.length, 20));
    return value;
  };

  const toggleLabel = (contactId: string, label: string, current: string[] = []) => {
    const next = current.includes(label)
      ? current.filter((l) => l !== label)
      : [...current, label];
    onUpdateContact(contactId, { labels: next });
  };

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12 allow-white" style={{ color: "rgba(255,255,255,0.78)" }} data-no-contrast-guard>
        <Lock className="h-12 w-12 mx-auto mb-4 opacity-60 allow-white" style={{ color: "#FFFFFF" }} />
        <p className="font-medium allow-white" style={{ color: "#FFFFFF" }}>No contacts scanned yet</p>
        <p className="text-sm mt-1 allow-white" style={{ color: "rgba(255,255,255,0.72)" }}>
          Scan business cards to see extracted contacts here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
      {contacts.map((contact) => {
        const labels = contact.labels || [];
        const needsReview =
          !contact.name ||
          (!contact.email && !contact.mobile && !contact.phone);
        const saveStatus = contact.saveStatus || "idle";
        const saveable = isContactSaveable(contact);

        return (
          <Card
            key={contact.id}
            className="border-emerald-700/45 transition-colors allow-white"
            data-no-contrast-guard
            style={{ background: "rgba(4,7,13,0.62)", color: "#FFFFFF" }}
          >
            <CardContent className="p-4">
              {editingId === contact.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name" value={editData.name} onChange={(v) => setEditData({ ...editData, name: v })} />
                    <Field label="Job Title" value={editData.jobTitle || editData.title} onChange={(v) => setEditData({ ...editData, jobTitle: v, title: v })} />
                    <Field label="Company" value={editData.company || editData.company_name} onChange={(v) => setEditData({ ...editData, company: v, company_name: v })} />
                    <Field label="Brokerage Agency" value={editData.agency_name} onChange={(v) => setEditData({ ...editData, agency_name: v })} />
                    <Field label="Developer" value={editData.developer_name} onChange={(v) => setEditData({ ...editData, developer_name: v })} />
                    <Field label="Email" value={editData.email} onChange={(v) => setEditData({ ...editData, email: v })} type="email" />
                    <Field label="Mobile" value={editData.mobile} onChange={(v) => setEditData({ ...editData, mobile: v, phone: v })} />
                    <Field label="WhatsApp" value={editData.whatsapp} onChange={(v) => setEditData({ ...editData, whatsapp: v })} />
                    <Field label="Landline" value={editData.landline} onChange={(v) => setEditData({ ...editData, landline: v })} />
                    <Field label="Website" value={editData.website} onChange={(v) => setEditData({ ...editData, website: v })} />
                    <Field label="LinkedIn" value={editData.linkedin} onChange={(v) => setEditData({ ...editData, linkedin: v })} />
                    <Field label="Instagram" value={editData.instagram} onChange={(v) => setEditData({ ...editData, instagram: v })} />
                    <Field label="City" value={editData.city} onChange={(v) => setEditData({ ...editData, city: v })} />
                    <Field label="Country" value={editData.country} onChange={(v) => setEditData({ ...editData, country: v })} />
                    <div className="col-span-2">
                      <Field label="Address" value={editData.address} onChange={(v) => setEditData({ ...editData, address: v })} />
                    </div>
                    <div className="col-span-2">
                      <Field label="Event Source" value={editData.event_source} onChange={(v) => setEditData({ ...editData, event_source: v })} />
                    </div>
                    <div className="col-span-2">
                      <Field label="Notes" value={editData.notes} onChange={(v) => setEditData({ ...editData, notes: v })} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" className="text-white hover:bg-emerald-700/15 hover:text-white allow-white" data-no-contrast-guard data-allow-dark-cta onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-1 allow-white" />
                      Cancel
                    </Button>
                    <Button size="sm" className="border border-emerald-700/55 bg-emerald-700/18 text-white hover:bg-emerald-700/28 hover:text-white allow-white" data-no-contrast-guard data-allow-dark-cta onClick={saveEdit}>
                      <Check className="h-4 w-4 mr-1 allow-white" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{maskData(contact.name)}</h4>
                        {(contact.jobTitle || contact.title) && (
                          <p className="text-sm flex items-center gap-1 allow-white" style={{ color: "rgba(255,255,255,0.72)" }}>
                            <Briefcase className="h-3 w-3 allow-white" />
                            {maskData(contact.jobTitle || contact.title)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {needsReview && (
                          <Badge variant="outline" className="text-[10px] border-0 jj-pill-emerald-metallic allow-white text-white" data-no-contrast-guard>
                          Needs Review
                        </Badge>
                      )}
                      {saveStatus === "saved" && (
                        <Badge className="text-[10px] border border-[color:var(--emerald-1)]/30/70 jj-surface-emerald-soft text-[color:var(--emerald-on)] gap-1 allow-white" data-no-contrast-guard>
                          <CheckCircle2 className="h-3 w-3 allow-white" /> In CRM
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full border-0 bg-transparent text-white hover:bg-white/10 hover:text-white allow-white"
                        data-no-contrast-guard
                        data-allow-dark-cta
                        aria-label="Edit scanned contact"
                        onClick={() => startEditing(contact)}
                      >
                        <Edit2 className="h-3 w-3 allow-white" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-full border border-red-400/65 bg-red-950/25 text-red-100 hover:bg-red-900/35 hover:text-red-100 allow-white"
                        data-no-contrast-guard
                        data-allow-dark-cta
                        aria-label="Remove scanned contact from scanner"
                        onClick={() => onDelete(contact.id)}
                      >
                        <Trash2 className="h-3 w-3 allow-white" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm allow-white" style={{ color: "rgba(255,255,255,0.78)" }}>
                    {(contact.company || contact.company_name) && (
                      <Row icon={<Building2 className="h-3 w-3" />} text={maskData(contact.company || contact.company_name)} />
                    )}
                    {contact.agency_name && (
                      <Row icon={<Building2 className="h-3 w-3" />} text={`Agency: ${maskData(contact.agency_name)}`} />
                    )}
                    {contact.developer_name && (
                      <Row icon={<Building2 className="h-3 w-3" />} text={`Dev: ${maskData(contact.developer_name)}`} />
                    )}
                    {contact.email && <Row icon={<Mail className="h-3 w-3" />} text={maskData(contact.email)} />}
                    {(contact.mobile || contact.phone) && (
                      <Row icon={<Smartphone className="h-3 w-3" />} text={maskData(contact.mobile || contact.phone)} />
                    )}
                    {contact.whatsapp && <Row icon={<Phone className="h-3 w-3" />} text={`WA: ${maskData(contact.whatsapp)}`} />}
                    {contact.landline && <Row icon={<Phone className="h-3 w-3" />} text={`Tel: ${maskData(contact.landline)}`} />}
                    {contact.website && <Row icon={<Globe className="h-3 w-3" />} text={maskData(contact.website)} />}
                    {contact.linkedin && <Row icon={<Linkedin className="h-3 w-3" />} text={maskData(contact.linkedin)} />}
                    {contact.instagram && <Row icon={<Instagram className="h-3 w-3" />} text={maskData(contact.instagram)} />}
                    {(contact.city || contact.country) && (
                      <Row icon={<MapPin className="h-3 w-3" />} text={maskData([contact.city, contact.country].filter(Boolean).join(", "))} />
                    )}
                    {contact.address && (
                      <div className="flex items-center gap-2 col-span-2 allow-white" style={{ color: "rgba(255,255,255,0.76)" }}>
                        <MapPin className="h-3 w-3 flex-shrink-0 allow-white" />
                        <span className="truncate">{maskData(contact.address)}</span>
                      </div>
                    )}
                    {contact.event_source && (
                      <Row icon={<FileText className="h-3 w-3" />} text={`Event: ${maskData(contact.event_source)}`} />
                    )}
                    {contact.notes && (
                      <div className="flex items-center gap-2 col-span-2 allow-white" style={{ color: "rgba(255,255,255,0.76)" }}>
                        <FileText className="h-3 w-3 flex-shrink-0 allow-white" />
                        <span className="truncate">{maskData(contact.notes)}</span>
                      </div>
                    )}
                  </div>

                  {/* Classification & labels */}
                  <div className="mt-4 pt-3 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.35)" }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-24 allow-white" style={{ color: "rgba(255,255,255,0.78)" }}>Contact type</span>
                      <Select
                        value={contact.contactType || "client"}
                        onValueChange={(v) => onUpdateContact(contact.id, { contactType: v as ContactTypeLabel })}
                      >
                        <SelectTrigger className="h-8 w-56 border-emerald-700/45 bg-emerald-700/10 text-white allow-white" data-no-contrast-guard>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTACT_TYPE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-xs w-24 mt-1 allow-white" style={{ color: "rgba(255,255,255,0.78)" }}>Labels</span>
                      <div className="flex flex-wrap gap-1">
                        {LABEL_OPTIONS.map((l) => {
                          const active = labels.includes(l);
                          return (
                            <button
                              key={l}
                              type="button"
                              onClick={() => toggleLabel(contact.id, l, labels)}
                              className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
 active
 ? "bg-emerald-700/22 text-white border-emerald-300 allow-white"
 : "bg-transparent text-white/75 border-emerald-700/35 hover:border-emerald-300 hover:text-white allow-white"
 }`}
                              data-no-contrast-guard
                            >
                              {l}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 flex items-center justify-between text-xs gap-2 allow-white" style={{ borderTop: "1px solid rgba(255,255,255,0.35)", color: "rgba(255,255,255,0.72)" }}>
                    <span className="allow-white">Scanned {new Date(contact.scannedAt).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      {onSaveContact && (
                        <Button
                          size="sm"
                          className="h-7 gap-1 rounded-full border border-emerald-700/55 bg-emerald-700/12 px-3 text-white hover:bg-emerald-700/22 hover:text-white disabled:bg-emerald-700/12 disabled:text-white disabled:opacity-100 allow-white"
                          data-no-contrast-guard
                          data-allow-dark-cta
                          disabled={saveStatus === "saving" || saveStatus === "saved" || !saveable}
                          onClick={() => onSaveContact(contact.id)}
                        >
                          {saveStatus === "saving" ? (
                            <Loader2 className="h-3 w-3 animate-spin allow-white" />
                          ) : saveStatus === "saved" ? (
                            <CheckCircle2 className="h-3 w-3 allow-white" />
                          ) : (
                            <UserPlus className="h-3 w-3 allow-white" />
                          )}
                          {saveStatus === "saved" ? "Saved to CRM" : saveable ? "Save to CRM" : "Not a business card"}
                        </Button>
                      )}
                      <Lock className="h-3 w-3 allow-white" style={{ color: "#FFFFFF" }} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

const Field = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <div>
    <label className="text-xs allow-white" style={{ color: "rgba(255,255,255,0.72)" }}>{label}</label>
    <Input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 border-emerald-700/45 bg-emerald-700/10 text-white placeholder:text-white/45 allow-white"
      data-no-contrast-guard
    />
  </div>
);

const Row = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 allow-white" style={{ color: "rgba(255,255,255,0.76)" }}>
    {icon}
    <span className="truncate">{text}</span>
  </div>
);

export default BusinessCardResults;
