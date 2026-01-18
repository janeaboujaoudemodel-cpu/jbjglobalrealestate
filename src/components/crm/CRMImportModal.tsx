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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, FileText, Download, CheckCircle, AlertCircle, 
  Crown, AlertTriangle, Phone, Mail, User, Flag, 
  FileSpreadsheet, Users, Sparkles
} from "lucide-react";

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
  flagged: number;
  premium: number;
  errors: string[];
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
  // Analysis fields
  isPremium?: boolean;
  isFlagged?: boolean;
  flagReasons?: string[];
  isDuplicate?: boolean;
  normalizedPhone?: string | null;
  normalizedEmail?: string | null;
  detectedGender?: string;
  detectedType?: string;
}

const CRMImportModal = ({ open, onClose, onSuccess, userId }: CRMImportModalProps) => {
  const [step, setStep] = useState<"upload" | "analysis" | "preview" | "processing" | "complete">("upload");
  const [file, setFile] = useState<File | null>(null);
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

  // Smart detection keywords for categorizing contacts
  const BROKER_KEYWORDS = ['broker', 'brokerage', 'real estate', 'agent', 'realty', 'properties', 'sales', 'consultant'];
  const DEVELOPER_KEYWORDS = ['developer', 'development', 'construction', 'builders', 'estates', 'holdings'];
  const INVESTOR_KEYWORDS = ['investor', 'investment', 'capital', 'fund', 'venture', 'equity'];
  const VENDOR_KEYWORDS = ['vendor', 'supplier', 'service', 'contractor', 'maintenance'];
  
  // Premium number patterns (repeating digits)
  const PREMIUM_PATTERNS = [
    /(\d)\1{3,}/, // 4+ same digits in a row (7777, 8888, etc.)
    /1234567/,    // Sequential
    /7654321/,    // Reverse sequential
    /(\d{2})\1{2,}/, // Repeating pairs (121212)
  ];

  // Gender detection keywords
  const FEMALE_KEYWORDS = ['mrs', 'ms', 'miss', 'girl', 'woman', 'female', 'lady', 'madam'];
  const MALE_KEYWORDS = ['mr', 'sir', 'man', 'male', 'gentleman'];

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
    
    // Dummy placeholder data - NOT real users
    const sampleRows = [
      [
        "Ahmed Al-Rashid (Example)",
        "+971501234567",
        "ahmed.example@email.com",
        "Example Properties LLC",
        "Emirati",
        "ar",
        "UAE",
        "Dubai",
        "male",
        "35-45",
        "investor,premium",
        "referral"
      ],
      [
        "Sarah Johnson (Example)",
        "+971551234567",
        "sarah.example@email.com",
        "Global Investments",
        "British",
        "en",
        "UAE",
        "Abu Dhabi",
        "female",
        "30-40",
        "buyer,vip",
        "website"
      ],
      [
        "Mohammed Khan (Example)",
        "+971521234567",
        "mohammed.example@email.com",
        "Khan Trading Co",
        "Pakistani",
        "en",
        "UAE",
        "Sharjah",
        "male",
        "40-50",
        "investor",
        "event"
      ]
    ];
    
    const csv = [headers.join(","), ...sampleRows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "jbj_global_real_estate_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded - JBJ Global Real Estate");
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

  const parseCSV = (text: string): ParsedLead[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows: ParsedLead[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      // Handle CSV with quoted values
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
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      
      rows.push({
        full_name: row.full_name || row.name || row.fullname || '',
        phone: row.phone || row.mobile || row.telephone || row.tel || '',
        email: row.email || row.mail || row.email_address || '',
        company: row.company || row.company_name || row.organization || '',
        nationality: row.nationality || row.country_of_origin || '',
        preferred_language: row.preferred_language || row.language || row.lang || '',
        country: row.country || row.location_country || '',
        city: row.city || row.location_city || '',
        gender: row.gender || row.sex || '',
        age_range: row.age_range || row.age || '',
        tags: row.tags || row.labels || row.categories || '',
        source: row.source || row.lead_source || row.origin || ''
      });
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

  const analyzeData = async (data: ParsedLead[]) => {
    const valid: ParsedLead[] = [];
    const flagged: ParsedLead[] = [];
    const premium: ParsedLead[] = [];
    const duplicates: ParsedLead[] = [];
    
    // Track seen phones and emails for duplicate detection
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
        .select("phone_e164")
        .in("phone_e164", phones);
      existingByPhone?.forEach(l => l.phone_e164 && existingPhones.add(l.phone_e164));
    }
    
    if (emails.length > 0) {
      const { data: existingByEmail } = await supabase
        .from("crm_leads")
        .select("email_lower")
        .in("email_lower", emails);
      existingByEmail?.forEach(l => l.email_lower && existingEmails.add(l.email_lower));
    }
    
    for (const row of data) {
      const flagReasons: string[] = [];
      const normalizedPhone = normalizePhone(row.phone);
      const normalizedEmail = normalizeEmail(row.email);
      
      // Check for missing required fields
      if (!row.full_name?.trim()) {
        flagReasons.push("Missing name");
      }
      
      // Check for invalid phone
      if (row.phone && !normalizedPhone) {
        flagReasons.push("Invalid phone format");
      }
      
      // Check for invalid email
      if (row.email && !normalizedEmail) {
        flagReasons.push("Invalid email format");
      }
      
      // Check for missing contact info
      if (!row.phone && !row.email) {
        flagReasons.push("No contact info (phone or email)");
      }
      
      // Check for duplicates in file
      let isDupe = false;
      if (normalizedPhone) {
        if (seenPhones.has(normalizedPhone) || existingPhones.has(normalizedPhone)) {
          isDupe = true;
        }
        seenPhones.add(normalizedPhone);
      }
      if (normalizedEmail) {
        if (seenEmails.has(normalizedEmail) || existingEmails.has(normalizedEmail)) {
          isDupe = true;
        }
        seenEmails.add(normalizedEmail);
      }
      
      // Detect gender from name if not provided
      const detectedGender = row.gender || detectGender(row.full_name);
      
      // Detect contact type - create a record for type detection
      const rowRecord: Record<string, string> = {
        full_name: row.full_name || '',
        phone: row.phone || '',
        email: row.email || '',
        company: row.company || '',
        nationality: row.nationality || '',
        preferred_language: row.preferred_language || '',
        country: row.country || '',
        city: row.city || '',
        gender: row.gender || '',
        age_range: row.age_range || '',
        tags: row.tags || '',
        source: row.source || ''
      };
      const { type: detectedType } = detectContactType(rowRecord);
      
      // Check for premium number
      const isPremium = normalizedPhone ? isPremiumNumber(normalizedPhone) : false;
      
      const analyzedRow: ParsedLead = {
        ...row,
        normalizedPhone,
        normalizedEmail,
        isPremium,
        isFlagged: flagReasons.length > 0,
        flagReasons,
        isDuplicate: isDupe,
        detectedGender,
        detectedType
      };
      
      if (isDupe) {
        duplicates.push(analyzedRow);
      } else if (flagReasons.length > 0) {
        flagged.push(analyzedRow);
      } else {
        valid.push(analyzedRow);
        if (isPremium) {
          premium.push(analyzedRow);
        }
      }
    }
    
    // Sort premium leads to top of valid list
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
      toast.error("Please upload a CSV, Excel (.xlsx/.xls), or vCard (.vcf) file");
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
      // For Excel files, show a message about using CSV
      toast.info("Excel file detected. Converting - for best results, save as CSV and re-upload.");
      setStep("upload");
      return;
    }
    
    if (parsed.length === 0) {
      toast.error("No data found in file");
      setStep("upload");
      return;
    }
    
    setParsedData(parsed);
    
    // Analyze the data
    toast.loading("Analyzing contacts...");
    const analyzed = await analyzeData(parsed);
    setAnalyzedData(analyzed);
    toast.dismiss();
    
    setStep("preview");
  };
  
  // Parse vCard format
  const parseVCard = (text: string): ParsedLead[] => {
    const contacts: ParsedLead[] = [];
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
        contacts.push({
          full_name: contact.full_name || '',
          phone: contact.phone || '',
          email: contact.email || '',
          company: contact.company
        });
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
      duplicates: analyzedData.duplicates.length,
      failed: 0,
      flagged: analyzedData.flagged.length,
      premium: analyzedData.premium.length,
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

    // Only process valid leads (not flagged or duplicates)
    const leadsToImport = analyzedData.valid;

    for (let i = 0; i < leadsToImport.length; i++) {
      const row = leadsToImport[i];
      setProgress(Math.round(((i + 1) / leadsToImport.length) * 100));

      try {
        const phone = row.normalizedPhone;
        const email = row.normalizedEmail;

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

        // Build tags array
        const baseTags = row.tags ? row.tags.split(",").map((t: string) => t.trim()) : [];
        if (row.isPremium) baseTags.push("premium");
        if (row.detectedGender) baseTags.push(row.detectedGender);

        // Create a record for type detection
        const rowRecord: Record<string, string> = {
          full_name: row.full_name || '',
          phone: row.phone || '',
          email: row.email || '',
          company: row.company || '',
          nationality: row.nationality || '',
          preferred_language: row.preferred_language || '',
          country: row.country || '',
          city: row.city || '',
          gender: row.gender || '',
          age_range: row.age_range || '',
          tags: row.tags || '',
          source: row.source || ''
        };

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
              gender: row.detectedGender || row.gender || null,
              age_range: row.age_range || null,
              tags: baseTags,
              source: row.source || "csv_import"
            })
            .eq("id", existingLead.id);
          result.merged++;
        } else {
          // Detect contact type using smart detection
          const { type: detectedType, keywords } = detectContactType(rowRecord);
          
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
              gender: row.detectedGender || row.gender || null,
              age_range: row.age_range || null,
              tags: baseTags,
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
        failed: result.failed,
        flagged: result.flagged,
        premium: result.premium
      }
    });

    setResult(result);
    setStep("complete");
  };

  const handleClose = () => {
    setStep("upload");
    setFile(null);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-gold" />
            Import Contacts - JBJ Global Real Estate
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload your contacts database to the CRM system
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-6">
            {/* Direct Upload Section */}
            <div className="border-2 border-dashed border-gold/30 rounded-lg p-8 text-center bg-gold/5">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-gold mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Upload Your Existing Database
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                <strong className="text-gold">Already have an Excel or CSV file?</strong> Upload it directly here and our system will automatically analyze, filter, organize, and import your contacts.
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
                Select File to Upload
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Supports: CSV, Excel (.xlsx, .xls), vCard (.vcf)
              </p>
            </div>

            {/* Auto-Detection Features */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" />
                Smart Auto-Detection Features
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Detects duplicates & invalid data</span>
                </div>
                <div className="flex items-start gap-2">
                  <Crown className="h-4 w-4 text-gold mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Identifies premium phone numbers</span>
                </div>
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Auto-detects gender & contact type</span>
                </div>
                <div className="flex items-start gap-2">
                  <Flag className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Flags incomplete entries</span>
                </div>
              </div>
            </div>

            {/* Template Download Section */}
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Need a Template?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Only for manual entry:</strong> Download our CSV template if you want to create a new contact list from scratch. The template contains example placeholder data showing the correct format.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate} className="shrink-0">
                  <Download className="h-4 w-4 mr-2" />
                  Template
                </Button>
              </div>
            </div>

            {/* Supported Fields */}
            <div className="text-xs text-muted-foreground space-y-1 bg-muted/20 rounded-lg p-3">
              <p className="font-semibold text-white mb-2">Recognized Column Names:</p>
              <p><strong className="text-gold">Required:</strong> full_name (or name, fullname)</p>
              <p><strong className="text-gold">Contact:</strong> phone, mobile, email</p>
              <p><strong className="text-gold">Optional:</strong> company, nationality, language, country, city, gender, age_range, tags, source</p>
            </div>
          </div>
        )}

        {step === "analysis" && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-white font-medium">Analyzing your database...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Detecting duplicates, validating data, identifying premium contacts
            </p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
              <FileText className="h-8 w-8 text-gold" />
              <div className="flex-1">
                <p className="font-medium text-white">{file?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {parsedData.length} total contacts analyzed
                </p>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                <Users className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-400">{analyzedData.valid.length}</p>
                <p className="text-xs text-green-300">Ready to Import</p>
              </div>
              <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg text-center">
                <Crown className="h-5 w-5 text-gold mx-auto mb-1" />
                <p className="text-lg font-bold text-gold">{analyzedData.premium.length}</p>
                <p className="text-xs text-gold/80">Premium Leads</p>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-amber-400">{analyzedData.flagged.length}</p>
                <p className="text-xs text-amber-300">Flagged/Incomplete</p>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-red-400">{analyzedData.duplicates.length}</p>
                <p className="text-xs text-red-300">Duplicates</p>
              </div>
            </div>

            {/* Preview Tabs */}
            <Tabs value={activePreviewTab} onValueChange={setActivePreviewTab}>
              <TabsList className="w-full bg-muted/50">
                <TabsTrigger value="all" className="flex-1 text-xs">
                  All ({analyzedData.valid.length})
                </TabsTrigger>
                <TabsTrigger value="premium" className="flex-1 text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </TabsTrigger>
                <TabsTrigger value="flagged" className="flex-1 text-xs">
                  <Flag className="h-3 w-3 mr-1" />
                  Flagged
                </TabsTrigger>
                <TabsTrigger value="duplicates" className="flex-1 text-xs">
                  Duplicates
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-3">
                <div className="max-h-48 overflow-auto border border-border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left text-muted-foreground">Name</th>
                        <th className="p-2 text-left text-muted-foreground">Phone</th>
                        <th className="p-2 text-left text-muted-foreground">Email</th>
                        <th className="p-2 text-left text-muted-foreground">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyzedData.valid.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="p-2 text-white">
                            <div className="flex items-center gap-1">
                              {row.isPremium && <Crown className="h-3 w-3 text-gold" />}
                              {row.full_name}
                            </div>
                          </td>
                          <td className="p-2 text-muted-foreground">{row.normalizedPhone || '-'}</td>
                          <td className="p-2 text-muted-foreground">{row.normalizedEmail || '-'}</td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {row.detectedType}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {analyzedData.valid.length > 10 && (
                        <tr className="border-t border-border">
                          <td colSpan={4} className="p-2 text-center text-muted-foreground">
                            ... and {analyzedData.valid.length - 10} more
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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

              <TabsContent value="flagged" className="mt-3">
                <div className="max-h-48 overflow-auto border border-amber-500/30 rounded-lg bg-amber-500/5">
                  {analyzedData.flagged.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground text-sm">No flagged entries</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-amber-500/10 sticky top-0">
                        <tr>
                          <th className="p-2 text-left text-amber-400">Name</th>
                          <th className="p-2 text-left text-amber-400">Issues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyzedData.flagged.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-t border-amber-500/20">
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
                <p className="text-xs text-amber-400 mt-2">
                  ⚠️ Flagged entries will be skipped during import. Fix them in your source file and re-upload.
                </p>
              </TabsContent>

              <TabsContent value="duplicates" className="mt-3">
                <div className="max-h-48 overflow-auto border border-red-500/30 rounded-lg bg-red-500/5">
                  {analyzedData.duplicates.length === 0 ? (
                    <p className="p-4 text-center text-muted-foreground text-sm">No duplicates found</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-red-500/10 sticky top-0">
                        <tr>
                          <th className="p-2 text-left text-red-400">Name</th>
                          <th className="p-2 text-left text-red-400">Phone/Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyzedData.duplicates.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-t border-red-500/20">
                            <td className="p-2 text-white">{row.full_name}</td>
                            <td className="p-2 text-red-300 font-mono text-xs">
                              {row.normalizedPhone || row.normalizedEmail || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <p className="text-xs text-red-400 mt-2">
                  ⚠️ Duplicates already exist in your database and will be skipped.
                </p>
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
                disabled={analyzedData.valid.length === 0}
              >
                Import {analyzedData.valid.length} Valid Contacts
              </Button>
            </div>
          </div>
        )}

        {step === "processing" && (
          <div className="space-y-4 py-8">
            <div className="text-center mb-4">
              <p className="text-lg font-medium text-white">Importing contacts...</p>
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
              <h3 className="text-lg font-medium text-white">Import Complete!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                JBJ Global Real Estate CRM Updated
              </p>
            </div>

            {/* Summary Report */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-semibold text-white mb-3">Import Summary Report</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xl font-bold text-green-400">{result.inserted}</p>
                  <p className="text-xs text-green-300">New Leads Added</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-xl font-bold text-blue-400">{result.merged}</p>
                  <p className="text-xs text-blue-300">Existing Updated</p>
                </div>
                <div className="p-3 bg-gold/10 rounded-lg">
                  <p className="text-xl font-bold text-gold">{result.premium}</p>
                  <p className="text-xs text-gold/80">Premium Leads</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mt-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xl font-bold text-muted-foreground">{result.duplicates}</p>
                  <p className="text-xs text-muted-foreground">Duplicates Skipped</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <p className="text-xl font-bold text-amber-400">{result.flagged}</p>
                  <p className="text-xs text-amber-300">Flagged/Incomplete</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <p className="text-xl font-bold text-red-400">{result.failed}</p>
                  <p className="text-xs text-red-300">Failed</p>
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm font-medium text-red-400">Errors</p>
                </div>
                <div className="max-h-24 overflow-auto text-xs text-red-300">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                  {result.errors.length > 10 && (
                    <p>... and {result.errors.length - 10} more errors</p>
                  )}
                </div>
              </div>
            )}

            <Button onClick={handleComplete} variant="dark" className="w-full">
              Done - View Your Leads
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CRMImportModal;
