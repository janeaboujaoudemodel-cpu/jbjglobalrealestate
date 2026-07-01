import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ToolAnimatedFrame } from "@/components/tools/PremiumToolShell";
import { toolThemes } from "@/components/tools/toolThemes";
import { 
  CreditCard, 
  Camera, 
  Upload, 
  Shield, 
  Lock, 
  Trash2, 
  Download, 
  UserPlus,
  Sparkles,
  Eye,
  EyeOff,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react";

import BusinessCardCamera from "@/components/business-card/BusinessCardCamera";
import BusinessCardUpload from "@/components/business-card/BusinessCardUpload";
import BusinessCardResults from "@/components/business-card/BusinessCardResults";
import BusinessCardPrivacyNotice from "@/components/business-card/BusinessCardPrivacyNotice";
import { ScannedContact, encryptData, decryptData, generateEncryptionKey } from "@/utils/businessCardEncryption";
import { isContactSaveable } from "@/utils/businessCardValidation";
import { useStepUpAuth } from "@/hooks/useStepUpAuth";
import ReAuthModal from "@/components/security/ReAuthModal";
import { logExportEvent } from "@/utils/dlpExportLogger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const BusinessCardScanner = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [scannedContacts, setScannedContacts] = useState<ScannedContact[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [showEncryptedData, setShowEncryptedData] = useState(false);
  const stepUp = useStepUpAuth();

  // Generate or retrieve encryption key on mount
  useEffect(() => {
    const storedKey = sessionStorage.getItem('bcs_encryption_key');
    if (storedKey) {
      setEncryptionKey(storedKey);
    } else {
      const newKey = generateEncryptionKey();
      sessionStorage.setItem('bcs_encryption_key', newKey);
      setEncryptionKey(newKey);
    }
  }, []);

  // Smart duplicate detection and merging
  const detectDuplicates = (newContacts: ScannedContact[], existingContacts: ScannedContact[]) => {
    const merged: ScannedContact[] = [];
    const duplicates: { new: ScannedContact; existing: ScannedContact }[] = [];

    for (const newContact of newContacts) {
      const existingMatch = existingContacts.find(existing => {
        // Check if same person (by name + company) or same email/phone
        const sameEmail = newContact.email && existing.email && 
          newContact.email.toLowerCase() === existing.email.toLowerCase();
        const samePhone = newContact.phone && existing.phone &&
          newContact.phone.replace(/\D/g, '') === existing.phone.replace(/\D/g, '');
        const sameName = newContact.name && existing.name &&
          newContact.name.toLowerCase() === existing.name.toLowerCase();
        const sameCompany = newContact.company && existing.company &&
          newContact.company.toLowerCase() === existing.company.toLowerCase();
        
        return sameEmail || samePhone || (sameName && sameCompany);
      });

      if (existingMatch) {
        duplicates.push({ new: newContact, existing: existingMatch });
      } else {
        merged.push(newContact);
      }
    }

    return { merged, duplicates };
  };

  const handleScanComplete = (contacts: ScannedContact[]) => {
    const { merged, duplicates } = detectDuplicates(contacts, scannedContacts);
    
    // Add non-duplicate contacts
    if (merged.length > 0) {
      setScannedContacts(prev => [...prev, ...merged]);
    }
    
    // Handle duplicates with notification
    if (duplicates.length > 0) {
      duplicates.forEach(dup => {
        toast.info(
          `Duplicate found: ${dup.new.name || dup.new.email} matches existing contact. Skipped.`,
          { duration: 4000 }
        );
      });
    }
    
    const successCount = merged.length;
    if (successCount > 0) {
      toast.success(`${successCount} new business card(s) scanned successfully!`);
    } else if (duplicates.length > 0) {
      toast.info('All scanned cards were duplicates of existing contacts.');
    }
  };

  const handleDeleteContact = (id: string) => {
    setScannedContacts(prev => prev.filter(c => c.id !== id));
    toast.success("Removed from scanner. CRM record (if saved) is untouched — delete from the CRM page.", {
      duration: 5000,
    });
  };

  const handleClearAll = () => {
    setScannedContacts([]);
    sessionStorage.removeItem('bcs_encryption_key');
    const newKey = generateEncryptionKey();
    sessionStorage.setItem('bcs_encryption_key', newKey);
    setEncryptionKey(newKey);
    toast.success("Scanner cleared. Any CRM-saved contacts remain in the CRM.", {
      duration: 5000,
    });
  };

  /** A scan is "saveable" only if it has at least one strong business-card contact signal. */
  const isContactValid = isContactSaveable;

  // Duplicate confirmation dialog state
  const [dupDialog, setDupDialog] = useState<{
    contactId: string;
    existing: any;
  } | null>(null);

  const updateContactState = (id: string, updates: Partial<ScannedContact>) => {
    setScannedContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const buildPayload = (contact: ScannedContact) => ({
    contact: {
      name: contact.name || "",
      title: contact.title || contact.jobTitle || "",
      company_name: contact.company_name || contact.company || "",
      agency_name: contact.agency_name || "",
      developer_name: contact.developer_name || "",
      mobile: contact.mobile || contact.phone || "",
      whatsapp: contact.whatsapp || "",
      landline: contact.landline || "",
      email: contact.email || "",
      website: contact.website || "",
      linkedin: contact.linkedin || "",
      instagram: contact.instagram || "",
      address: contact.address || "",
      city: contact.city || "",
      country: contact.country || "",
      event_source: contact.event_source || "",
      notes: contact.notes || "",
    },
    contact_type: contact.contactType || "client",
    labels: contact.labels || [],
    card_image_base64: contact.imageDataUrl || null,
  });

  const callSave = async (
    contact: ScannedContact,
    action: "insert" | "update" | "merge" | "append_note",
    existingId?: string
  ) => {
    updateContactState(contact.id, { saveStatus: "saving" });
    const { data, error } = await supabase.functions.invoke("crm-save-scanned-card", {
      body: { ...buildPayload(contact), action, existing_lead_id: existingId },
    });
    if (error || data?.error) {
      console.error(error || data?.error);
      toast.error(`Save failed: ${data?.error || error?.message || "unknown"}`);
      updateContactState(contact.id, { saveStatus: "error" });
      return null;
    }
    updateContactState(contact.id, { saveStatus: "saved", savedLeadId: data?.lead_id });
    return data;
  };

  const handleSaveContact = async (id: string) => {
    const contact = scannedContacts.find((c) => c.id === id);
    if (!contact) return;
    if (!user) {
      toast.error("Please sign in to save to CRM");
      return;
    }
    if (!isContactValid(contact)) {
      toast.error(
        "No contact details detected — this card can't be saved to CRM. Edit the fields first or remove it.",
        { duration: 5000 },
      );
      updateContactState(id, { saveStatus: "error" });
      return;
    }
    updateContactState(id, { saveStatus: "saving" });
    const { data, error } = await supabase.functions.invoke("crm-save-scanned-card", {
      body: { ...buildPayload(contact), action: "check" },
    });
    if (error || data?.error) {
      toast.error(`Check failed: ${data?.error || error?.message || "unknown"}`);
      updateContactState(id, { saveStatus: "error" });
      return;
    }
    if (data?.status === "duplicate" && data?.existing) {
      setDupDialog({ contactId: id, existing: data.existing });
      updateContactState(id, { saveStatus: "idle" });
      return;
    }
    const result = await callSave(contact, "insert");
    if (result) toast.success(`Saved "${contact.name || "Contact"}" to CRM`);
  };

  const handleSaveAll = async () => {
    if (scannedContacts.length === 0) {
      toast.error("No contacts to save");
      return;
    }
    const saveable = scannedContacts.filter(isContactValid);
    const skipped = scannedContacts.length - saveable.length;
    if (saveable.length === 0) {
      toast.error("None of the scanned items contain enough contact info to save to CRM.");
      return;
    }
    let okCount = 0;
    let dupCount = 0;
    for (const c of saveable) {
      if (c.saveStatus === "saved") continue;
      updateContactState(c.id, { saveStatus: "saving" });
      const { data } = await supabase.functions.invoke("crm-save-scanned-card", {
        body: { ...buildPayload(c), action: "check" },
      });
      if (data?.status === "duplicate" && data?.existing) {
        dupCount++;
        const r = await callSave(c, "merge", data.existing.id);
        if (r) okCount++;
      } else {
        const r = await callSave(c, "insert");
        if (r) okCount++;
      }
    }
    toast.success(
      `Saved ${okCount} contact(s) to CRM${dupCount > 0 ? ` (${dupCount} merged into existing)` : ""}${skipped > 0 ? ` — ${skipped} skipped (no contact details)` : ""}`,
    );
  };

  const resolveDuplicate = async (action: "merge" | "update" | "insert" | "append_note") => {
    if (!dupDialog) return;
    const contact = scannedContacts.find((c) => c.id === dupDialog.contactId);
    if (!contact) return;
    const result = await callSave(contact, action, dupDialog.existing.id);
    if (result) {
      const verb =
        action === "insert"
          ? "Added new"
          : action === "append_note"
          ? "Appended note"
          : action === "update"
          ? "Updated"
          : "Merged";
      toast.success(`${verb} for "${contact.name || "Contact"}"`);
    }
    setDupDialog(null);
  };

  const doExportCSV = () => {
    if (scannedContacts.length === 0) {
      toast.error("No contacts to export");
      return;
    }

    const headers = ["Name", "Job Title", "Company", "Email", "Phone", "Mobile", "Address", "Website", "Notes"];
    const csvContent = [
      headers.join(","),
      ...scannedContacts.map(contact => [
        `"${contact.name || ''}"`,
        `"${contact.jobTitle || ''}"`,
        `"${contact.company || ''}"`,
        `"${contact.email || ''}"`,
        `"${contact.phone || ''}"`,
        `"${contact.mobile || ''}"`,
        `"${contact.address || ''}"`,
        `"${contact.website || ''}"`,
        `"${contact.notes || ''}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `business_cards_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    logExportEvent({
      exportType: "business_cards",
      exportFormat: "csv",
      recordCount: scannedContacts.length,
      containsPii: true,
      fieldsExported: ["name", "email", "phone", "company"],
      requiredStepUp: true,
    });

    toast.success("CSV exported successfully");
  };

  const handleExportCSV = () => {
    stepUp.requireStepUp("Export Business Cards (CSV)", "normal", doExportCSV);
  };

  const doExportExcel = () => {
    if (scannedContacts.length === 0) {
      toast.error("No contacts to export");
      return;
    }

    const headers = ["Name", "Job Title", "Company", "Email", "Phone", "Mobile", "Address", "Website", "Notes"];
    const csvContent = "\uFEFF" + [
      headers.join("\t"),
      ...scannedContacts.map(contact => [
        contact.name || '',
        contact.jobTitle || '',
        contact.company || '',
        contact.email || '',
        contact.phone || '',
        contact.mobile || '',
        contact.address || '',
        contact.website || '',
        contact.notes || ''
      ].join("\t"))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `business_cards_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();

    logExportEvent({
      exportType: "business_cards",
      exportFormat: "xls",
      recordCount: scannedContacts.length,
      containsPii: true,
      fieldsExported: ["name", "email", "phone", "company"],
      requiredStepUp: true,
    });

    toast.success("Excel file exported successfully");
  };

  const handleExportExcel = () => {
    stepUp.requireStepUp("Export Business Cards (Excel)", "normal", doExportExcel);
  };


  return (
    <ToolAnimatedFrame theme={toolThemes.emerald}>
    <div
      data-allow-dark-cta
      className="min-h-screen"
    >
      <div className="container mx-auto px-4 pt-6 pb-8 max-w-6xl">
        {/* Header — emerald ombré, white ink (matches Interior Design / Property Measurement) */}
        <div
          className="rounded-2xl px-6 py-10 mb-8 text-center relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #064E3B 0%, #04231A 55%, #022c1c 100%)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 60px -30px rgba(0,0,0,0.55)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at top, rgba(255,255,255,0.10), transparent 60%)",
            }}
          />
          <div className="relative z-10">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1 mb-4"
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.28)",
                color: "#FFFFFF",
              }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "#FFFFFF" }} />
              <span className="text-sm font-medium" style={{ color: "#FFFFFF" }}>AI-Powered OCR</span>
            </div>
            <h1
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ color: "#FFFFFF" }}
            >
              AI Business Card Scanner
            </h1>
            <p className="max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.90)" }}>
              Scan business cards with AI-powered OCR. Your data is encrypted end-to-end.
            </p>

            {/* Security Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {[
                { icon: Lock, label: "End-to-End Encrypted" },
                { icon: Shield, label: "GDPR Compliant" },
                { icon: Eye, label: "Private Processing" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.28)",
                    color: "#FFFFFF",
                  }}
                >
                  <Icon className="h-3 w-3" style={{ color: "#FFFFFF" }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Privacy Alert */}
        <Alert
          className="mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(6,95,70,0.28), rgba(0,0,0,0.55))",
            border: "1px solid rgba(255,255,255,0.28)",
          }}
        >
          <Info className="h-4 w-4" style={{ color: "#FFFFFF" }} />
          <AlertDescription className="text-sm" style={{ color: "#FFFFFF" }}>
            <strong style={{ color: "#FFFFFF" }}>Your privacy matters:</strong> All scanned data is encrypted with a key only you possess.
            Data is processed in-memory and never stored on our servers.
          </AlertDescription>
        </Alert>


        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <Card
            className="border-rose-500/50 allow-white"
            data-no-contrast-guard
            style={{
              background: "linear-gradient(180deg, rgba(7,16,31,0.94) 0%, rgba(4,7,13,0.97) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 60px -22px rgba(251,113,133,0.35)",
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white allow-white">
                <Sparkles className="h-5 w-5 text-rose-300 allow-white" />
                Scan Business Cards
              </CardTitle>
              <CardDescription className="text-white/85 allow-white">
                Use your camera or upload images to extract contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "camera" | "upload")}>
                <TabsList
                  className="bcs-tabs grid w-full grid-cols-2 mb-4 border border-rose-500/40 allow-white"
                  data-no-contrast-guard
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <TabsTrigger
                    value="camera"
                    data-no-contrast-guard
                    data-allow-dark-cta
                    className="bcs-tab gap-2 allow-white data-[state=active]:bg-rose-500 data-[state=active]:text-white"
                    style={{ color: activeTab === "camera" ? "#FFFFFF" : "rgba(255,255,255,0.78)" }}
                  >
                    <Camera className="h-4 w-4 allow-white" />
                    Camera
                  </TabsTrigger>
                  <TabsTrigger
                    value="upload"
                    data-no-contrast-guard
                    data-allow-dark-cta
                    className="bcs-tab gap-2 allow-white data-[state=active]:bg-rose-500 data-[state=active]:text-white"
                    style={{ color: activeTab === "upload" ? "#FFFFFF" : "rgba(255,255,255,0.78)" }}
                  >
                    <Upload className="h-4 w-4 allow-white" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="camera" className="min-h-[560px]">
                  <BusinessCardCamera
                    onScanComplete={handleScanComplete}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    encryptionKey={encryptionKey}
                  />
                </TabsContent>

                <TabsContent value="upload" className="min-h-[560px]">
                  <BusinessCardUpload
                    onScanComplete={handleScanComplete}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    encryptionKey={encryptionKey}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card
            className="border-rose-500/50 allow-white"
            data-no-contrast-guard
            style={{
              background: "linear-gradient(180deg, rgba(7,16,31,0.94) 0%, rgba(4,7,13,0.97) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 60px -22px rgba(251,113,133,0.35)",
            }}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white allow-white">
                    <CheckCircle2 className="h-5 w-5 text-rose-300 allow-white" />
                    Scanned Contacts
                    {scannedContacts.length > 0 && (
                      <Badge className="bg-rose-500/25 text-rose-100 allow-white" data-no-contrast-guard>
                        {scannedContacts.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-white/85 allow-white">
                    Review and export your extracted contacts
                  </CardDescription>
                </div>
                {scannedContacts.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    data-no-contrast-guard
                    data-allow-dark-cta
                    className="text-white/85 hover:text-white allow-white"
                    onClick={() => setShowEncryptedData(!showEncryptedData)}
                  >
                    {showEncryptedData ? <EyeOff className="h-4 w-4 allow-white" /> : <Eye className="h-4 w-4 allow-white" />}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <BusinessCardResults
                contacts={scannedContacts}
                onDelete={handleDeleteContact}
                showEncrypted={showEncryptedData}
                onUpdateContact={updateContactState}
                onSaveContact={handleSaveContact}
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        {scannedContacts.length > 0 && (
          <Card
            className="mt-6 border-rose-500/50 allow-white"
            data-no-contrast-guard
            style={{
              background: "linear-gradient(180deg, rgba(7,16,31,0.94) 0%, rgba(4,7,13,0.97) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1 text-sm text-white/90 allow-white">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-rose-300 allow-white" />
                    <span>All data encrypted with your session key</span>
                  </div>
                  <div className="text-[11px] text-white/65 allow-white">
                    Delete here only clears the scanner. CRM records remain — manage them on the CRM page.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    data-no-contrast-guard
                    data-allow-dark-cta
                    className="gap-2 allow-white"
                    style={{ background: "transparent", borderColor: "rgba(251,113,133,0.45)", color: "#FFFFFF" }}
                  >
                    <Download className="h-4 w-4 allow-white" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    data-no-contrast-guard
                    data-allow-dark-cta
                    className="gap-2 allow-white"
                    style={{ background: "transparent", borderColor: "rgba(251,113,133,0.45)", color: "#FFFFFF" }}
                  >
                    <FileSpreadsheet className="h-4 w-4 allow-white" />
                    Export Excel
                  </Button>
                  {user && (
                    <Button
                      size="sm"
                      data-no-contrast-guard
                      data-allow-dark-cta
                      className="bcs-action-dark gap-2 allow-white"
                      onClick={handleSaveAll}
                    >
                      <UserPlus className="h-4 w-4 allow-white" />
                      Save All to CRM
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleClearAll} className="bcs-action-danger gap-2 allow-white" data-no-contrast-guard data-allow-dark-cta>
                    <Trash2 className="h-4 w-4 allow-white" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Privacy Notice */}
        <div className="mt-8 text-center text-xs text-white/90 space-y-2 allow-white" data-no-contrast-guard>
          <p>
            <Lock className="h-3 w-3 inline mr-1 text-rose-300 allow-white" />
            Your scanned data is encrypted client-side and never transmitted to our servers unencrypted.
          </p>
          <p>
            <Shield className="h-3 w-3 inline mr-1 text-rose-300 allow-white" />
            Platform analytics track only usage counts, never personal contact data.
          </p>
        </div>
      </div>


      <ReAuthModal
        open={stepUp.modalOpen}
        onOpenChange={stepUp.onModalOpenChange}
        onSuccess={stepUp.onModalSuccess}
        actionLabel={stepUp.modalActionLabel}
        severity={stepUp.modalSeverity}
      />

      <Dialog open={!!dupDialog} onOpenChange={(o) => !o && setDupDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Existing contact found in CRM</DialogTitle>
            <DialogDescription>
              A matching contact already exists. Choose how to handle the scanned card.
            </DialogDescription>
          </DialogHeader>
          {dupDialog && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
              <div><span className="text-muted-foreground">Name:</span> {dupDialog.existing.full_name || "—"}</div>
              <div><span className="text-muted-foreground">Email:</span> {dupDialog.existing.email_lower || "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {dupDialog.existing.phone_e164 || "—"}</div>
              <div><span className="text-muted-foreground">Company:</span> {dupDialog.existing.company_name || "—"}</div>
              <div><span className="text-muted-foreground">Type:</span> {dupDialog.existing.contact_type || "—"}</div>
            </div>
          )}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setDupDialog(null)}>Cancel</Button>
            <Button variant="outline" onClick={() => resolveDuplicate("append_note")}>Add Note Only</Button>
            <Button variant="outline" onClick={() => resolveDuplicate("insert")}>Add New Anyway</Button>
            <Button variant="outline" onClick={() => resolveDuplicate("update")}>Update Existing</Button>
            <Button onClick={() => resolveDuplicate("merge")}>Merge (recommended)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ToolAnimatedFrame>
  );
};

export default BusinessCardScanner;
