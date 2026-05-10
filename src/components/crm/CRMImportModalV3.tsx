import { useState, useRef, useEffect } from "react";
import ExcelJS from "exceljs";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Upload, FileText, Download, CheckCircle, AlertCircle, 
  Flag, FileSpreadsheet, Users, Database, User, Plus
} from "lucide-react";

// ANALYSIS_TIMEOUT: Hard timeout to prevent "Analyzing contacts..." stuck state
const ANALYSIS_TIMEOUT_MS = 60000; // 60 seconds

interface CRMImportModalV3Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

interface ImportResult {
  total: number;
  inserted: number;
  duplicates: number;
  failed: number;
  flagged: number;
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
  country?: string;
  city?: string;
  notes?: string;
  // Analysis fields
  isFlagged?: boolean;
  flagReasons?: string[];
  isDuplicate?: boolean;
  normalizedPhone?: string | null;
  normalizedEmail?: string | null;
  rowIndex?: number;
  rawData?: Record<string, string>;
}

interface CRMBroker {
  id: string;
  full_name: string;
}

// Source group options - Website is NOT allowed for imports
// EXACT ORDER: My Own Database first, then alphabetically others, Custom and Other Import last
const SOURCE_GROUPS = [
  { value: "my_own_database", label: "My Own Database" },
  { value: "broker_database", label: "Broker Database" },
  { value: "referral_database", label: "Referral Database" },
  { value: "marketing_list", label: "Marketing List" },
  { value: "event_contacts", label: "Event Contacts" },
  { value: "partner_leads", label: "Partner Leads" },
  { value: "business_cards", label: "Business Cards" },
  { value: "custom", label: "Custom (enter your own)" },
  { value: "imported", label: "Other Import" },
];

const CRMImportModalV3 = ({ open, onClose, onSuccess, userId }: CRMImportModalV3Props) => {
  const [step, setStep] = useState<"upload" | "broker" | "analysis" | "preview" | "processing" | "complete">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [sourceGroup, setSourceGroup] = useState("");
  const [customSourceLabel, setCustomSourceLabel] = useState(""); // For custom source group
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  
  // Broker attribution state
  const [registerUnderBroker, setRegisterUnderBroker] = useState(false);
  const [brokers, setBrokers] = useState<CRMBroker[]>([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [isAddingBroker, setIsAddingBroker] = useState(false);
  const [newBrokerName, setNewBrokerName] = useState("");
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  
  const [parsedData, setParsedData] = useState<ParsedLead[]>([]);
  const [analyzedData, setAnalyzedData] = useState<{
    valid: ParsedLead[];
    flagged: ParsedLead[];
    skipped: ParsedLead[];
  }>({ valid: [], flagged: [], skipped: [] });
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch brokers when entering broker step
  useEffect(() => {
    if (step === "broker") {
      fetchBrokers();
    }
  }, [step]);

  const fetchBrokers = async () => {
    setLoadingBrokers(true);
    try {
      const { data, error } = await supabase
        .from("crm_brokers")
        .select("id, full_name")
        .order("full_name");
      
      if (error) throw error;
      setBrokers(data || []);
    } catch (err) {
      console.error("Failed to fetch brokers:", err);
    } finally {
      setLoadingBrokers(false);
    }
  };

  const handleAddNewBroker = async () => {
    if (!newBrokerName.trim()) {
      toast.error("Please enter a broker name");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("crm_brokers")
        .insert({
          full_name: newBrokerName.trim(),
          owner_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      setBrokers(prev => [...prev, data]);
      setSelectedBrokerId(data.id);
      setNewBrokerName("");
      setIsAddingBroker(false);
      toast.success(`Broker "${data.full_name}" created`);
    } catch (err) {
      console.error("Failed to create broker:", err);
      toast.error("Failed to create broker");
    }
  };

  // Generate default source name from file or date (Database Name is OPTIONAL)
  // Requirement: if empty, auto-fill from filename (without extension) + date/time
  const getDefaultSourceName = (fileName?: string): string => {
    const now = new Date();
    const ts = now.toISOString().slice(0, 16).replace("T", " ");

    if (fileName) {
      const base = fileName.replace(/\.[^/.]+$/, "");
      return `${base} – ${ts}`;
    }

    return `Import – ${ts}`;
  };

  const downloadTemplate = async (format: "csv" | "xlsx" = "csv") => {
    const headers = [
      "full_name", "phone", "email", "company", "nationality", "country", "city", "notes"
    ];
    
    const sampleRows = [
      ["Ahmed Al-Rashid", "+971501234567", "ahmed@email.com", "ABC Properties", "Emirati", "UAE", "Dubai", "VIP client"],
      ["Sarah Johnson", "0551234567", "sarah@email.com", "Global Investments", "British", "UAE", "Abu Dhabi", "First-time buyer"],
    ];
    
    if (format === "xlsx") {
      // Create Excel workbook using ExcelJS (secure alternative to xlsx)
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Contacts");
      worksheet.addRow(headers);
      sampleRows.forEach(row => worksheet.addRow(row));
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 20;
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "JBJ_CRM_Import_Template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Excel template downloaded");
    } else {
      // CSV download
      const csv = [headers.join(","), ...sampleRows.map(row => row.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "JBJ_CRM_Import_Template.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV template downloaded");
    }
  };

  const normalizeHeader = (h: unknown): string =>
    String(h ?? "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/\s+/g, "_");

  const HEADER_ALIASES: Record<string, keyof Pick<ParsedLead, "full_name" | "phone" | "email" | "company" | "nationality" | "country" | "city" | "notes">> = {
    // name
    full_name: "full_name",
    fullname: "full_name",
    name: "full_name",
    contact_name: "full_name",
    client_name: "full_name",

    // phone
    phone: "phone",
    mobile: "phone",
    tel: "phone",
    telephone: "phone",
    phone_number: "phone",
    cellphone: "phone",
    cell: "phone",
    whatsapp: "phone",
    whatsapp_number: "phone",

    // email
    email: "email",
    mail: "email",
    e_mail: "email",
    email_address: "email",
    emailaddress: "email",

    // company
    company: "company",
    company_name: "company",
    organization: "company",
    organisation: "company",
    org: "company",

    // location + misc
    nationality: "nationality",
    country: "country",
    current_location_country: "country",
    location_country: "country",
    city: "city",
    current_location_city: "city",
    location_city: "city",
    notes: "notes",
    note: "notes",
    comments: "notes",
    comment: "notes",
    remarks: "notes",
    remark: "notes",
  };

  const mapRowByPosition = (row: any[]): ParsedLead => {
    const get = (idx: number) => String(row?.[idx] ?? "").trim();
    return {
      full_name: get(0),
      phone: get(1),
      email: get(2),
      company: get(3) || "",
      nationality: get(4) || "",
      country: get(5) || "",
      city: get(6) || "",
      notes: get(7) || "",
    };
  };

  const mapRowByHeaders = (headers: string[], row: any[]): ParsedLead => {
    const rawData: Record<string, string> = {};

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (!header) continue;
      rawData[header] = String(row?.[i] ?? "");

      const canonical = HEADER_ALIASES[header];
      if (canonical) {
        // Store canonical keys for later mapping
        if (!(canonical in rawData)) rawData[canonical] = rawData[header];
      }
    }

    return {
      full_name: rawData.full_name || "",
      phone: rawData.phone || "",
      email: rawData.email || "",
      company: rawData.company || "",
      nationality: rawData.nationality || "",
      country: rawData.country || "",
      city: rawData.city || "",
      notes: rawData.notes || "",
      rawData,
    };
  };

  /**
   * Parse Excel file (.xlsx / .xls) using ExcelJS (secure alternative)
   */
  const parseExcel = async (file: File): Promise<ParsedLead[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount < 2) return [];

    // Get all rows as arrays
    const grid: any[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const values = row.values as any[];
      // ExcelJS row.values is 1-indexed, shift to 0-indexed
      grid[rowNumber - 1] = values.slice(1);
    });

    if (grid.length < 2) return [];

    const rawHeaderRow = (grid[0] ?? []) as any[];
    const headers = rawHeaderRow.map(normalizeHeader);
    const usableHeaders = headers.filter((h) => !!h).length;
    const usePositionalFallback = usableHeaders < 2;

    const rows: ParsedLead[] = [];

    for (let i = 1; i < grid.length; i++) {
      const row = grid[i] as any[];
      if (!row || row.every((c) => String(c ?? "").trim() === "")) continue;

      const lead = usePositionalFallback ? mapRowByPosition(row) : mapRowByHeaders(headers, row);

      // Row number in Excel (1-indexed) including header row
      lead.rowIndex = i + 1;
      lead.rawData = lead.rawData ?? (usePositionalFallback ? {
        full_name: lead.full_name,
        phone: lead.phone,
        email: lead.email,
        company: lead.company || "",
        nationality: lead.nationality || "",
        country: lead.country || "",
        city: lead.city || "",
        notes: lead.notes || "",
      } : undefined);

      rows.push(lead);
    }

    return rows;
  };

  const sanitizeCSVValue = (val: string): string => {
    if (!val) return val;
    if (/^[=+\-@|%]/.test(val)) return "'" + val;
    return val;
  };

  const splitCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        // Handle escaped quotes ""
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (char === ',' && !inQuotes) {
        values.push(sanitizeCSVValue(current.trim()));
        current = "";
        continue;
      }

      current += char;
    }

    values.push(sanitizeCSVValue(current.trim()));
    return values.map((v) => v.replace(/^"|"$/g, ""));
  };

  const parseCSV = (text: string): ParsedLead[] => {
    const lines = text
      .split("\n")
      .map((l) => l.replace(/\r$/, ""))
      .filter((line) => line.trim());

    if (lines.length < 1) return [];

    const headerCells = splitCSVLine(lines[0]);
    const headers = headerCells.map(normalizeHeader);
    const usableHeaders = headers.filter((h) => !!h).length;
    const usePositionalFallback = usableHeaders < 2;

    const rows: ParsedLead[] = [];

    // If header row is unusable, treat first line as data row
    const startIndex = usePositionalFallback ? 0 : 1;

    for (let i = startIndex; i < lines.length; i++) {
      const cells = splitCSVLine(lines[i]);
      if (!cells || cells.every((c) => !String(c ?? "").trim())) continue;

      const lead = usePositionalFallback ? mapRowByPosition(cells) : mapRowByHeaders(headers, cells);
      lead.rowIndex = i + 1;

      if (usePositionalFallback) {
        lead.rawData = {
          full_name: lead.full_name,
          phone: lead.phone,
          email: lead.email,
          company: lead.company || "",
          nationality: lead.nationality || "",
          country: lead.country || "",
          city: lead.city || "",
          notes: lead.notes || "",
        };
      }

      rows.push(lead);
    }

    return rows;
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

  /**
   * FIXED: Phone normalization for UAE formats
   */
  const normalizePhone = (phone: string): string | null => {
    if (!phone) return null;
    
    let normalized = phone.replace(/[^\d+]/g, "");
    
    if (!normalized) return null;
    
    if (normalized.startsWith("+")) {
      if (/^\+[1-9]\d{8,14}$/.test(normalized)) {
        return normalized;
      }
      return null;
    }
    
    if (normalized.startsWith("00971")) {
      normalized = "+971" + normalized.slice(5);
    } else if (normalized.startsWith("971") && normalized.length >= 12) {
      normalized = "+" + normalized;
    } else if (normalized.startsWith("0") && normalized.length >= 9) {
      normalized = "+971" + normalized.slice(1);
    } else if (normalized.startsWith("5") && normalized.length >= 9 && normalized.length <= 10) {
      normalized = "+971" + normalized;
    } else if (normalized.startsWith("4") && normalized.length >= 8 && normalized.length <= 9) {
      normalized = "+971" + normalized;
    } else if (/^[236789]/.test(normalized) && normalized.length >= 8 && normalized.length <= 9) {
      normalized = "+971" + normalized;
    } else if (normalized.length >= 10 && normalized.length <= 15) {
      normalized = "+" + normalized;
    } else {
      return null;
    }
    
    if (/^\+[1-9]\d{8,14}$/.test(normalized)) {
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
    const skipped: ParsedLead[] = [];
    
    const seenPhones = new Set<string>();
    const seenEmails = new Set<string>();
    
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
      
      // CRITICAL: Only flag if BOTH phone AND email are missing
      const hasPhone = !!row.phone?.trim();
      const hasEmail = !!row.email?.trim();
      
      if (!hasPhone && !hasEmail) {
        flagReasons.push("missing_phone");
        flagReasons.push("missing_email");
      } else {
        // At least one exists - validate format if provided
        if (hasPhone && !normalizedPhone) {
          flagReasons.push("invalid_phone_format");
        }
        if (hasEmail && !normalizedEmail) {
          flagReasons.push("invalid_email_format");
        }
      }
      
      // Check for duplicates
      let isDupePhone = false;
      let isDupeEmail = false;
      
      if (normalizedPhone) {
        if (seenPhones.has(normalizedPhone) || seenPhones.has(phoneDigits) || 
            existingPhones.has(normalizedPhone) || existingPhones.has(phoneDigits)) {
          isDupePhone = true;
        }
        seenPhones.add(normalizedPhone);
        seenPhones.add(phoneDigits);
      }
      
      if (normalizedEmail) {
        if (seenEmails.has(normalizedEmail) || existingEmails.has(normalizedEmail)) {
          isDupeEmail = true;
        }
        seenEmails.add(normalizedEmail);
      }
      
      const analyzedRow: ParsedLead = {
        ...row,
        normalizedPhone,
        normalizedEmail,
        isFlagged: flagReasons.length > 0,
        flagReasons,
        isDuplicate: isDupePhone && isDupeEmail
      };
      
      // CRITICAL: Only skip if BOTH phone AND email are duplicates
      if (isDupePhone && isDupeEmail && normalizedPhone && normalizedEmail) {
        skipped.push(analyzedRow);
      } else {
        // Add duplicate flags for display but still import
        if (isDupePhone) flagReasons.push("duplicate_phone");
        if (isDupeEmail) flagReasons.push("duplicate_email");
        
        if (flagReasons.length > 0) {
          analyzedRow.isFlagged = true;
          analyzedRow.flagReasons = flagReasons;
          flagged.push(analyzedRow);
        }
        
        // ALL rows go to valid for import (except true duplicates)
        valid.push(analyzedRow);
      }
    }
    
    return { valid, flagged, skipped };
  };

  // Analysis timeout to prevent "Analyzing contacts..." stuck state
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analysisRunRef = useRef(0);
  const stepRef = useRef(step);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      analysisRunRef.current += 1; // invalidate any in-flight analysis
    };
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const runId = (analysisRunRef.current += 1);

    const fileName = selectedFile.name.toLowerCase();
    const isCSV = fileName.endsWith(".csv");
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
    const isVCard = fileName.endsWith(".vcf");

    if (!isCSV && !isExcel && !isVCard) {
      toast.error("Please upload a CSV, Excel, or vCard file");
      return;
    }

    setFile(selectedFile);

    // Auto-generate source name from file name if empty
    if (!sourceName) {
      setSourceName(getDefaultSourceName(selectedFile.name));
    }

    setStep("analysis");

    // Set a hard timeout to prevent infinite "Analyzing contacts..." state
    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    analysisTimeoutRef.current = setTimeout(() => {
      if (analysisRunRef.current !== runId) return;
      if (stepRef.current !== "analysis") return;

      // Dismiss any lingering toasts first
      toast.dismiss();
      toast.error("Analysis timed out. Please try again.", { duration: 6000 });

      // Force-exit analysis state + clear any pending results
      setFile(null);
      setParsedData([]);
      setAnalyzedData({ valid: [], flagged: [], skipped: [] });
      setStep("upload");
    }, ANALYSIS_TIMEOUT_MS);

    let parsed: ParsedLead[] = [];

    try {
      if (isCSV) {
        const text = await selectedFile.text();
        parsed = parseCSV(text);
      } else if (isExcel) {
        // Parse Excel using SheetJS
        parsed = await parseExcel(selectedFile);
      } else if (isVCard) {
        const text = await selectedFile.text();
        parsed = parseVCard(text);
      }

      if (analysisRunRef.current !== runId) return;

      if (parsed.length === 0) {
        toast.error("No rows found in file");
        setFile(null);
        setParsedData([]);
        setAnalyzedData({ valid: [], flagged: [], skipped: [] });
        setStep("upload");
        return;
      }

      setParsedData(parsed);

      const analyzed = await analyzeData(parsed);
      if (analysisRunRef.current !== runId) return;

      setAnalyzedData(analyzed);
      setStep("broker");
    } catch (err: any) {
      console.error("File analysis error:", err);
      const msg = err?.message ? String(err.message) : String(err);
      toast.error(`Failed to analyze file: ${msg}`);

      setFile(null);
      setParsedData([]);
      setAnalyzedData({ valid: [], flagged: [], skipped: [] });
      setStep("upload");
    } finally {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
    }
  };

  const handleSkipBroker = () => {
    setRegisterUnderBroker(false);
    setSelectedBrokerId("");
    setStep("preview");
  };

  const handleContinueWithBroker = () => {
    setStep("preview");
  };

  const processImport = async () => {
    // Validate source group is selected
    if (!sourceGroup) {
      toast.error("Please select a source category");
      return;
    }
    
    // Validate custom source has a label
    if (sourceGroup === 'custom' && !customSourceLabel.trim()) {
      toast.error("Please enter a custom source category name");
      return;
    }
    
    setStep("processing");
    setProgress(0);

    const batchId = crypto.randomUUID();
    const finalSourceName = sourceName || getDefaultSourceName(file?.name);

    const storedSourceGroup =
      sourceGroup === "custom"
        ? customSourceLabel.trim()
        : SOURCE_GROUPS.find((g) => g.value === sourceGroup)?.label || sourceGroup;

    // lead_source_type must NEVER be "website" for imports
    const leadSourceType = sourceGroup === "custom" ? customSourceLabel.trim() : sourceGroup;

    // Get selected broker info
    const selectedBroker = brokers.find((b) => b.id === selectedBrokerId);

    const result: ImportResult = {
      total: parsedData.length,
      inserted: 0,
      duplicates: analyzedData.skipped.length,
      failed: 0,
      flagged: analyzedData.flagged.length,
      errors: [],
      batchId,
      sourceId: null,
    };

    // 1. Create lead source record with broker attribution
    const { data: sourceRecord, error: sourceError } = await supabase
      .from("crm_lead_sources")
      .insert({
        source_name: finalSourceName,
        // Store the human label (or custom label) for display: "{source_group} · {source_name}"
        source_group: storedSourceGroup,
        source_file_name: file?.name,
        total_rows: parsedData.length,
        valid_rows: analyzedData.valid.length,
        flagged_rows: analyzedData.flagged.length,
        created_by_user_id: userId,
        // Broker attribution (optional)
        broker_id: registerUnderBroker && selectedBrokerId ? selectedBrokerId : null,
        broker_name_snapshot: registerUnderBroker && selectedBroker ? selectedBroker.full_name : null,
      })
      .select()
      .single();

    if (sourceError) {
      console.error("Failed to create source record:", sourceError);
      toast.error(`Failed to create import source: ${sourceError.message}`);
      setStep("upload");
      return;
    }

    result.sourceId = sourceRecord?.id || null;

    // 2. Create import tracking record
    const { data: importRecord, error: importError } = await supabase
      .from("crm_imports")
      .insert({
        id: batchId,
        user_id: userId,
        source_type: "csv" as const,
        file_name: file?.name,
        total_rows: parsedData.length,
        status: "processing",
      })
      .select()
      .single();

    if (importError) {
      toast.error(`Failed to create import record: ${importError.message}`);
      setStep("upload");
      return;
    }

    // 3. Import ALL valid leads (includes flagged)
    const leadsToImport = analyzedData.valid;

    for (let i = 0; i < leadsToImport.length; i++) {
      const row = leadsToImport[i];
      setProgress(Math.round(((i + 1) / leadsToImport.length) * 100));

      try {
        const phone = row.normalizedPhone;
        const email = row.normalizedEmail;
        const phoneRaw = row.phone || null;
        const phoneNormalized = phone ? phone.replace(/\D/g, "") : null;

        const { error: insertError } = await supabase.from("crm_leads").insert({
          full_name: row.full_name || "Unknown",
          phone_e164: phone,
          email_lower: email,
          phone_raw: phoneRaw,
          phone_normalized: phoneNormalized,
          email_normalized: email,
          company_name: row.company || null,
          nationality: row.nationality || null,
          // CRITICAL: NULL for language - UI shows "—"
          preferred_language: null,
          current_location_country: row.country || null,
          current_location_city: row.city || null,
          gender: null,
          age_range: null,
          // CRITICAL: Empty tags - no auto-tags
          tags: [],
          // Legacy display field (never used for imported leads display)
          source: `${storedSourceGroup} · ${finalSourceName}`,
          // CRITICAL: NEVER "website" for imports
          lead_source_type: leadSourceType,
          owner_type: "broker_owned",
          owner_user_id: userId,
          created_by_user_id: userId,
          contact_type: "client",
          auto_detected_type: false,
          detection_keywords: null,
          import_approval_status: "approved" as any,
          // Source tracking
          source_id: result.sourceId,
          import_batch_id: batchId,
          source_row_index: row.rowIndex,
          raw_import: row.rawData || null,
          // VIP defaults to false
          vip: false,
          vip_tagged_at: null,
          vip_tagged_by: null,
          // Flagging
          flagged: row.isFlagged || false,
          flag_reasons: row.flagReasons || [],
          notes: row.notes || null,
          imported_at: new Date().toISOString(),
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
        merged: 0,
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
    setStep("upload");
    setFile(null);
    setSourceName("");
    setSourceGroup("");
    setCustomSourceLabel("");
    setShowTemplatePicker(false);
    setRegisterUnderBroker(false);
    setSelectedBrokerId("");
    setNewBrokerName("");
    setIsAddingBroker(false);
    setParsedData([]);
    setAnalyzedData({ valid: [], flagged: [], skipped: [] });
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
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#1A1A1A]" />
            Import Contacts
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Import contacts into JBJ Global Real Estate CRM
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload with Source Selection */}
        {step === "upload" && (
          <div className="space-y-6">
            {/* Source Category - MANDATORY */}
            <div className="space-y-2">
              <Label className="text-white">
                Source Category <span className="text-red-400">*</span>
              </Label>
            {/* Native select for guaranteed visibility */}
            <select
              value={sourceGroup}
              onChange={(e) => {
                const val = e.target.value;
                setSourceGroup(val);
                if (val !== 'custom') setCustomSourceLabel('');
              }}
              className="w-full h-11 px-3 rounded-md border border-[#1A1A1A] bg-[#FDFBF7] text-white font-medium focus:outline-none focus:ring-2 focus:ring-gold/50"
              style={{ backgroundColor: '#09090b', color: '#ffffff' }}
            >
              <option value="" disabled style={{ backgroundColor: '#09090b', color: '#888888' }}>
                Select source type...
              </option>
              {SOURCE_GROUPS.map(group => (
                <option 
                  key={group.value} 
                  value={group.value}
                  style={{ backgroundColor: '#09090b', color: '#ffffff', padding: '12px' }}
                >
                  {group.label}
                </option>
              ))}
            </select>
              
              {/* Custom source label input */}
              {sourceGroup === 'custom' && (
                <div className="mt-2 space-y-2">
                  <Label className="text-white">
                    Custom source label <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Broker Master List"
                    value={customSourceLabel}
                    onChange={(e) => setCustomSourceLabel(e.target.value)}
                    className="bg-muted border-border text-white"
                  />
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Website source is not available for imports (reserved for form submissions)
              </p>
            </div>

            {/* Database Name - OPTIONAL */}
            <div className="space-y-2">
              <Label className="text-white">
                Database Name <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                placeholder="Auto-generated from file name"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="bg-muted border-border text-white"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to auto-generate from file name
              </p>
            </div>

            {/* Upload Section */}
            <div className="border-2 border-dashed border-[#B89555]/30 rounded-lg p-8 text-center bg-[#EFE6D6]/5">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-[#1A1A1A] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Upload Your Contacts
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                All rows will be imported. Only invalid rows will be flagged.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.vcf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button 
                onClick={() => {
                  if (!sourceGroup) {
                    toast.error("Please select a source category first");
                    return;
                  }
                  if (sourceGroup === "custom" && !customSourceLabel.trim()) {
                    toast.error("Please enter a custom source label first");
                    return;
                  }
                  fileInputRef.current?.click();
                }} 
                size="lg"
                variant="primary"
              >
                <Upload className="h-5 w-5 mr-2" />
                Select File
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Supports: CSV, Excel, vCard
              </p>
            </div>

            {/* Template Downloads */}
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Need a Template?</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Download the official JBJ import template
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplatePicker((v) => !v)}
                    className="text-white border-border hover:bg-muted"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Template
                  </Button>

                  {showTemplatePicker && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTemplate("xlsx")}
                        className="bg-green-600/20 border-green-600/50 text-green-400 hover:bg-green-600/30"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")}>
                        <Download className="h-4 w-4 mr-1" />
                        CSV
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Broker Attribution (OPTIONAL) */}
        {step === "broker" && (
          <div className="space-y-6">
            <div className="bg-muted/30 border border-border rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-[#1A1A1A] mt-0.5" />
                <div>
                  <h3 className="text-white font-semibold">Broker Attribution (Optional)</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Register this database under a specific broker for tracking
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="registerBroker"
                  checked={registerUnderBroker}
                  onCheckedChange={(checked) => setRegisterUnderBroker(!!checked)}
                />
                <Label htmlFor="registerBroker" className="text-white">
                  Register this database under a broker
                </Label>
              </div>

              {registerUnderBroker && (
                <div className="space-y-3 ml-6">
                  {!isAddingBroker ? (
                    <>
                      <Label className="text-white">Select Broker</Label>
                      {/* Native select for guaranteed visibility */}
                      <select
                        value={selectedBrokerId}
                        onChange={(e) => setSelectedBrokerId(e.target.value)}
                        className="w-full h-11 px-3 rounded-md border border-[#1A1A1A] bg-[#FDFBF7] text-white font-medium focus:outline-none focus:ring-2 focus:ring-gold/50"
                        style={{ backgroundColor: '#09090b', color: '#ffffff' }}
                        disabled={loadingBrokers}
                      >
                        <option value="" disabled style={{ backgroundColor: '#09090b', color: '#888888' }}>
                          {loadingBrokers ? "Loading..." : "Select a broker..."}
                        </option>
                        {brokers.map(broker => (
                          <option 
                            key={broker.id} 
                            value={broker.id}
                            style={{ backgroundColor: '#09090b', color: '#ffffff' }}
                          >
                            {broker.full_name}
                          </option>
                        ))}
                      </select>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAddingBroker(true)}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Broker
                      </Button>
                    </>
                  ) : (
                    <>
                      <Label className="text-white">New Broker Name</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter broker name..."
                          value={newBrokerName}
                          onChange={(e) => setNewBrokerName(e.target.value)}
                          className="bg-muted border-border text-white flex-1"
                        />
                        <Button onClick={handleAddNewBroker} size="sm">
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setIsAddingBroker(false);
                            setNewBrokerName("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">
                    This is for attribution only. Does not auto-assign leads.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkipBroker} className="flex-1">
                Skip
              </Button>
              <Button 
                onClick={handleContinueWithBroker} 
                className="flex-1 bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
                disabled={registerUnderBroker && !selectedBrokerId}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Analysis Step */}
        {step === "analysis" && (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B89555] mx-auto mb-4"></div>
            <p className="text-white font-medium">Analyzing contacts...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Validating data and checking for duplicates
            </p>
          </div>
        )}

        {/* Preview Step */}
        {step === "preview" && (
          <div className="space-y-4">
            {/* Source Info */}
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border">
              <Database className="h-5 w-5 text-[#1A1A1A]" />
              <div className="flex-1">
                <p className="font-medium text-white">
                  {(sourceGroup === 'custom' ? customSourceLabel.trim() : SOURCE_GROUPS.find(g => g.value === sourceGroup)?.label) || sourceGroup} · {sourceName || getDefaultSourceName(file?.name)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {parsedData.length} contacts from {file?.name}
                  {registerUnderBroker && selectedBrokerId && (
                    <span className="text-[#1A1A1A]"> · Broker: {brokers.find(b => b.id === selectedBrokerId)?.full_name}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                <Users className="h-5 w-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-green-400">{analyzedData.valid.length}</p>
                <p className="text-xs text-green-300">Will Import</p>
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
                <Flag className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-amber-400">{analyzedData.flagged.length}</p>
                <p className="text-xs text-amber-300">Flagged</p>
              </div>
              <div className="p-3 bg-[#B89555]/10 border border-[#B89555]/30/30 rounded-lg text-center">
                <AlertCircle className="h-5 w-5 text-[#1A1A1A]/70 mx-auto mb-1" />
                <p className="text-lg font-bold text-[#1A1A1A]/70">{analyzedData.skipped.length}</p>
                <p className="text-xs text-[#1A1A1A]/70">Duplicates</p>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <div className="text-xs text-green-300">
                <strong>All {analyzedData.valid.length} rows will be imported.</strong>
                <br />
                • Status: New
                <br />
                • Language: Not set (—)
                <br />
                • Source: {sourceGroup === 'custom' ? customSourceLabel.trim() : sourceGroup.replace(/_/g, ' ')} (never "Website")
              </div>
            </div>

            {/* Preview Tabs */}
            <Tabs value={activePreviewTab} onValueChange={setActivePreviewTab}>
              <TabsList className="w-full bg-muted/50">
                <TabsTrigger value="all" className="flex-1 text-xs">
                  All ({analyzedData.valid.length})
                </TabsTrigger>
                <TabsTrigger value="flagged" className="flex-1 text-xs">
                  Flagged ({analyzedData.flagged.length})
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
                        <th className="p-2 text-left text-muted-foreground">Email</th>
                        <th className="p-2 text-left text-muted-foreground">Notes</th>
                        <th className="p-2 text-left text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyzedData.valid.slice(0, 20).map((row, i) => (
                        <tr key={i} className={`border-t border-border ${row.isFlagged ? 'bg-amber-500/10' : ''}`}>
                          <td className="p-2 text-muted-foreground">{row.rowIndex}</td>
                          <td className="p-2 text-white">{row.full_name || '—'}</td>
                          <td className="p-2 text-muted-foreground font-mono text-[10px]">
                            {row.normalizedPhone || row.phone || '—'}
                          </td>
                          <td className="p-2 text-muted-foreground truncate max-w-[100px]">
                            {row.normalizedEmail || row.email || '—'}
                          </td>
                          <td className="p-2 text-muted-foreground truncate max-w-[100px]" title={row.notes || ''}>
                            {row.notes ? (row.notes.length > 20 ? row.notes.slice(0, 20) + '...' : row.notes) : '—'}
                          </td>
                          <td className="p-2">
                            {row.isFlagged ? (
                              <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/50">
                                Flagged
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-green-400 border-green-500/50">
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
                        {analyzedData.flagged.slice(0, 15).map((row, i) => (
                          <tr key={i} className="border-t border-amber-500/20">
                            <td className="p-2 text-amber-300 font-mono">{row.rowIndex}</td>
                            <td className="p-2 text-white">{row.full_name || '—'}</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {row.flagReasons?.map((reason, j) => (
                                  <Badge key={j} variant="outline" className="text-[10px] text-amber-400 border-amber-500/50">
                                    {reason.replace(/_/g, ' ')}
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
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep("broker")} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={processImport} 
                className="flex-1 bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
              >
                Import {analyzedData.valid.length} Contacts
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
                {(sourceGroup === 'custom' ? customSourceLabel.trim() : SOURCE_GROUPS.find(g => g.value === sourceGroup)?.label) || sourceGroup} · {sourceName || getDefaultSourceName(file?.name)}
              </p>
            </div>

            {/* Summary Report */}
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <h4 className="text-sm font-semibold text-white mb-3">Summary</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xl font-bold text-green-400">{result.inserted}</p>
                  <p className="text-xs text-green-300">Imported</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <p className="text-xl font-bold text-amber-400">{result.flagged}</p>
                  <p className="text-xs text-amber-300">Flagged</p>
                </div>
                <div className="p-3 bg-[#B89555]/10 rounded-lg">
                  <p className="text-xl font-bold text-[#1A1A1A]/70">{result.duplicates}</p>
                  <p className="text-xs text-[#1A1A1A]/70">Skipped</p>
                </div>
              </div>
            </div>

            {result.flagged > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                <Flag className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-amber-300 font-medium">
                    {result.flagged} leads flagged for review
                  </p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    View them in the "Flagged" tab to fix incomplete data
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

            <Button onClick={handleComplete} className="w-full bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CRMImportModalV3;