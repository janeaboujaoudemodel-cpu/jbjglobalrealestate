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

  const handleScanComplete = (contacts: ScannedContact[]) => {
    setScannedContacts(prev => [...prev, ...contacts]);
    toast.success(`${contacts.length} business card(s) scanned successfully`);
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
                    <Button variant="default" size="sm" className="gap-2">
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
