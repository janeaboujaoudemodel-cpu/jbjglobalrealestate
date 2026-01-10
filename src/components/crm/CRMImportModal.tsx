import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, Download, CheckCircle, AlertCircle } from "lucide-react";

interface CRMImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

interface ImportResult {
  total: number;
  inserted: number;
  merged: number;
  duplicates: number;
  failed: number;
  errors: string[];
}

const CRMImportModal = ({ open, onClose, onSuccess, userId }: CRMImportModalProps) => {
  const [step, setStep] = useState<"upload" | "preview" | "processing" | "complete">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart detection keywords for categorizing contacts
  const BROKER_KEYWORDS = ['broker', 'brokerage', 'real estate', 'agent', 'realty', 'properties', 'sales', 'consultant'];
  const DEVELOPER_KEYWORDS = ['developer', 'development', 'construction', 'builders', 'estates', 'holdings'];
  const INVESTOR_KEYWORDS = ['investor', 'investment', 'capital', 'fund', 'venture', 'equity'];
  const VENDOR_KEYWORDS = ['vendor', 'supplier', 'service', 'contractor', 'maintenance'];

  const detectContactType = (row: Record<string, string>): { type: string; keywords: string[] } => {
    const searchText = [
      row.full_name || '',
      row.company || '',
      row.email || '',
      row.tags || '',
      row.source || ''
    ].join(' ').toLowerCase();

    const foundKeywords: string[] = [];
    
    for (const kw of BROKER_KEYWORDS) {
      if (searchText.includes(kw)) foundKeywords.push(kw);
    }
    if (foundKeywords.length > 0) return { type: 'broker', keywords: foundKeywords };

    for (const kw of DEVELOPER_KEYWORDS) {
      if (searchText.includes(kw)) foundKeywords.push(kw);
    }
    if (foundKeywords.length > 0) return { type: 'developer', keywords: foundKeywords };

    for (const kw of INVESTOR_KEYWORDS) {
      if (searchText.includes(kw)) foundKeywords.push(kw);
    }
    if (foundKeywords.length > 0) return { type: 'investor', keywords: foundKeywords };

    for (const kw of VENDOR_KEYWORDS) {
      if (searchText.includes(kw)) foundKeywords.push(kw);
    }
    if (foundKeywords.length > 0) return { type: 'vendor', keywords: foundKeywords };

    return { type: 'client', keywords: [] };
  };

  const downloadTemplate = () => {
    const headers = [
      "full_name",
      "phone",
      "email",
      "company",
      "nationality",
      "preferred_language",
      "country",
      "city",
      "gender",
      "age_range",
      "tags",
      "source"
    ];
    const sampleRow = [
      "John Doe",
      "+971501234567",
      "john@example.com",
      "ABC Properties",
      "British",
      "en",
      "UAE",
      "Dubai",
      "male",
      "30-40",
      "investor,premium",
      "website"
    ];
    
    const csv = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jj_global_capital_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Sanitize CSV values to prevent formula injection (Excel/Google Sheets)
  const sanitizeCSVValue = (val: string): string => {
    if (!val) return val;
    // Prefix formula-starting characters with single quote to force text interpretation
    if (/^[=+\-@|%]/.test(val)) {
      console.warn("[CRM Import] Sanitized potential formula injection:", val.substring(0, 20));
      return "'" + val;
    }
    return val;
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const rows: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => sanitizeCSVValue(v.trim()));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }
    
    return rows;
  };

  const normalizePhone = (phone: string): string | null => {
    if (!phone) return null;
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, "");
    // Ensure it starts with +
    if (!normalized.startsWith("+")) {
      // Assume UAE if no country code
      if (normalized.startsWith("0")) {
        normalized = "+971" + normalized.slice(1);
      } else if (normalized.length <= 10) {
        normalized = "+971" + normalized;
      } else {
        normalized = "+" + normalized;
      }
    }
    // Validate E.164 format
    if (/^\+[1-9]\d{1,14}$/.test(normalized)) {
      return normalized;
    }
    return null;
  };

  const normalizeEmail = (email: string): string | null => {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
      return normalized;
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    const isCSV = fileName.endsWith(".csv");
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isVCard = fileName.endsWith(".vcf");
    
    if (!isCSV && !isExcel && !isVCard) {
      toast.error("Please upload a CSV, Excel (.xlsx/.xls), or vCard (.vcf) file");
      return;
    }

    setFile(selectedFile);
    
    if (isCSV) {
      const text = await selectedFile.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error("No data found in CSV");
        return;
      }
      setParsedData(parsed);
    } else if (isVCard) {
      const text = await selectedFile.text();
      const parsed = parseVCard(text);
      if (parsed.length === 0) {
        toast.error("No contacts found in vCard");
        return;
      }
      setParsedData(parsed);
    } else {
      // For Excel files, show a message about using CSV
      toast.info("Excel files detected. For best results, save as CSV and re-upload.");
      return;
    }
    
    setStep("preview");
  };
  
  // Parse vCard format
  const parseVCard = (text: string): any[] => {
    const contacts: any[] = [];
    const vcards = text.split("BEGIN:VCARD");
    
    for (const vcard of vcards) {
      if (!vcard.trim()) continue;
      
      const contact: Record<string, string> = {};
      const lines = vcard.split("\n");
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("FN:")) {
          contact.full_name = trimmed.replace("FN:", "").trim();
        } else if (trimmed.startsWith("N:")) {
          // Parse N: last;first;middle;prefix;suffix
          const nameParts = trimmed.replace("N:", "").split(";");
          if (!contact.full_name && nameParts.length >= 2) {
            contact.full_name = `${nameParts[1]} ${nameParts[0]}`.trim();
          }
        } else if (trimmed.startsWith("TEL")) {
          const phoneMatch = trimmed.match(/:([\d\s+\-()]+)/);
          if (phoneMatch) {
            contact.phone = phoneMatch[1].trim();
          }
        } else if (trimmed.startsWith("EMAIL")) {
          const emailMatch = trimmed.match(/:(.+)/);
          if (emailMatch) {
            contact.email = emailMatch[1].trim();
          }
        } else if (trimmed.startsWith("ORG:")) {
          contact.company = trimmed.replace("ORG:", "").split(";")[0].trim();
        }
      }
      
      if (contact.full_name || contact.phone || contact.email) {
        contacts.push(contact);
      }
    }
    
    return contacts;
  };

  const processImport = async () => {
    setStep("processing");
    setProgress(0);

    const result: ImportResult = {
      total: parsedData.length,
      inserted: 0,
      merged: 0,
      duplicates: 0,
      failed: 0,
      errors: []
    };

    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from("crm_imports")
      .insert({
        user_id: userId,
        source_type: "csv",
        file_name: file?.name,
        total_rows: parsedData.length,
        status: "processing"
      })
      .select()
      .single();

    if (importError) {
      toast.error("Failed to create import record");
      setStep("upload");
      return;
    }

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      setProgress(Math.round(((i + 1) / parsedData.length) * 100));

      try {
        const phone = normalizePhone(row.phone);
        const email = normalizeEmail(row.email);

        if (!row.full_name) {
          result.failed++;
          result.errors.push(`Row ${i + 2}: Missing full_name`);
          continue;
        }

        // Check for duplicates by phone or email
        let existingLead = null;
        if (phone) {
          const { data } = await supabase
            .from("crm_leads")
            .select("id")
            .eq("phone_e164", phone)
            .eq("owner_user_id", userId)
            .single();
          existingLead = data;
        }
        if (!existingLead && email) {
          const { data } = await supabase
            .from("crm_leads")
            .select("id")
            .eq("email_lower", email)
            .eq("owner_user_id", userId)
            .single();
          existingLead = data;
        }

        if (existingLead) {
          // Update existing lead
          await supabase
            .from("crm_leads")
            .update({
              full_name: row.full_name,
              nationality: row.nationality || null,
              preferred_language: row.preferred_language || "en",
              current_location_country: row.country || null,
              current_location_city: row.city || null,
              gender: row.gender || null,
              age_range: row.age_range || null,
              tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [],
              source: row.source || "csv_import"
            })
            .eq("id", existingLead.id);
          result.merged++;
        } else {
          // Detect contact type using smart AI
          const { type: detectedType, keywords } = detectContactType(row);
          
          // Insert new lead with smart detection
          const { error: insertError } = await supabase
            .from("crm_leads")
            .insert({
              full_name: row.full_name,
              phone_e164: phone,
              email_lower: email,
              company_name: row.company || null,
              nationality: row.nationality || null,
              preferred_language: row.preferred_language || "en",
              current_location_country: row.country || null,
              current_location_city: row.city || null,
              gender: row.gender || null,
              age_range: row.age_range || null,
              tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [],
              source: row.source || "csv_import",
              owner_type: "broker_owned",
              owner_user_id: userId,
              created_by_user_id: userId,
              contact_type: detectedType as any,
              auto_detected_type: keywords.length > 0,
              detection_keywords: keywords.length > 0 ? keywords : null,
              import_approval_status: "pending" as any
            });

          if (insertError) {
            result.failed++;
            result.errors.push(`Row ${i + 2}: ${insertError.message}`);
          } else {
            result.inserted++;
          }
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    // Update import record
    await supabase
      .from("crm_imports")
      .update({
        inserted: result.inserted,
        merged: result.merged,
        duplicates: result.duplicates,
        failed: result.failed,
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", importRecord.id);

    // Log activity
    await supabase.from("crm_activities").insert({
      lead_id: null as any, // Type workaround
      user_id: userId,
      activity_type: "import",
      metadata: {
        import_id: importRecord.id,
        total: result.total,
        inserted: result.inserted,
        merged: result.merged,
        failed: result.failed
      }
    });

    setResult(result);
    setStep("complete");
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setParsedData([]);
    setProgress(0);
    setResult(null);
    onClose();
  };

  const handleComplete = () => {
    onSuccess();
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import leads into "My Own Leads"
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload CSV, Excel (.xlsx), or vCard (.vcf) files
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.vcf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()} className="text-white">
                Select File
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Download Template</p>
                  <p className="text-xs text-muted-foreground">
                    Use our CSV template for best results
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Required:</strong> full_name</p>
              <p><strong>Recommended:</strong> phone, email, nationality, preferred_language</p>
              <p><strong>Phone format:</strong> +971501234567 (E.164 format preferred)</p>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {parsedData.length} contacts to import
                </p>
              </div>
            </div>

            <div className="max-h-60 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Phone</th>
                    <th className="p-2 text-left">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">{row.full_name}</td>
                      <td className="p-2">{row.phone}</td>
                      <td className="p-2">{row.email}</td>
                    </tr>
                  ))}
                  {parsedData.length > 5 && (
                    <tr className="border-t">
                      <td colSpan={3} className="p-2 text-center text-muted-foreground">
                        ... and {parsedData.length - 5} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                Back
              </Button>
              <Button onClick={processImport} className="flex-1">
                Import {parsedData.length} Contacts
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="space-y-4 py-8">
            <div className="text-center mb-4">
              <p className="text-lg font-medium">Importing contacts...</p>
              <p className="text-sm text-muted-foreground">
                Please don't close this window
              </p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">
              {progress}% complete
            </p>
          </div>
        )}

        {step === "complete" && result && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Import Complete</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">{result.inserted}</p>
                <p className="text-sm text-green-700">New Leads</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-600">{result.merged}</p>
                <p className="text-sm text-blue-700">Updated</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-600">{result.duplicates}</p>
                <p className="text-sm text-yellow-700">Duplicates</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-red-700">Failed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm font-medium text-red-700">Errors</p>
                </div>
                <div className="max-h-32 overflow-auto text-xs text-red-600">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                  {result.errors.length > 10 && (
                    <p>... and {result.errors.length - 10} more errors</p>
                  )}
                </div>
              </div>
            )}

            <Button onClick={handleComplete} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CRMImportModal;
