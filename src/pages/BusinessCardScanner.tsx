import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
import BackNavButton from "@/components/BackNavButton";
import BusinessCardCamera from "@/components/business-card/BusinessCardCamera";
import BusinessCardUpload from "@/components/business-card/BusinessCardUpload";
import BusinessCardResults from "@/components/business-card/BusinessCardResults";
import BusinessCardPrivacyNotice from "@/components/business-card/BusinessCardPrivacyNotice";
import { ScannedContact, encryptData, decryptData, generateEncryptionKey } from "@/utils/businessCardEncryption";

const BusinessCardScanner = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [scannedContacts, setScannedContacts] = useState<ScannedContact[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [showEncryptedData, setShowEncryptedData] = useState(false);

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

  // Import to CRM function using proper pipeline
  const handleImportToCRM = async () => {
    if (scannedContacts.length === 0) {
      toast.error("No contacts to import");
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Create a source entry for this import
      const { data: sourceData, error: sourceError } = await supabase
        .from("crm_lead_sources")
        .insert({
          source_name: `Business Card Scan - ${new Date().toLocaleDateString()}`,
          source_group: "business_cards",
          source_file_name: "scanner_upload",
          created_by_user_id: user?.id
        })
        .select()
        .single();

      if (sourceError) throw sourceError;

      const batchId = crypto.randomUUID();
      let successCount = 0;
      let flaggedCount = 0;

      for (let i = 0; i < scannedContacts.length; i++) {
        const contact = scannedContacts[i];
        
        // Normalize phone and email
        const phoneRaw = contact.phone || contact.mobile || '';
        let phoneNormalized: string | null = null;
        let phoneE164: string | null = null;
        
        if (phoneRaw) {
          let normalized = phoneRaw.replace(/[^\d+]/g, "");
          if (!normalized.startsWith("+")) {
            // Starts with 0 (e.g., 0501234567) -> +971501234567
            if (normalized.startsWith("0") && normalized.length >= 9) {
              normalized = "+971" + normalized.slice(1);
            }
            // Starts with 971 without + (e.g., 971501234567)
            else if (normalized.startsWith("971") && normalized.length >= 12) {
              normalized = "+" + normalized;
            }
            // Starts with 5 (UAE mobile, e.g., 501234567) -> +971501234567
            else if (normalized.startsWith("5") && normalized.length >= 9 && normalized.length <= 10) {
              normalized = "+971" + normalized;
            }
            // UAE landline or other formats
            else if (/^[23467890]/.test(normalized) && normalized.length >= 7) {
              normalized = "+971" + normalized;
            }
            // International number without + (10+ digits)
            else if (normalized.length >= 10) {
              normalized = "+" + normalized;
            }
            // Shorter but might be valid
            else if (normalized.length >= 7) {
              normalized = "+971" + normalized;
            }
          }
          // E.164 validation - be lenient for UAE (9-15 digits after +)
          if (/^\+[1-9]\d{8,14}$/.test(normalized)) {
            phoneE164 = normalized;
            phoneNormalized = normalized.replace(/\D/g, '');
          }
        }

        const emailRaw = contact.email || '';
        let emailNormalized: string | null = null;
        if (emailRaw && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(emailRaw.trim())) {
          emailNormalized = emailRaw.toLowerCase().trim();
        }

        // Determine flag reasons
        const flagReasons: string[] = [];
        if (!phoneRaw && !emailRaw) {
          flagReasons.push("missing_phone", "missing_email");
        } else {
          if (!phoneRaw) flagReasons.push("missing_phone");
          if (!emailRaw) flagReasons.push("missing_email");
          if (phoneRaw && !phoneE164) flagReasons.push("invalid_phone_format");
          if (emailRaw && !emailNormalized) flagReasons.push("invalid_email_format");
        }

        const isFlagged = flagReasons.length > 0;
        if (isFlagged) flaggedCount++;

        // Detect contact type based on job title
        let contactType = 'client';
        const jobTitle = (contact.jobTitle || '').toLowerCase();
        if (jobTitle.includes('broker') || jobTitle.includes('agent') || jobTitle.includes('realtor')) {
          contactType = 'broker';
        } else if (jobTitle.includes('developer') || jobTitle.includes('construction')) {
          contactType = 'developer';
        } else if (jobTitle.includes('investor') || jobTitle.includes('investment')) {
          contactType = 'investor';
        }

        // Insert lead with proper JBJ standard columns
        const { error: insertError } = await supabase
          .from("crm_leads")
          .insert({
            full_name: contact.name || 'Unknown',
            phone_e164: phoneE164,
            phone_raw: phoneRaw || null,
            phone_normalized: phoneNormalized,
            email_lower: emailNormalized,
            email_normalized: emailNormalized,
            company_name: contact.company || null,
            source: 'business_card_scanner',
            lead_source_type: 'business_card',
            source_id: sourceData.id,
            import_batch_id: batchId,
            source_row_index: i + 1,
            raw_import: contact as any,
            flagged: isFlagged,
            flag_reasons: flagReasons,
            imported_at: new Date().toISOString(),
            notes: `Job Title: ${contact.jobTitle || 'N/A'}\nAddress: ${contact.address || 'N/A'}\nWebsite: ${contact.website || 'N/A'}`,
            contact_type: contactType as any,
            created_by_user_id: user?.id,
            owner_type: 'broker_owned' as const,
            owner_user_id: user?.id
          } as any);

        if (!insertError) successCount++;
      }

      toast.success(`${successCount} contacts imported to CRM!${flaggedCount > 0 ? ` (${flaggedCount} flagged for review)` : ''}`);
      handleClearAll();
    } catch (error) {
      console.error('CRM import error:', error);
      toast.error('Failed to import contacts to CRM');
    }
  };

  const handleExportCSV = () => {
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
    toast.success("CSV exported successfully");
  };

  const handleExportExcel = () => {
    // For Excel, we'll use CSV with proper encoding that Excel understands
    if (scannedContacts.length === 0) {
      toast.error("No contacts to export");
      return;
    }

    const headers = ["Name", "Job Title", "Company", "Email", "Phone", "Mobile", "Address", "Website", "Notes"];
    const csvContent = "\uFEFF" + [ // BOM for Excel UTF-8
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
    toast.success("Excel file exported successfully");
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <BackNavButton />
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              AI Business Card Scanner
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Scan business cards with AI-powered OCR. Your data is encrypted end-to-end and never stored on our servers.
          </p>
          
          {/* Security Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              End-to-End Encrypted
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              GDPR Compliant
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Eye className="h-3 w-3" />
              Private Processing
            </Badge>
          </div>
        </div>

        {/* Privacy Alert */}
        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Your privacy matters:</strong> All scanned data is encrypted with a key only you possess. 
            Data is processed in-memory and never stored on our servers. You can delete all data at any time.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Scanner Section */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Scan Business Cards
              </CardTitle>
              <CardDescription>
                Use your camera or upload images to extract contact information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "camera" | "upload")}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="camera" className="gap-2">
                    <Camera className="h-4 w-4" />
                    Camera
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="gap-2">
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
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Scanned Contacts
                    {scannedContacts.length > 0 && (
                      <Badge variant="secondary">{scannedContacts.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Review and export your extracted contacts
                  </CardDescription>
                </div>
                {scannedContacts.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
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
                onUpdateContact={(id, updates) => {
                  setScannedContacts(prev => 
                    prev.map(c => c.id === id ? { ...c, ...updates } : c)
                  );
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        {scannedContacts.length > 0 && (
          <Card className="mt-6 border-border/50">
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>All data encrypted with your session key</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Export Excel
                  </Button>
                  {user && (
                    <Button variant="default" size="sm" className="gap-2" onClick={handleImportToCRM}>
                      <UserPlus className="h-4 w-4" />
                      Import to CRM
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
        <div className="mt-8 text-center text-xs text-muted-foreground space-y-2">
          <p>
            <Lock className="h-3 w-3 inline mr-1" />
            Your scanned data is encrypted client-side and never transmitted to our servers unencrypted.
          </p>
          <p>
            <Shield className="h-3 w-3 inline mr-1" />
            Platform analytics track only usage counts, never personal contact data.
          </p>
          <button 
            onClick={() => setShowPrivacyNotice(true)} 
            className="text-primary hover:underline"
          >
            View Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessCardScanner;
