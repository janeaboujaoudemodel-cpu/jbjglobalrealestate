import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useSmartDocumentUpload } from "@/hooks/useSmartDocumentUpload";

interface Project {
  id: string;
  name: string;
  slug: string;
  developer?: { id: string; name: string; slug: string } | null;
}

interface SmartDocumentUploaderProps {
  projects: Project[] | undefined;
  onUploadComplete?: (projectId: string) => void;
}

const DOCUMENT_TYPES = [
  { value: "brochure", label: "Brochure" },
  { value: "floor_plan", label: "Floor Plan" },
  { value: "payment_plan", label: "Payment Plan" },
  { value: "factsheet", label: "Factsheet" },
  { value: "location_map", label: "Location Map" },
  { value: "renders", label: "Renders" },
  { value: "other", label: "Other" },
];

export function SmartDocumentUploader({ projects, onUploadComplete }: SmartDocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("brochure");
  const [isUploading, setIsUploading] = useState(false);
  const [manualProjectId, setManualProjectId] = useState<string>("");

  const {
    isAnalyzing,
    matchResult,
    duplicateResult,
    analyzeFile,
    uploadDocument,
    resetAnalysis,
  } = useSmartDocumentUpload(projects);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setSelectedFile(file);
      setManualProjectId("");
      
      // Analyze the file
      await analyzeFile(file);
    },
    [analyzeFile]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    const targetProjectId = manualProjectId || matchResult?.projectId;
    if (!targetProjectId) {
      toast.error("Please select a project");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadDocument(selectedFile, targetProjectId, documentType);
      
      if (result.success) {
        toast.success(result.message);
        onUploadComplete?.(targetProjectId);
        resetState();
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, manualProjectId, matchResult, documentType, uploadDocument, onUploadComplete]);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setManualProjectId("");
    resetAnalysis();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [resetAnalysis]);

  const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-red-600";
    }
  };

  return (
    <div className="space-y-4 p-6 bg-gradient-to-r from-[#FDFBF7] to-white border-2 border-gold/30 rounded-xl shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5 text-gold" />
        <h3 className="text-black font-semibold">Smart Document Upload</h3>
      </div>

      {/* File Selection */}
      <div className="space-y-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          className="hidden"
        />
        
        <div className="flex gap-3">
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger className="w-40 bg-white border-2 border-gold/30 text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-2 border-gold/30">
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem
                  key={type.value}
                  value={type.value}
                  className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black"
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="border-2 border-gold/30 text-black bg-white hover:bg-gold/10 flex-1"
          >
            <Upload className="w-4 h-4 mr-2 text-gold" />
            {selectedFile ? selectedFile.name : "Select Document"}
          </Button>
        </div>
      </div>

      {/* Analysis Results */}
      {isAnalyzing && (
        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gold/20">
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
          <span className="text-zinc-500">Analyzing document...</span>
        </div>
      )}

      {selectedFile && !isAnalyzing && (
        <div className="space-y-3">
          {/* Duplicate Warning */}
          {duplicateResult?.isDuplicate && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-red-600 font-medium">Duplicate Detected</p>
                <p className="text-red-500/70 text-sm">
                  "{duplicateResult.existingDocName}" already exists ({duplicateResult.existingDocType})
                </p>
              </div>
            </div>
          )}

          {/* Match Result */}
          {matchResult && !duplicateResult?.isDuplicate && (
            <div className="p-4 bg-white rounded-lg border-2 border-gold/20">
              <div className="flex items-center gap-2 mb-2">
                {matchResult.confidence === "high" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : matchResult.confidence === "medium" ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium ${getConfidenceColor(matchResult.confidence)}`}>
                  {matchResult.confidence === "high"
                    ? "High Confidence Match"
                    : matchResult.confidence === "medium"
                    ? "Possible Match"
                    : "Low Confidence"}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-black">
                <ArrowRight className="w-4 h-4 text-gold" />
                <span className="font-medium">{matchResult.projectName}</span>
                <span className="text-zinc-500">by {matchResult.developerName}</span>
              </div>

              {matchResult.matchedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {matchResult.matchedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 bg-gold/10 text-zinc-600 text-xs rounded border border-gold/20"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Manual Project Selection */}
          {(!matchResult || matchResult.confidence === "low") && (
            <div className="space-y-2">
              <Label className="text-zinc-600">Select Project Manually</Label>
              <Select value={manualProjectId} onValueChange={setManualProjectId}>
                <SelectTrigger className="bg-white border-2 border-gold/30 text-black">
                  <SelectValue placeholder="Choose project..." />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 border-gold/30 max-h-60">
                  {projects?.map((project) => (
                    <SelectItem
                      key={project.id}
                      value={project.id}
                      className="text-black hover:bg-gold/10 focus:bg-gold/10 focus:text-black"
                    >
                      {project.name} ({project.developer?.name || "Unknown"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={resetState}
              className="border-2 border-gold/30 text-black bg-white hover:bg-gold/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                isUploading ||
                duplicateResult?.isDuplicate ||
                (!matchResult?.projectId && !manualProjectId)
              }
              className="bg-gradient-to-r from-gold to-gold-dark text-black flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload to {matchResult?.projectName || "Selected Project"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedFile && (
        <div className="text-center py-8 text-zinc-400">
          <Upload className="w-12 h-12 mx-auto mb-2 text-gold/40" />
          <p className="text-zinc-500">Select a document to automatically detect the project</p>
          <p className="text-sm mt-1 text-zinc-400">Duplicates will be blocked</p>
        </div>
      )}
    </div>
  );
}
