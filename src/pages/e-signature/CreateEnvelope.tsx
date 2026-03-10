import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  FileText, 
  Users, 
  PenTool,
  Send,
  Plus,
  Trash2,
  Loader2,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import DocumentFieldPlacer from "@/components/e-signature/DocumentFieldPlacer";

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone: string;
  signingOrder: number;
}

interface SignatureField {
  id: string;
  recipientId: string;
  type: "signature" | "initials" | "date" | "text" | "checkbox" | "stamp";
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SavedContact {
  name: string;
  email: string;
  phone: string;
  lastUsed: number;
}

const SAVED_CONTACTS_KEY = "esign_saved_contacts";

function loadSavedContacts(): SavedContact[] {
  try {
    const raw = localStorage.getItem(SAVED_CONTACTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.sort((a: SavedContact, b: SavedContact) => b.lastUsed - a.lastUsed) : [];
  } catch {
    return [];
  }
}

function persistContacts(recipients: Recipient[]) {
  try {
    const existing = loadSavedContacts();
    const map = new Map(existing.map(c => [c.email.toLowerCase(), c]));
    
    for (const r of recipients) {
      if (r.name.trim() && r.email.trim()) {
        map.set(r.email.toLowerCase(), {
          name: r.name.trim(),
          email: r.email.trim(),
          phone: r.phone.trim(),
          lastUsed: Date.now(),
        });
      }
    }
    
    const all = Array.from(map.values())
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, 50);
    
    localStorage.setItem(SAVED_CONTACTS_KEY, JSON.stringify(all));
  } catch {}
}

const steps = [
  { id: 1, title: "Upload Document", icon: Upload },
  { id: 2, title: "Add Recipients", icon: Users },
  { id: 3, title: "Place Fields", icon: PenTool },
  { id: 4, title: "Review & Send", icon: Send },
];

export default function CreateEnvelope() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Document
  const [documentName, setDocumentName] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  // Step 2: Recipients
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: crypto.randomUUID(), name: "", email: "", phone: "", signingOrder: 1 }
  ]);

  // Saved contacts for autocomplete
  const [savedContacts] = useState<SavedContact[]>(loadSavedContacts);
  const [activeContactField, setActiveContactField] = useState<string | null>(null);
  const [contactFilter, setContactFilter] = useState("");

  // Step 3: Fields
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);

  // Step 4: Email customization
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const filteredContacts = useMemo(() => {
    if (!contactFilter || savedContacts.length === 0) return savedContacts.slice(0, 5);
    const q = contactFilter.toLowerCase();
    return savedContacts.filter(c => 
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [contactFilter, savedContacts]);

  const ACCEPTED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];

  const addDocumentFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid: File[] = [];

    for (const file of arr) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 50MB)`);
        continue;
      }

      const isAccepted = ACCEPTED_TYPES.includes(file.type) ||
        file.name.match(/\.(pdf|jpg|jpeg|png|webp|heic|heif)$/i);

      if (!isAccepted) {
        toast.error(`${file.name}: unsupported format. Use PDF or images.`);
        continue;
      }
      valid.push(file);
    }

    if (valid.length === 0) return;

    setUploadedFiles(prev => [...prev, ...valid]);

    // Auto-select first PDF as the signing document
    const firstPdf = valid.find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (firstPdf && !pdfFile) {
      setPdfFile(firstPdf);
      setDocumentName(firstPdf.name.replace(/\.pdf$/i, ""));
      setPdfUrl(URL.createObjectURL(firstPdf));
    }

    toast.success(`${valid.length} file(s) added`);
  }, [pdfFile]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addDocumentFiles(e.target.files);
      e.target.value = "";
    }
  }, [addDocumentFiles]);

  const removeUploadedFile = useCallback((index: number) => {
    setUploadedFiles(prev => {
      const removed = prev[index];
      const next = prev.filter((_, i) => i !== index);
      // If removed file was the active PDF, clear it
      if (removed === pdfFile) {
        setPdfFile(null);
        setPdfUrl(null);
        // Auto-select next PDF if available
        const nextPdf = next.find(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
        if (nextPdf) {
          setPdfFile(nextPdf);
          setDocumentName(nextPdf.name.replace(/\.pdf$/i, ""));
          setPdfUrl(URL.createObjectURL(nextPdf));
        }
      }
      return next;
    });
  }, [pdfFile]);

  const selectAsPdf = useCallback((file: File) => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfFile(file);
    setDocumentName(file.name.replace(/\.pdf$/i, ""));
    setPdfUrl(URL.createObjectURL(file));
  }, [pdfUrl]);

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (e.dataTransfer.files?.length) {
      addDocumentFiles(e.dataTransfer.files);
    }
  }, [addDocumentFiles]);

  const addRecipient = () => {
    setRecipients([
      ...recipients,
      { 
        id: crypto.randomUUID(), 
        name: "", 
        email: "", 
        phone: "", 
        signingOrder: recipients.length + 1 
      }
    ]);
  };

  const updateRecipient = (id: string, field: keyof Recipient, value: string | number) => {
    setRecipients(recipients.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
    
    // Track filter for autocomplete
    if (field === "name" || field === "email") {
      setContactFilter(String(value));
      setActiveContactField(`${id}-${field}`);
    }
  };

  const selectSavedContact = (recipientId: string, contact: SavedContact) => {
    setRecipients(recipients.map(r => 
      r.id === recipientId ? { ...r, name: contact.name, email: contact.email, phone: contact.phone } : r
    ));
    setActiveContactField(null);
    setContactFilter("");
  };

  const removeRecipient = (id: string) => {
    if (recipients.length === 1) {
      toast.error("At least one recipient is required");
      return;
    }
    setRecipients(recipients.filter(r => r.id !== id));
    setSignatureFields(signatureFields.filter(f => f.recipientId !== id));
  };

  const handleFieldsChange = (fields: SignatureField[]) => {
    setSignatureFields(fields);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!pdfFile) {
          toast.error("Please upload a PDF document");
          return false;
        }
        if (!documentName.trim()) {
          toast.error("Please enter a document name");
          return false;
        }
        return true;
      case 2:
        const invalidRecipient = recipients.find(r => !r.name.trim() || !r.email.trim());
        if (invalidRecipient) {
          toast.error("Please fill in all recipient names and emails");
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmail = recipients.find(r => !emailRegex.test(r.email));
        if (invalidEmail) {
          toast.error("Please enter valid email addresses");
          return false;
        }
        // Save contacts on successful validation
        persistContacts(recipients);
        return true;
      case 3:
        if (signatureFields.length === 0) {
          toast.error("Please add at least one signature field");
          return false;
        }
        const recipientsWithFields = new Set(signatureFields.map(f => f.recipientId));
        const missingRecipient = recipients.find(r => !recipientsWithFields.has(r.id));
        if (missingRecipient) {
          toast.error(`Please add signature fields for ${missingRecipient.name}`);
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user || !pdfFile) return;

    setIsSubmitting(true);
    try {
      const fileName = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("esign-documents")
        .upload(fileName, pdfFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("esign-documents")
        .getPublicUrl(fileName);

      const { data: envelope, error: envelopeError } = await supabase
        .from("esign_envelopes")
        .insert({
          name: documentName,
          description: documentDescription || null,
          document_url: urlData.publicUrl,
          document_filename: pdfFile.name,
          document_size_bytes: pdfFile.size,
          sender_id: user.id,
          sender_email: user.email!,
          sender_name: user.user_metadata?.full_name || user.email,
          status: "draft",
          email_subject: emailSubject || `Please sign: ${documentName}`,
          email_message: emailMessage || null,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (envelopeError) throw envelopeError;

      const recipientInserts = recipients.map(r => ({
        envelope_id: envelope.id,
        name: r.name,
        email: r.email,
        phone: r.phone || null,
        signing_order: r.signingOrder,
        token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      const { data: createdRecipients, error: recipientError } = await supabase
        .from("esign_recipients")
        .insert(recipientInserts)
        .select();

      if (recipientError) throw recipientError;

      const recipientIdMap = new Map<string, string>();
      recipients.forEach((r, i) => {
        recipientIdMap.set(r.id, createdRecipients[i].id);
      });

      const fieldInserts = signatureFields.map(f => ({
        envelope_id: envelope.id,
        recipient_id: recipientIdMap.get(f.recipientId)!,
        field_type: f.type as any,
        page_number: f.pageNumber,
        x_position: f.x,
        y_position: f.y,
        width: f.width,
        height: f.height,
      }));

      const { error: fieldError } = await supabase
        .from("esign_fields")
        .insert(fieldInserts);

      if (fieldError) throw fieldError;

      // Save contacts after successful submission
      persistContacts(recipients);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/esign-send-for-signature`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ envelope_id: envelope.id }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send envelope");
      }

      toast.success("Envelope sent for signature!");
      navigate(`/e-signature/${envelope.id}`);
    } catch (error: any) {
      console.error("Error creating envelope:", error);
      toast.error(error.message || "Failed to create envelope");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Premium Page Header — aligned with sidebar logo divider */}
      <div className="bg-black border-b border-gold/20">
        <div className="max-w-5xl mx-auto px-6 flex items-end h-[84px] pb-4 gap-4">
          <Button variant="ghost" onClick={() => navigate("/e-signature")} className="text-gold hover:text-gold/80 hover:bg-gold/10 mb-0.5">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Upload & <span className="text-gold">Sign</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-3 md:mx-4 lg:mx-6 mb-6 mt-0 rounded-b-2xl rounded-t-none border border-t-0 border-border bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
        <p className="text-muted-foreground">Upload a document, place signature fields, and send for signing</p>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div 
                className={`flex items-center gap-2 ${
                  currentStep >= step.id ? "text-gold" : "text-muted-foreground"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep >= step.id 
                    ? "bg-gold text-white" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="hidden sm:inline font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.id ? "bg-gold" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-[hsl(var(--gold)/.2)]">
          <CardContent className="p-6">
            {/* Step 1: Upload Document */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <Label>Document Name *</Label>
                  <Input
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g., Sales Agreement - Palm Jumeirah"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={documentDescription}
                    onChange={(e) => setDocumentDescription(e.target.value)}
                    placeholder="Brief description of this document..."
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Upload Documents *</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload PDFs, photos, and other documents. Select all files at once — any mix of types is supported.
                  </p>
                  <div className="mt-2 space-y-3">
                    {/* Drop zone */}
                    <div
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById("esign-file-input")?.click()}
                      className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        isDragOver
                          ? "border-gold bg-gold/10 scale-[1.01]"
                          : "border-muted-foreground/25 hover:border-gold/50"
                      }`}
                    >
                      <input
                        id="esign-file-input"
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Upload className={`w-12 h-12 mb-3 ${isDragOver ? "text-gold animate-bounce" : "text-muted-foreground"}`} />
                      <p className="text-lg font-medium text-foreground">
                        {isDragOver ? "Drop files here" : "Drop files or click to upload"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        PDFs, JPG, PNG — select multiple files at once (max 50MB each)
                      </p>
                    </div>

                    {/* Uploaded files list */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          {uploadedFiles.length} file(s) uploaded
                        </p>
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between border rounded-lg p-3 bg-background">
                            <div className="flex items-center gap-3 min-w-0">
                              {file.type.startsWith("image/") ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="w-10 h-10 rounded object-cover flex-shrink-0"
                                />
                              ) : (
                                <FileText className="w-8 h-8 text-gold flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                  {file === pdfFile && (
                                    <span className="ml-2 text-gold font-semibold">• Signing Document</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) && file !== pdfFile && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); selectAsPdf(file); }}
                                  className="text-xs"
                                >
                                  Use for signing
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); removeUploadedFile(index); }}
                                className="text-destructive hover:text-destructive h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Add Recipients */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Recipients</h3>
                    <p className="text-sm text-muted-foreground">
                      Add the people who need to sign this document
                    </p>
                  </div>
                  <Button variant="outline" onClick={addRecipient}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>

                <div className="space-y-4">
                  {recipients.map((recipient, index) => (
                    <Card key={recipient.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="relative">
                              <Label>Name *</Label>
                              <Input
                                value={recipient.name}
                                onChange={(e) => updateRecipient(recipient.id, "name", e.target.value)}
                                onFocus={() => { setActiveContactField(`${recipient.id}-name`); setContactFilter(recipient.name); }}
                                onBlur={() => setTimeout(() => setActiveContactField(null), 200)}
                                placeholder="John Smith"
                                className="mt-1"
                              />
                              {/* Saved contacts dropdown */}
                              {activeContactField === `${recipient.id}-name` && filteredContacts.length > 0 && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Recently used
                                  </div>
                                  {filteredContacts.map((c, ci) => (
                                    <button
                                      key={ci}
                                      type="button"
                                      className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex flex-col"
                                      onMouseDown={(e) => { e.preventDefault(); selectSavedContact(recipient.id, c); }}
                                    >
                                      <span className="font-medium text-foreground">{c.name}</span>
                                      <span className="text-xs text-muted-foreground">{c.email}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <Label>Email *</Label>
                              <Input
                                type="email"
                                value={recipient.email}
                                onChange={(e) => updateRecipient(recipient.id, "email", e.target.value)}
                                onFocus={() => { setActiveContactField(`${recipient.id}-email`); setContactFilter(recipient.email); }}
                                onBlur={() => setTimeout(() => setActiveContactField(null), 200)}
                                placeholder="john@example.com"
                                className="mt-1"
                              />
                              {activeContactField === `${recipient.id}-email` && filteredContacts.length > 0 && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Recently used
                                  </div>
                                  {filteredContacts.map((c, ci) => (
                                    <button
                                      key={ci}
                                      type="button"
                                      className="w-full text-left px-3 py-2 hover:bg-muted/50 text-sm flex flex-col"
                                      onMouseDown={(e) => { e.preventDefault(); selectSavedContact(recipient.id, c); }}
                                    >
                                      <span className="font-medium text-foreground">{c.name}</span>
                                      <span className="text-xs text-muted-foreground">{c.email}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div>
                              <Label>Phone (Optional)</Label>
                              <Input
                                value={recipient.phone}
                                onChange={(e) => updateRecipient(recipient.id, "phone", e.target.value)}
                                placeholder="+971 50 123 4567"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              #{index + 1}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRecipient(recipient.id)}
                              disabled={recipients.length === 1}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Place Fields */}
            {currentStep === 3 && pdfUrl && (
              <DocumentFieldPlacer
                pdfUrl={pdfUrl}
                pdfFile={pdfFile}
                recipients={recipients}
                fields={signatureFields}
                onFieldsChange={handleFieldsChange}
              />
            )}

            {/* Step 4: Review & Send */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Email Customization</h3>
                  <p className="text-sm text-muted-foreground">
                    Customize the email that will be sent to recipients
                  </p>
                </div>

                <div>
                  <Label>Email Subject</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder={`Please sign: ${documentName}`}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Message (Optional)</Label>
                  <Textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Add a personal message to include in the email..."
                    className="mt-2"
                    rows={4}
                  />
                </div>

                {/* Summary */}
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Document:</span>
                      <span className="font-medium">{documentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recipients:</span>
                      <span className="font-medium">{recipients.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Signature Fields:</span>
                      <span className="font-medium">{signatureFields.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-medium">7 days after sending</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {currentStep < 4 ? (
            <Button onClick={nextStep} className="bg-gold hover:bg-gold/90">
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-gold hover:bg-gold/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send for Signature
                </>
              )}
            </Button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
