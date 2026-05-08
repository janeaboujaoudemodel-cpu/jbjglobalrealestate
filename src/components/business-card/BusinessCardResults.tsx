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
      <div className="text-center py-12 text-muted-foreground">
        <Lock className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p className="font-medium">No contacts scanned yet</p>
        <p className="text-sm mt-1">
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

        return (
          <Card
            key={contact.id}
            className="border-border/50 hover:border-primary/30 transition-colors"
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
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit}>
                      <Check className="h-4 w-4 mr-1" />
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
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {maskData(contact.jobTitle || contact.title)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {needsReview && (
                        <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">
                          Needs Review
                        </Badge>
                      )}
                      {saveStatus === "saved" && (
                        <Badge className="text-[10px] bg-emerald-600 text-white gap-1">
                          <CheckCircle2 className="h-3 w-3" /> In CRM
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          contact.confidence >= 0.9
                            ? "border-green-500 text-green-600"
                            : contact.confidence >= 0.7
                            ? "border-yellow-500 text-yellow-600"
                            : "border-red-500 text-red-600"
                        }`}
                      >
                        {Math.round(contact.confidence * 100)}%
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => startEditing(contact)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(contact.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
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
                      <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{maskData(contact.address)}</span>
                      </div>
                    )}
                    {contact.event_source && (
                      <Row icon={<FileText className="h-3 w-3" />} text={`Event: ${maskData(contact.event_source)}`} />
                    )}
                    {contact.notes && (
                      <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                        <FileText className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{maskData(contact.notes)}</span>
                      </div>
                    )}
                  </div>

                  {/* Classification & labels */}
                  <div className="mt-4 pt-3 border-t space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-24">Contact type</span>
                      <Select
                        value={contact.contactType || "client"}
                        onValueChange={(v) => onUpdateContact(contact.id, { contactType: v as ContactTypeLabel })}
                      >
                        <SelectTrigger className="h-8 w-56">
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
                      <span className="text-xs text-muted-foreground w-24 mt-1">Labels</span>
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
                                  ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]"
                                  : "bg-transparent text-muted-foreground border-border hover:border-[#B89555]"
                              }`}
                            >
                              {l}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground gap-2">
                    <span>Scanned {new Date(contact.scannedAt).toLocaleString()}</span>
                    <div className="flex items-center gap-2">
                      {onSaveContact && (
                        <Button
                          size="sm"
                          className="h-7 gap-1"
                          disabled={saveStatus === "saving" || saveStatus === "saved"}
                          onClick={() => onSaveContact(contact.id)}
                        >
                          {saveStatus === "saving" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : saveStatus === "saved" ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <UserPlus className="h-3 w-3" />
                          )}
                          {saveStatus === "saved" ? "Saved to CRM" : "Save to CRM"}
                        </Button>
                      )}
                      <Lock className="h-3 w-3" />
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
    <label className="text-xs text-muted-foreground">{label}</label>
    <Input
      type={type}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-8"
    />
  </div>
);

const Row = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 text-muted-foreground">
    {icon}
    <span className="truncate">{text}</span>
  </div>
);

export default BusinessCardResults;
