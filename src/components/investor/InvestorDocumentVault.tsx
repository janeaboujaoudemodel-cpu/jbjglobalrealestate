/**
 * Investor Document Vault
 * Allows investors to upload and manage personal documents (passport, ID, etc.)
 * Documents sync to profile and are saved immediately to the backend
 */

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Shield,
  CheckCircle2,
  Clock,
  Loader2,
  CreditCard,
  FileCheck,
  User,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";

interface InvestorDocument {
  id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_size: number | null;
  expiry_date: string | null;
  is_verified: boolean;
  created_at: string;
}

interface DocumentType {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  required: boolean;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: "passport",
    label: "Passport",
    description: "Valid passport copy",
    icon: BookOpen,
    required: true,
  },
  {
    id: "emirates_id",
    label: "Emirates ID",
    description: "UAE Emirates ID (if applicable)",
    icon: CreditCard,
    required: false,
  },
  {
    id: "national_id",
    label: "National ID",
    description: "Home country national ID",
    icon: User,
    required: false,
  },
  {
    id: "visa",
    label: "UAE Visa",
    description: "Valid UAE visa copy",
    icon: FileCheck,
    required: false,
  },
];

interface InvestorDocumentVaultProps {
  userId: string;
}

export default function InvestorDocumentVault({ userId }: InvestorDocumentVaultProps) {
  const [documents, setDocuments] = useState<InvestorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    if (userId) {
      fetchDocuments();
    }
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("investor_documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments((data as InvestorDocument[]) || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or image file (JPG, PNG, WebP)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(documentType);

    try {
      // Generate unique file path
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${userId}/${documentType}-${timestamp}-${safeName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("investor-documents")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get the URL
      const { data: urlData } = supabase.storage
        .from("investor-documents")
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase.from("investor_documents").insert({
        user_id: userId,
        document_type: documentType,
        document_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      });

      if (dbError) throw dbError;

      toast.success(`${DOCUMENT_TYPES.find((d) => d.id === documentType)?.label} uploaded successfully`);
      fetchDocuments();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (doc: InvestorDocument) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      // Extract the path from the URL
      const urlParts = doc.file_url.split("/");
      const filePath = urlParts.slice(-3).join("/"); // userId/filename

      // Delete from storage
      await supabase.storage.from("investor-documents").remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from("investor_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      toast.success("Document deleted");
      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const getDocumentForType = (typeId: string) => {
    return documents.find((d) => d.document_type === typeId);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <Card className="border-2 border-[#B89555]/30">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#1A1A1A] animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-2 border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EFE6D6]/20 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div>
              <CardTitle className="text-foreground">My Documents</CardTitle>
              <CardDescription>
                Upload once, use anywhere. Your documents are securely stored and synced.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Info Banner */}
          <div
            data-investor-vault-banner
            data-surface="emerald"
            className="p-4 rounded-lg flex items-start gap-3"
            style={{ backgroundImage: "var(--jj-emerald-ombre)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
          >
            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Secure Document Vault</p>
              <p className="text-xs mt-1" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                Your documents are encrypted and visible only to you and authorized JBJ advisors.
                Upload them once and they'll be available across all your transactions.
              </p>
            </div>
          </div>

          {/* Document Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOCUMENT_TYPES.map((docType) => {
              const existingDoc = getDocumentForType(docType.id);
              const isUploading = uploading === docType.id;
              const Icon = docType.icon;

              return (
                <div
                  key={docType.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
 existingDoc
 ? "border-[color:var(--emerald-1)]/30/50 jj-emerald-soft/50"
 : "border-border/50 bg-[#FDFBF7]/50 hover:border-[#B89555]/50"
 }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
 existingDoc ? "jj-emerald-soft" : "bg-muted"
 }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
 existingDoc ? "text-[color:var(--emerald-1)]" : "text-muted-foreground"
 }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground text-sm">{docType.label}</h4>
                        {docType.required && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Required
                          </Badge>
                        )}
                      </div>

                      {existingDoc ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground truncate">
                            {existingDoc.document_name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(existingDoc.file_size)}</span>
                            <span>•</span>
                            <span>{format(new Date(existingDoc.created_at), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            {existingDoc.is_verified ? (
                              <Badge className="jj-surface-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30/30 text-[10px]">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-500/20 text-amber-700 border-amber-500/30 text-[10px]">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending Review
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => window.open(existingDoc.file_url, "_blank")}
                              className="text-xs h-7"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDelete(existingDoc)}
                              className="text-xs h-7 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">{docType.description}</p>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.webp"
                            className="hidden"
                            ref={(el) => (fileInputRefs.current[docType.id] = el)}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(docType.id, file);
                            }}
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => fileInputRefs.current[docType.id]?.click()}
                            disabled={isUploading}
                            className="text-xs h-7"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3 mr-1" />
                                Upload
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Footer */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Private and encrypted
              </span>
              <span>
                {documents.length} of {DOCUMENT_TYPES.length} documents uploaded
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
