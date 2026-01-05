import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  slug: string;
  developer?: { id: string; name: string; slug: string } | null;
}

interface DocumentMatch {
  projectId: string;
  projectName: string;
  developerName: string;
  confidence: "high" | "medium" | "low";
  matchedKeywords: string[];
}

interface DuplicateCheck {
  isDuplicate: boolean;
  existingDocName?: string;
  existingDocType?: string;
}

interface UploadResult {
  success: boolean;
  message: string;
  projectId?: string;
  documentId?: string;
}

// Known developer keywords for matching
const DEVELOPER_KEYWORDS: Record<string, string[]> = {
  sobha: ["sobha", "sobha realty"],
  imtiaz: ["imtiaz", "imtiaz developments"],
  emaar: ["emaar", "emaar properties"],
  nakheel: ["nakheel"],
  damac: ["damac", "damac properties"],
  meraas: ["meraas"],
  aldar: ["aldar", "aldar properties"],
  azizi: ["azizi", "azizi developments"],
  danube: ["danube", "danube properties", "dfr"],
  ellington: ["ellington", "ellington properties"],
  binghatti: ["binghatti"],
};

// Known project keywords for matching
const PROJECT_KEYWORDS: Record<string, string[]> = {
  "sunset-bay-grand": ["sunset bay", "sunset bay grand"],
  "sobha-hartland-ii": ["hartland ii", "hartland 2", "hartland-ii"],
  "sobha-one": ["sobha one"],
  "sobha-seahaven": ["seahaven", "sea haven"],
  "sobha-reserve": ["sobha reserve", "reserve"],
  "sobha-central": ["sobha central", "central"],
  "sobha-orbis": ["sobha orbis", "orbis"],
  "sobha-elwood": ["elwood", "sobha elwood"],
  "sobha-siniya-island": ["siniya", "siniya island"],
  "sobha-verde": ["verde", "sobha verde"],
  "sobha-creek-vistas-heights": ["creek vistas", "creek vistas heights"],
};

export function useSmartDocumentUpload(projects: Project[] | undefined) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [matchResult, setMatchResult] = useState<DocumentMatch | null>(null);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheck | null>(null);

  // Extract text content from filename for matching
  const extractKeywords = useCallback((filename: string): string[] => {
    const normalized = filename
      .toLowerCase()
      .replace(/[_-]/g, " ")
      .replace(/\.(pdf|doc|docx|png|jpg|jpeg)$/i, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2);
    return normalized;
  }, []);

  // Find matching project based on filename
  const findProjectMatch = useCallback(
    (filename: string): DocumentMatch | null => {
      if (!projects || projects.length === 0) return null;

      const keywords = extractKeywords(filename);
      const filenameNorm = filename.toLowerCase();
      let bestMatch: DocumentMatch | null = null;
      let bestScore = 0;

      for (const project of projects) {
        let score = 0;
        const matchedKeywords: string[] = [];
        const projectSlug = project.slug.toLowerCase();
        const projectName = project.name.toLowerCase();
        const developerSlug = project.developer?.slug?.toLowerCase() || "";
        const developerName = project.developer?.name?.toLowerCase() || "";

        // Check project slug keywords
        const projectKeywords = PROJECT_KEYWORDS[projectSlug] || [];
        for (const kw of projectKeywords) {
          if (filenameNorm.includes(kw)) {
            score += 30;
            matchedKeywords.push(kw);
          }
        }

        // Check project name words
        const projectWords = projectName.split(/\s+/);
        for (const word of projectWords) {
          if (word.length > 2 && keywords.includes(word)) {
            score += 10;
            matchedKeywords.push(word);
          }
        }

        // Check developer keywords
        const devKeywords = DEVELOPER_KEYWORDS[developerSlug] || [];
        for (const kw of devKeywords) {
          if (filenameNorm.includes(kw)) {
            score += 20;
            matchedKeywords.push(kw);
          }
        }

        // Check developer name words
        const devWords = developerName.split(/\s+/);
        for (const word of devWords) {
          if (word.length > 2 && keywords.includes(word)) {
            score += 8;
            matchedKeywords.push(word);
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            projectId: project.id,
            projectName: project.name,
            developerName: project.developer?.name || "Unknown",
            confidence: score >= 40 ? "high" : score >= 20 ? "medium" : "low",
            matchedKeywords: [...new Set(matchedKeywords)],
          };
        }
      }

      return bestMatch;
    },
    [projects, extractKeywords]
  );

  // Check for duplicate documents
  const checkDuplicate = useCallback(
    async (projectId: string, filename: string, fileSize: number): Promise<DuplicateCheck> => {
      try {
        const { data: existingDocs } = await supabase
          .from("project_documents")
          .select("file_name, document_type, file_size")
          .eq("project_id", projectId);

        if (!existingDocs) return { isDuplicate: false };

        // Check for exact filename match
        const exactMatch = existingDocs.find(
          (doc) => doc.file_name.toLowerCase() === filename.toLowerCase()
        );
        if (exactMatch) {
          return {
            isDuplicate: true,
            existingDocName: exactMatch.file_name,
            existingDocType: exactMatch.document_type,
          };
        }

        // Check for similar files (same size and similar name)
        const similarName = existingDocs.find((doc) => {
          const docBase = doc.file_name.replace(/\.(pdf|doc|docx|png|jpg|jpeg)$/i, "").toLowerCase();
          const fileBase = filename.replace(/\.(pdf|doc|docx|png|jpg|jpeg)$/i, "").toLowerCase();
          const similarity = calculateSimilarity(docBase, fileBase);
          return similarity > 0.8 && doc.file_size === fileSize;
        });

        if (similarName) {
          return {
            isDuplicate: true,
            existingDocName: similarName.file_name,
            existingDocType: similarName.document_type,
          };
        }

        return { isDuplicate: false };
      } catch (error) {
        console.error("Error checking duplicates:", error);
        return { isDuplicate: false };
      }
    },
    []
  );

  // Simple string similarity calculation
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    return matches / longer.length;
  };

  // Analyze file before upload
  const analyzeFile = useCallback(
    async (file: File): Promise<{ match: DocumentMatch | null; duplicate: DuplicateCheck | null }> => {
      setIsAnalyzing(true);
      
      try {
        // Find matching project
        const match = findProjectMatch(file.name);
        setMatchResult(match);

        // Check for duplicates if we have a match
        let duplicate: DuplicateCheck | null = null;
        if (match && match.confidence !== "low") {
          duplicate = await checkDuplicate(match.projectId, file.name, file.size);
          setDuplicateResult(duplicate);
        }

        return { match, duplicate };
      } finally {
        setIsAnalyzing(false);
      }
    },
    [findProjectMatch, checkDuplicate]
  );

  // Upload document to matched project
  const uploadDocument = useCallback(
    async (
      file: File,
      projectId: string,
      documentType: string
    ): Promise<UploadResult> => {
      try {
        // Final duplicate check
        const duplicate = await checkDuplicate(projectId, file.name, file.size);
        if (duplicate.isDuplicate) {
          return {
            success: false,
            message: `Duplicate detected: "${duplicate.existingDocName}" already exists`,
          };
        }

        // Upload to storage
        const fileName = `${projectId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("project-files")
          .getPublicUrl(fileName);

        // Insert document record
        const { data: docData, error: dbError } = await supabase
          .from("project_documents")
          .insert({
            project_id: projectId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            document_type: documentType,
            file_size: file.size,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        return {
          success: true,
          message: "Document uploaded successfully",
          projectId,
          documentId: docData.id,
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Upload failed",
        };
      }
    },
    [checkDuplicate]
  );

  // Reset state
  const resetAnalysis = useCallback(() => {
    setMatchResult(null);
    setDuplicateResult(null);
    setIsAnalyzing(false);
  }, []);

  return {
    isAnalyzing,
    matchResult,
    duplicateResult,
    analyzeFile,
    uploadDocument,
    resetAnalysis,
    findProjectMatch,
  };
}
