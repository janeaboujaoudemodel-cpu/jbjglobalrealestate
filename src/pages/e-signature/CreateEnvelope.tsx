import { useState, useCallback } from "react";
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
  Loader2
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
  type: "signature" | "initials" | "date" | "text";
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Step 2: Recipients
  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: crypto.randomUUID(), name: "", email: "", phone: "", signingOrder: 1 }
  ]);

  // Step 3: Fields
  const [signatureFields, setSignatureFields] = useState<SignatureField[]>([]);

  // Step 4: Email customization
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error("File size must be less than 50MB");
      return;
    }

    setPdfFile(file);
    setDocumentName(file.name.replace(".pdf", ""));
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
  }, []);

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
  };

  const removeRecipient = (id: string) => {
    if (recipients.length === 1) {
      toast.error("At least one recipient is required");
      return;
    }
    setRecipients(recipients.filter(r => r.id !== id));
    // Also remove fields assigned to this recipient
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
        return true;
      case 3:
        if (signatureFields.length === 0) {
          toast.error("Please add at least one signature field");
          return false;
        }
        // Check each recipient has at least one field
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
      // 1. Upload PDF to storage
      const fileName = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("esign-documents")
        .upload(fileName, pdfFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("esign-documents")
        .getPublicUrl(fileName);

      // 2. Create envelope
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
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();

      if (envelopeError) throw envelopeError;

      // 3. Create recipients
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

      // Map local IDs to database IDs
      const recipientIdMap = new Map<string, string>();
      recipients.forEach((r, i) => {
        recipientIdMap.set(r.id, createdRecipients[i].id);
      });

      // 4. Create signature fields
      const fieldInserts = signatureFields.map(f => ({
        envelope_id: envelope.id,
        recipient_id: recipientIdMap.get(f.recipientId)!,
        field_type: f.type,
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

      // 5. Send for signature
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/e-signature")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Envelope</h1>
            <p className="text-muted-foreground">
              Upload a document and add signature fields
            </p>
          </div>
        </div>

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
        <Card>
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
                  <Label>Upload PDF Document *</Label>
                  <div className="mt-2">
                    {pdfFile ? (
                      <div className="border-2 border-dashed border-gold/50 rounded-xl p-6 bg-gold/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-10 h-10 text-gold" />
                            <div>
                              <p className="font-medium">{pdfFile.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setPdfFile(null);
                              setPdfUrl(null);
                            }}
                          >
                            Change
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-gold/50 transition-colors">
                        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Click to upload PDF</p>
                        <p className="text-sm text-muted-foreground">
                          Maximum file size: 50MB
                        </p>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
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
                            <div>
                              <Label>Name *</Label>
                              <Input
                                value={recipient.name}
                                onChange={(e) => updateRecipient(recipient.id, "name", e.target.value)}
                                placeholder="John Smith"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Email *</Label>
                              <Input
                                type="email"
                                value={recipient.email}
                                onChange={(e) => updateRecipient(recipient.id, "email", e.target.value)}
                                placeholder="john@example.com"
                                className="mt-1"
                              />
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
  );
}
