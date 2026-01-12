import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, FileText, Download, CheckCircle, AlertCircle, 
  Crown, AlertTriangle, Phone, Mail, User, Flag, 
  FileSpreadsheet, Users, Sparkles, Database
} from "lucide-react";

interface CRMImportModalV2Props {
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
  flagged: number;
  premium: number;
  errors: string[];
  batchId: string | null;
  sourceId: string | null;
}

interface ParsedLead {
  full_name: string;
  phone: string;
  email: string;
  company?: string;
  nationality?: string;
  preferred_language?: string;
  country?: string;
  city?: string;
  gender?: string;
  age_range?: string;
  tags?: string;
  source?: string;
  lead_type?: string;
  category?: string;
  notes?: string;
  // Analysis fields
  isPremium?: boolean;
  isFlagged?: boolean;
  flagReasons?: string[];
  isDuplicate?: boolean;
  normalizedPhone?: string | null;
  normalizedEmail?: string | null;
  detectedGender?: string;
  detectedType?: string;
  rowIndex?: number;
  rawData?: Record<string, string>;
}

// Source group options
const SOURCE_GROUPS = [
  { value: "broker_database", label: "Broker Database" },
  { value: "referral_database", label: "Referral Database" },
  { value: "my_own_database", label: "My Own Database" },
  { value: "marketing_list", label: "Marketing List" },
  { value: "event_contacts", label: "Event Contacts" },
  { value: "partner_leads", label: "Partner Leads" },
  { value: "imported", label: "Other Import" },
];

const CRMImportModalV2 = ({ open, onClose, onSuccess, userId }: CRMImportModalV2Props) => {
  const [step, setStep] = useState<"metadata" | "upload" | "analysis" | "preview" | "processing" | "complete">("metadata");
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [sourceGroup, setSourceGroup] = useState("imported");
  const [parsedData, setParsedData] = useState<ParsedLead[]>([]);
  const [analyzedData, setAnalyzedData] = useState<{
    valid: ParsedLead[];
    flagged: ParsedLead[];
    premium: ParsedLead[];
    duplicates: ParsedLead[];
  }>({ valid: [], flagged: [], premium: [], duplicates: [] });
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart detection keywords
  const BROKER_KEYWORDS = ['broker', 'brokerage', 'real estate', 'agent', 'realty', 'properties', 'sales', 'consultant'];
  const DEVELOPER_KEYWORDS = ['developer', 'development', 'construction', 'builders', 'estates', 'holdings'];
  const INVESTOR_KEYWORDS = ['investor', 'investment', 'capital', 'fund', 'venture', 'equity'];
  const VENDOR_KEYWORDS = ['vendor', 'supplier', 'service', 'contractor', 'maintenance'];
  
  const PREMIUM_PATTERNS = [
    /(\d)\1{3,}/,
    /1234567/,
    /7654321/,
    /(\d{2})\1{2,}/,
  ];

  const FEMALE_KEYWORDS = ['mrs', 'ms', 'miss', 'girl', 'woman', 'female', 'lady', 'madam'];
  const MALE_KEYWORDS = ['mr', 'sir', 'man', 'male', 'gentleman'];

  const detectContactType = (row: Record<string, string>): { type: string; keywords: string[] } => {
    const searchText = Object.values(row).join(' ').toLowerCase();
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

  const detectGender = (name: string): string | undefined => {
    const lowerName = name.toLowerCase();
    for (const kw of FEMALE_KEYWORDS) {
      if (lowerName.includes(kw)) return 'female';
    }
    for (const kw of MALE_KEYWORDS) {
      if (lowerName.includes(kw)) return 'male';
    }
    return undefined;
  };

  const isPremiumNumber = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    return PREMIUM_PATTERNS.some(pattern => pattern.test(digitsOnly));
  };

  const downloadTemplate = () => {
    const headers = [
      "full_name", "phone", "email", "company", "nationality", "preferred_language",
      "country", "city", "gender", "age_range", "tags", "source", "lead_type", "category", "notes"
    ];
    
    const sampleRows = [
      ["Ahmed Al-Rashid (Example)", "+971501234567", "ahmed.example@email.com", "Example Properties LLC", "Emirati", "ar", "UAE", "Dubai", "male", "35-45", "investor,premium", "referral", "client", "investors", "VIP client"],
      ["Sarah Johnson (Example)", "+971551234567", "sarah.example@email.com", "Global Investments", "British", "en", "UAE", "Abu Dhabi", "female", "30-40", "buyer,vip", "website", "client", "marketing", "First-time buyer"],
    ];
    
    const csv = [headers.join(","), ...sampleRows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jbj_global_crm_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const sanitizeCSVValue = (val: string): string => {
    if (!val) return val;
    if (/^[=+\-@|%]/.test(val)) return "'" + val;
    return val;
  };

  const parseCSV = (text: string): ParsedLead[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows: ParsedLead[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(sanitizeCSVValue(current.trim().replace(/^"|"$/g, '')));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(sanitizeCSVValue(current.trim().replace(/^"|"$/g, '')));
      
      const rawData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rawData[header] = values[index] || "";
      });
      
      rows.push({
        full_name: rawData.full_name || rawData.name || rawData.fullname || '',
        phone: rawData.phone || rawData.mobile || rawData.telephone || rawData.tel || '',
        email: rawData.email || rawData.mail || rawData.email_address || '',
        company: rawData.company || rawData.company_name || rawData.organization || '',
        nationality: rawData.nationality || rawData.country_of_origin || '',
        preferred_language: rawData.preferred_language || rawData.language || rawData.lang || '',
        country: rawData.country || rawData.location_country || '',
        city: rawData.city || rawData.location_city || '',
        gender: rawData.gender || rawData.sex || '',
        age_range: rawData.age_range || rawData.age || '',
        tags: rawData.tags || rawData.labels || rawData.categories || '',
        source: rawData.source || rawData.lead_source || rawData.origin || '',
        lead_type: rawData.lead_type || rawData.type || '',
        category: rawData.category || '',
        notes: rawData.notes || rawData.comments || rawData.remarks || '',
        rowIndex: i + 1, // Excel row number (1-indexed, +1 for header)
        rawData
      });
    }
    
    return rows;
  };

  const normalizePhone = (phone: string): string | null => {
    if (!phone) return null;
    let normalized = phone.replace(/[^\d+]/g, "");
    if (!normalized.startsWith("+")) {
      if (normalized.startsWith("0")) {
        normalized = "+971" + normalized.slice(1);
      } else if (normalized.length <= 10) {
        normalized = "+971" + normalized;
      } else {
        normalized = "+" + normalized;
      }
    }
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

  const analyzeData = async (data: ParsedLead[]) => {
    const valid: ParsedLead[] = [];
    const flagged: ParsedLead[] = [];
    const premium: ParsedLead[] = [];
    const duplicates: ParsedLead[] = [];
    
    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();
    
    // Check existing leads in database
    const existingPhones = new Set<string>();
    const existingEmails = new Set<string>();
    
    const phones = data.map(d => normalizePhone(d.phone)).filter(Boolean) as string[];
    const emails = data.map(d => normalizeEmail(d.email)).filter(Boolean) as string[];
    
    if (phones.length > 0) {
      const { data: existingByPhone } = await supabase
        .from("crm_leads")
        .select("phone_e164, phone_normalized")
        .or(`phone_e164.in.(${phones.map(p => `"${p}"`).join(',')}),phone_normalized.in.(${phones.map(p => `"${p.replace(/\D/g, '')}"`).join(',')})`);
      existingByPhone?.forEach(l => {
        if (l.phone_e164) existingPhones.add(l.phone_e164);
        if (l.phone_normalized) existingPhones.add(l.phone_normalized);
      });
    }
    
    if (emails.length > 0) {
      const { data: existingByEmail } = await supabase
        .from("crm_leads")
        .select("email_lower, email_normalized")
        .or(`email_lower.in.(${emails.map(e => `"${e}"`).join(',')}),email_normalized.in.(${emails.map(e => `"${e}"`).join(',')})`);
      existingByEmail?.forEach(l => {
        if (l.email_lower) existingEmails.add(l.email_lower);
        if (l.email_normalized) existingEmails.add(l.email_normalized);
      });
    }
    
    for (const row of data) {
      const flagReasons: string[] = [];
      const normalizedPhone = normalizePhone(row.phone);
      const normalizedEmail = normalizeEmail(row.email);
      const phoneDigits = row.phone?.replace(/\D/g, '') || '';
      
      // Validation - row-level, never block entire import
      if (!row.phone && !row.email) {
        flagReasons.push("missing_phone");
        flagReasons.push("missing_email");
      } else {
        if (!row.phone) flagReasons.push("missing_phone");
        if (!row.email) flagReasons.push("missing_email");
        if (row.phone && !normalizedPhone) flagReasons.push("invalid_phone_format");
        if (row.email && !normalizedEmail) flagReasons.push("invalid_email_format");
      }
      
      // Check for duplicates
      let isDupePhone = false;
      let isDupeEmail = false;
      
      if (normalizedPhone) {
        if (seenPhones.has(normalizedPhone) || seenPhones.has(phoneDigits) || 
            existingPhones.has(normalizedPhone) || existingPhones.has(phoneDigits)) {
          isDupePhone = true;
          flagReasons.push("duplicate_phone");
        }
        seenPhones.add(normalizedPhone);
        seenPhones.add(phoneDigits);
      }
      
      if (normalizedEmail) {
        if (seenEmails.has(normalizedEmail) || existingEmails.has(normalizedEmail)) {
          isDupeEmail = true;
          flagReasons.push("duplicate_email");
        }
        seenEmails.add(normalizedEmail);
      }
      
      const detectedGender = row.gender || detectGender(row.full_name || '');
      const { type: detectedType } = detectContactType(row.rawData || {});
      const isPremium = normalizedPhone ? isPremiumNumber(normalizedPhone) : false;
      
      const analyzedRow: ParsedLead = {
        ...row,
        normalizedPhone,
        normalizedEmail,
        isPremium,
        isFlagged: flagReasons.length > 0,
        flagReasons,
        isDuplicate: isDupePhone || isDupeEmail,
        detectedGender,
        detectedType
      };
      
      // CRITICAL: All rows get imported, flagged or not!
      if (isDupePhone && isDupeEmail) {
        // Only skip if BOTH phone AND email are duplicates
        duplicates.push(analyzedRow);
      } else if (flagReasons.length > 0) {
        flagged.push(analyzedRow);
        // Flagged rows still go to valid for import
        valid.push(analyzedRow);
      } else {
        valid.push(analyzedRow);
      }
      
      if (isPremium && !analyzedRow.isDuplicate) {
        premium.push(analyzedRow);
      }
    }
    
    // Sort premium leads to top
    valid.sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return 0;
    });
    
    return { valid, flagged, premium, duplicates };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    const isCSV = fileName.endsWith(".csv");
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isVCard = fileName.endsWith(".vcf");
    
    if (!isCSV && !isExcel && !isVCard) {
      toast.error("Please upload a CSV, Excel, or vCard file");
      return;
    }

    setFile(selectedFile);
    setStep("analysis");
    
    let parsed: ParsedLead[] = [];
    
    if (isCSV) {
      const text = await selectedFile.text();
      parsed = parseCSV(text);
    } else if (isVCard) {
      const text = await selectedFile.text();
      parsed = parseVCard(text);
    } else {
      toast.info("Excel file detected. For best results, save as CSV and re-upload.");
      setStep("upload");
      return;
    }
    
    if (parsed.length === 0) {
      toast.error("No data found in file");
      setStep("upload");
      return;
    }
    
    setParsedData(parsed);
    
    toast.loading("Analyzing contacts...");
    const analyzed = await analyzeData(parsed);
    setAnalyzedData(analyzed);
    toast.dismiss();
    
    setStep("preview");
  };
  
  const parseVCard = (text: string): ParsedLead[] => {
    const contacts: ParsedLead[] = [];
    const vcards = text.split("BEGIN:VCARD");
    let rowIndex = 1;
    
    for (const vcard of vcards) {
      if (!vcard.trim()) continue;
      
      const contact: Record<string, string> = {};
      const lines = vcard.split("\n");
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("FN:")) {
          contact.full_name = trimmed.replace("FN:", "").trim();
        } else if (trimmed.startsWith("TEL")) {
          const phoneMatch = trimmed.match(/:([\d\s+\-()]+)/);
          if (phoneMatch) contact.phone = phoneMatch[1].trim();
        } else if (trimmed.startsWith("EMAIL")) {
          const emailMatch = trimmed.match(/:(.+)/);
          if (emailMatch) contact.email = emailMatch[1].trim();
        } else if (trimmed.startsWith("ORG:")) {
          contact.company = trimmed.replace("ORG:", "").split(";")[0].trim();
        }
      }
      
      if (contact.full_name || contact.phone || contact.email) {
        contacts.push({
          full_name: contact.full_name || '',
          phone: contact.phone || '',
          email: contact.email || '',
          company: contact.company,
          rowIndex: rowIndex++,
          rawData: contact
        });
      }
    }
    
    return contacts;
  };

  const processImport = async () => {
    setStep("processing");
    setProgress(0);

    const batchId = crypto.randomUUID();
    
    const result: ImportResult = {
      total: parsedData.length,
      inserted: 0,
      merged: 0,
      duplicates: analyzedData.duplicates.length,
      failed: 0,
      flagged: analyzedData.flagged.length,
      premium: analyzedData.premium.length,
      errors: [],
      batchId,
      sourceId: null
    };

    // 1. Create lead source record
    const { data: sourceRecord, error: sourceError } = await supabase
      .from("crm_lead_sources")
      .insert({
        source_name: sourceName || file?.name || "Untitled Import",
        source_group: sourceGroup,
        source_file_name: file?.name,
        total_rows: parsedData.length,
        valid_rows: analyzedData.valid.length,
        flagged_rows: analyzedData.flagged.length,
        created_by_user_id: userId
      })
      .select()
      .single();

    if (sourceError) {
      console.error("Failed to create source record:", sourceError);
      toast.error("Failed to create import source");
    } else {
      result.sourceId = sourceRecord?.id || null;
    }

    // 2. Create import tracking record
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
      setStep("metadata");
      return;
    }

    // 3. Import ALL leads (valid + flagged)
    const leadsToImport = analyzedData.valid; // This includes flagged rows now!

    for (let i = 0; i < leadsToImport.length; i++) {
      const row = leadsToImport[i];
      setProgress(Math.round(((i + 1) / leadsToImport.length) * 100));

      try {
        const phone = row.normalizedPhone;
        const email = row.normalizedEmail;
        const phoneRaw = row.phone || null;
        const phoneNormalized = phone ? phone.replace(/\D/g, '') : null;

        // Build tags array
        const baseTags = row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [];
        if (row.isPremium) baseTags.push("premium");
        if (row.detectedGender) baseTags.push(row.detectedGender);
        if (row.isFlagged) baseTags.push("flagged");

        const { type: detectedType, keywords } = detectContactType(row.rawData || {});
        
        // Insert lead with all new columns
        const { error: insertError } = await supabase
          .from("crm_leads")
          .insert({
            full_name: row.full_name || "Unknown",
            phone_e164: phone,
            email_lower: email,
            phone_raw: phoneRaw,
            phone_normalized: phoneNormalized,
            email_normalized: email,
            company_name: row.company || null,
            nationality: row.nationality || null,
            preferred_language: row.preferred_language || "en",
            current_location_country: row.country || null,
            current_location_city: row.city || null,
            gender: row.detectedGender || row.gender || null,
            age_range: row.age_range || null,
            tags: baseTags,
            source: row.source || sourceName || "import",
            owner_type: "broker_owned",
            owner_user_id: userId,
            created_by_user_id: userId,
            contact_type: detectedType as any,
            auto_detected_type: keywords.length > 0,
            detection_keywords: keywords.length > 0 ? keywords : null,
            import_approval_status: "pending" as any,
            // New columns
            source_id: result.sourceId,
            import_batch_id: batchId,
            source_row_index: row.rowIndex,
            raw_import: row.rawData || null,
            vip: row.isPremium || false,
            vip_tagged_at: row.isPremium ? new Date().toISOString() : null,
            flagged: row.isFlagged || false,
            flag_reasons: row.flagReasons || [],
            notes: row.notes || null,
            imported_at: new Date().toISOString()
          });

        if (insertError) {
          result.failed++;
          result.errors.push(`Row ${row.rowIndex}: ${insertError.message}`);
        } else {
          result.inserted++;
        }
      } catch (err: any) {
        result.failed++;
        result.errors.push(`Row ${row.rowIndex}: ${err.message}`);
      }
    }

    // 4. Update import record
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

    // 5. Update source record with final counts
    if (result.sourceId) {
      await supabase
        .from("crm_lead_sources")
        .update({
          valid_rows: result.inserted,
          flagged_rows: result.flagged
        })
        .eq("id", result.sourceId);
    }

    setResult(result);
    setStep("complete");
  };

  const handleClose = () => {
    setStep("metadata");
    setFile(null);
    setSourceName("");
    setSourceGroup("imported");
    setParsedData([]);
    setAnalyzedData({ valid: [], flagged: [], premium: [], duplicates: [] });
    setProgress(0);
    setResult(null);
    onClose();
  };

  const handleComplete = () => {
    onSuccess();
    handleClose();
  };

  const canProceedToUpload = sourceName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-gold" />
            Import Contacts - JBJ Global Real Estate
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Import your contacts into the standardized JBJ database format
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Source Metadata */}
        {step === "metadata" && (
          <div className="space-y-6">
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Database className="h-5 w-5 text-gold mt-0.5" />
                <div>
                  <h3 className="text-white font-semibold">Database Information</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Provide details about this import for proper filtering and attribution
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sourceName" className="text-white">
                  Database Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="sourceName"
                  placeholder="e.g., Broker Database Jan 2026"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="bg-muted border-border text-white"
                />
                <p className="text-xs text-muted-foreground">
                  Give this import a descriptive name for easy identification
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceGroup" className="text-white">
                  Source Category
                </Label>
                <Select value={sourceGroup} onValueChange={setSourceGroup}>
                  <SelectTrigger className="bg-muted border-border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {SOURCE_GROUPS.map(group => (
                      <SelectItem key={group.value} value={group.value} className="text-white">
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Categorize this database for filtering later
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => setStep("upload")} 
                className="flex-1 bg-gold text-black hover:bg-gold/90"
                disabled={!canProceedToUpload}
              >
                Continue to Upload
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Upload */}
        {step === "upload" && (
          <div className="space-y-6">
            {/* Source Info Badge */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
              <Database className="h-4 w-4 text-gold" />
              <span className="text-sm text-white font-medium">{sourceName}</span>
              <Badge variant="outline" className="text-xs">
                {SOURCE_GROUPS.find(g => g.value === sourceGroup)?.label}
              </Badge>
            </div>

            {/* Upload Section */}
            <div className="border-2 border-dashed border-gold/30 rounded-lg p-8 text-center bg-gold/5">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-gold mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Upload Your Database
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                All rows will be imported. Invalid or incomplete rows will be flagged for review.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.vcf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-gold text-black hover:bg-gold/90 font-semibold"
                size="lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                Select File
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Supports: CSV, Excel (.xlsx, .xls), vCard (.vcf)
              </p>
            </div>

            {/* Features */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                Row-Level Validation
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Import never fails - all rows imported</span>
                </div>
                <div className="flex items-start gap-2">
                  <Flag className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Invalid rows flagged for review</span>
                </div>
                <div className="flex items-start gap-2">
                  <Crown className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Premium numbers auto-detected</span>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Contact type auto-categorized</span>
                </div>
              </div>
            </div>

            {/* Template */}
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Need a Template?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Download our JBJ standard format template
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="shrink-0">
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </div>
            </div>

            <Button variant="outline" onClick={() => setStep("metadata")} className="w-full">
              ← Back to Database Info
            </Button>
          </div>
        )}

        {/* Analysis Step */}
        {step === "analysis" && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-white font-medium">Analyzing your database...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Validating rows, detecting duplicates, identifying premium contacts
            </p>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
              <FileText className="h-8 w-8 text-gold" />
              <div className="flex-1">
                <p className="font-medium text-white">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {parsedData.length} total contacts • Source: {sourceName}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                <Users className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-400">{analyzedData.valid.length}</p>
                <p className="text-xs text-green-300">Will Import</p>
              </div>
              <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg text-center">
                <Crown className="h-5 w-5 text-gold mx-auto mb-1" />
                <p className="text-lg font-bold text-gold">{analyzedData.premium.length}</p>
                <p className="text-xs text-gold/80">Premium</p>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                <Flag className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-amber-400">{analyzedData.flagged.length}</p>
                <p className="text-xs text-amber-300">Flagged</p>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-red-400">{analyzedData.duplicates.length}</p>
                <p className="text-xs text-red-300">Skipped</p>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <p className="text-xs text-green-300">
                <strong>All {analyzedData.valid.length} rows will be imported.</strong> Flagged rows are included but marked for review.
              </p>
            </div>

            {/* Preview Tabs */}
            <Tabs value={activePreviewTab} onValueChange={setActivePreviewTab}>
              <TabsList className="w-full bg-muted/50">
                <TabsTrigger value="all" className="flex-1 text-xs">
                  All ({analyzedData.valid.length})
                </TabsTrigger>
                <TabsTrigger value="flagged" className="flex-1 text-xs">
                  <Flag className="h-3 w-3 mr-1" />
                  Flagged ({analyzedData.flagged.length})
                </TabsTrigger>
                <TabsTrigger value="premium" className="flex-1 text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-3">
                <div className="max-h-48 overflow-auto border border-border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left text-muted-foreground">Row</th>
                        <th className="p-2 text-left text-muted-foreground">Name</th>
                        <th className="p-2 text-left text-muted-foreground">Phone</th>
                        <th className="p-2 text-left text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyzedData.valid.slice(0, 15).map((row, i) => (
                        <tr key={i} className={`border-t border-border ${row.isFlagged ? 'bg-amber-500/10' : ''}`}>
                          <td className="p-2 text-muted-foreground">{row.rowIndex}</td>
                          <td className="p-2 text-white">
                            <div className="flex items-center gap-1">
                              {row.isPremium && <Crown className="h-3 w-3 text-gold" />}
                              {row.full_name || '(No name)'}
                            </div>
                          </td>
                          <td className="p-2 text-muted-foreground font-mono">{row.normalizedPhone || '-'}</td>
                          <td className="p-2">
                            {row.isFlagged ? (
                              <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/50">
                                Flagged
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-green-400 border-green-500/50">
                                Valid
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="flagged" className="mt-3">
                <div className="max-h-48 overflow-auto border border-amber-500/30 rounded-lg bg-amber-500/5">
                  {analyzedData.flagged.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground text-sm">No flagged entries!</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-amber-500/10 sticky top-0">
                        <tr>
                          <th className="p-2 text-left text-amber-400">Row</th>
                          <th className="p-2 text-left text-amber-400">Name</th>
                          <th className="p-2 text-left text-amber-400">Issues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyzedData.flagged.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-t border-amber-500/20">
                            <td className="p-2 text-amber-300 font-mono">{row.rowIndex}</td>
                            <td className="p-2 text-white">{row.full_name || '(No name)'}</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {row.flagReasons?.map((reason, j) => (
                                  <Badge key={j} variant="outline" className="text-xs text-amber-400 border-amber-500/50">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="premium" className="mt-3">
                <div className="max-h-48 overflow-auto border border-gold/30 rounded-lg bg-gold/5">
                  {analyzedData.premium.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground text-sm">No premium numbers detected</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-gold/10 sticky top-0">
                        <tr>
                          <th className="p-2 text-left text-gold">Name</th>
                          <th className="p-2 text-left text-gold">Premium Number</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyzedData.premium.map((row, i) => (
                          <tr key={i} className="border-t border-gold/20">
                            <td className="p-2 text-white flex items-center gap-1">
                              <Crown className="h-3 w-3 text-gold" />
                              {row.full_name}
                            </td>
                            <td className="p-2 text-gold font-mono">{row.normalizedPhone}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={processImport} 
                className="flex-1 bg-gold text-black hover:bg-gold/90"
              >
                Import All {analyzedData.valid.length} Contacts
              </Button>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <div className="space-y-4 py-8">
            <div className="text-center mb-4">
              <p className="text-lg font-medium text-white">Importing contacts...</p>
              <p className="text-sm text-muted-foreground">Please don't close this window</p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-muted-foreground">{progress}% complete</p>
          </div>
        )}

        {/* Complete Step */}
        {step === "complete" && result && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-white">Import Complete!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Database: {sourceName}
              </p>
            </div>

            {/* Summary Report */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-semibold text-white mb-3">Import Summary</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xl font-bold text-green-400">{result.inserted}</p>
                  <p className="text-xs text-green-300">Leads Added</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <p className="text-xl font-bold text-amber-400">{result.flagged}</p>
                  <p className="text-xs text-amber-300">Flagged for Review</p>
                </div>
                <div className="p-3 bg-gold/10 rounded-lg">
                  <p className="text-xl font-bold text-gold">{result.premium}</p>
                  <p className="text-xs text-gold/80">Premium Leads</p>
                </div>
              </div>
            </div>

            {result.flagged > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                <Flag className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-amber-300 font-medium">
                    {result.flagged} leads need attention
                  </p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    Go to the "Flagged Leads" view to review and fix incomplete data
                  </p>
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm font-medium text-red-400">Errors ({result.errors.length})</p>
                </div>
                <div className="max-h-24 overflow-auto text-xs text-red-300">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleComplete} className="w-full bg-gold text-black hover:bg-gold/90">
              Done - View Your Leads
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CRMImportModalV2;