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
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
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
    toast.success("Contact deleted");
  };

  const handleClearAll = () => {
    setScannedContacts([]);
    sessionStorage.removeItem('bcs_encryption_key');
    const newKey = generateEncryptionKey();
    sessionStorage.setItem('bcs_encryption_key', newKey);
    setEncryptionKey(newKey);
    toast.success("All data cleared and encryption key regenerated");
  };

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
    let okCount = 0;
    let dupCount = 0;
    for (const c of scannedContacts) {
      if (c.saveStatus === "saved") continue;
      updateContactState(c.id, { saveStatus: "saving" });
      const { data } = await supabase.functions.invoke("crm-save-scanned-card", {
        body: { ...buildPayload(c), action: "check" },
      });
      if (data?.status === "duplicate" && data?.existing) {
        dupCount++;
        // Default behavior for bulk: merge (enrich) instead of duplicating
        const r = await callSave(c, "merge", data.existing.id);
        if (r) okCount++;
      } else {
        const r = await callSave(c, "insert");
        if (r) okCount++;
      }
    }
    toast.success(
      `Saved ${okCount} contact(s) to CRM${dupCount > 0 ? ` (${dupCount} merged into existing)` : ""}`
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

  if (showPrivacyNotice && !consentGiven) {
    return (
      <BusinessCardPrivacyNotice 
        onAccept={() => {
          setConsentGiven(true);
          setShowPrivacyNotice(false);
        }}
        onDecline={() => {
          toast.info("You must accept the privacy terms to use this tool");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/30 via-amber-800/20 to-amber-900/30 border-b border-amber-500/30 -mx-4 px-4 py-8 mb-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-full px-4 py-1 mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">AI-Powered OCR</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              AI Business Card <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400">Scanner</span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto">
              Scan business cards with AI-powered OCR. Your data is encrypted end-to-end.
            </p>
            
            {/* Security Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <Badge className="gap-1 bg-amber-500/20 border-amber-500/40 text-amber-300">
                <Lock className="h-3 w-3" />
                End-to-End Encrypted
              </Badge>
              <Badge className="gap-1 bg-amber-500/20 border-amber-500/40 text-amber-300">
                <Shield className="h-3 w-3" />
                GDPR Compliant
              </Badge>
              <Badge className="gap-1 bg-amber-500/20 border-amber-500/40 text-amber-300">
                <Eye className="h-3 w-3" />
                Private Processing
              </Badge>
            </div>
          </div>
        </div>

        {/* Privacy Alert */}
        <Alert className="mb-6 border-amber-500/30 bg-amber-900/20">
          <Info className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-sm text-white/85">
            <strong className="text-white">Your privacy matters:</strong> All scanned data is encrypted with a key only you possess. 
            Data is processed in-memory and never stored on our servers.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Scan Business Cards
              </CardTitle>
              <CardDescription className="text-white/70">
                Use your camera or upload images to extract contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "camera" | "upload")}>
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-zinc-800 border border-amber-500/30">
                  <TabsTrigger value="camera" className="gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                    <Camera className="h-4 w-4" />
                    Camera
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white">
                    <Upload className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="camera">
                  <BusinessCardCamera 
                    onScanComplete={handleScanComplete}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    encryptionKey={encryptionKey}
                  />
                </TabsContent>
                
                <TabsContent value="upload">
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
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="h-5 w-5 text-amber-400" />
                    Scanned Contacts
                    {scannedContacts.length > 0 && (
                      <Badge className="bg-amber-500/20 text-amber-300">{scannedContacts.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Review and export your extracted contacts
                  </CardDescription>
                </div>
                {scannedContacts.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white/70 hover:text-white"
                    onClick={() => setShowEncryptedData(!showEncryptedData)}
                  >
                    {showEncryptedData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
          <Card className="mt-6 bg-zinc-900/50 border-blue-500/30">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Lock className="h-4 w-4 text-blue-400" />
                  <span>All data encrypted with your session key</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 border-[#1A1A1A] text-white/85 hover:bg-[#1A1A1A]">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 border-[#1A1A1A] text-white/85 hover:bg-[#1A1A1A]">
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Excel
                  </Button>
                  {user && (
                    <Button size="sm" className="gap-2 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSaveAll}>
                      <UserPlus className="h-4 w-4" />
                      Save All to CRM
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={handleClearAll} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Privacy Notice */}
        <div className="mt-8 text-center text-xs text-white/90 space-y-2">
          <p>
            <Lock className="h-3 w-3 inline mr-1 text-blue-400" />
            Your scanned data is encrypted client-side and never transmitted to our servers unencrypted.
          </p>
          <p>
            <Shield className="h-3 w-3 inline mr-1 text-blue-400" />
            Platform analytics track only usage counts, never personal contact data.
          </p>
          <button 
            onClick={() => setShowPrivacyNotice(true)} 
            className="text-blue-400 hover:underline"
          >
            View Privacy Policy
          </button>
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
  );
};

export default BusinessCardScanner;
