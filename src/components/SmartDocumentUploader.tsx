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
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-red-500";
    }
  };

  return (
    <div className="space-y-4 p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <FileText className="w-5 h-5 text-gold" />
        <h3 className="text-white font-semibold">Smart Document Upload</h3>
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
            <SelectTrigger className="w-40 bg-zinc-950 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem
                  key={type.value}
                  value={type.value}
                  className="text-white hover:bg-zinc-800"
                >
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="border-zinc-700 text-white hover:bg-zinc-800 flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            {selectedFile ? selectedFile.name : "Select Document"}
          </Button>
        </div>
      </div>

      {/* Analysis Results */}
      {isAnalyzing && (
        <div className="flex items-center gap-3 p-4 bg-zinc-950 rounded-lg">
          <Loader2 className="w-5 h-5 text-gold animate-spin" />
          <span className="text-gray-400">Analyzing document...</span>
        </div>
      )}

      {selectedFile && !isAnalyzing && (
        <div className="space-y-3">
          {/* Duplicate Warning */}
          {duplicateResult?.isDuplicate && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">Duplicate Detected</p>
                <p className="text-gray-400 text-sm">
                  "{duplicateResult.existingDocName}" already exists ({duplicateResult.existingDocType})
                </p>
              </div>
            </div>
          )}

          {/* Match Result */}
          {matchResult && !duplicateResult?.isDuplicate && (
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex items-center gap-2 mb-2">
                {matchResult.confidence === "high" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : matchResult.confidence === "medium" ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`font-medium ${getConfidenceColor(matchResult.confidence)}`}>
                  {matchResult.confidence === "high"
                    ? "High Confidence Match"
                    : matchResult.confidence === "medium"
                    ? "Possible Match"
                    : "Low Confidence"}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-white">
                <ArrowRight className="w-4 h-4 text-gold" />
                <span className="font-medium">{matchResult.projectName}</span>
                <span className="text-gray-500">by {matchResult.developerName}</span>
              </div>

              {matchResult.matchedKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {matchResult.matchedKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 bg-zinc-800 text-gray-400 text-xs rounded"
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
              <Label className="text-gray-400">Select Project Manually</Label>
              <Select value={manualProjectId} onValueChange={setManualProjectId}>
                <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
                  <SelectValue placeholder="Choose project..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                  {projects?.map((project) => (
                    <SelectItem
                      key={project.id}
                      value={project.id}
                      className="text-white hover:bg-zinc-800"
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
              className="border-zinc-700 text-white hover:bg-zinc-800"
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
        <div className="text-center py-8 text-gray-500">
          <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Select a document to automatically detect the project</p>
          <p className="text-sm mt-1">Duplicates will be blocked</p>
        </div>
      )}
    </div>
  );
}
