import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Shield, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceWord {
  word_pattern: string;
  category: string;
  severity: string;
  description: string;
}

interface ComplianceResult {
  isCompliant: boolean;
  violations: Array<{
    word: string;
    category: string;
    severity: string;
  }>;
  highestSeverity: "none" | "warning" | "violation" | "critical";
}

interface MessageComplianceCheckerProps {
  message: string;
  onComplianceChange?: (result: ComplianceResult) => void;
  showInline?: boolean;
}

export function MessageComplianceChecker({ 
  message, 
  onComplianceChange,
  showInline = true 
}: MessageComplianceCheckerProps) {
  const [complianceWords, setComplianceWords] = useState<ComplianceWord[]>([]);
  const [result, setResult] = useState<ComplianceResult>({
    isCompliant: true,
    violations: [],
    highestSeverity: "none"
  });

  useEffect(() => {
    fetchComplianceWords();
  }, []);

  const fetchComplianceWords = async () => {
    const { data, error } = await supabase
      .from("jbj_compliance_words")
      .select("word_pattern, category, severity, description")
      .eq("is_active", true);

    if (data && !error) {
      setComplianceWords(data);
    }
  };

  const checkCompliance = useCallback((text: string): ComplianceResult => {
    if (!text.trim() || complianceWords.length === 0) {
      return { isCompliant: true, violations: [], highestSeverity: "none" };
    }

    const lowerText = text.toLowerCase();
    const violations: ComplianceResult["violations"] = [];
    let highestSeverity: ComplianceResult["highestSeverity"] = "none";

    const severityPriority = { none: 0, warning: 1, violation: 2, critical: 3 };

    for (const word of complianceWords) {
      if (lowerText.includes(word.word_pattern.toLowerCase())) {
        violations.push({
          word: word.word_pattern,
          category: word.category,
          severity: word.severity
        });

        const currentPriority = severityPriority[highestSeverity];
        const newPriority = severityPriority[word.severity as keyof typeof severityPriority] || 0;
        
        if (newPriority > currentPriority) {
          highestSeverity = word.severity as ComplianceResult["highestSeverity"];
        }
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      highestSeverity
    };
  }, [complianceWords]);

  useEffect(() => {
    const newResult = checkCompliance(message);
    setResult(newResult);
    onComplianceChange?.(newResult);
  }, [message, checkCompliance, onComplianceChange]);

  if (!showInline || !message.trim()) {
    return null;
  }

  if (result.isCompliant) {
    return (
      <div className="flex items-center gap-1.5 text-green-600 text-xs">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Message compliant</span>
      </div>
    );
  }

  const severityConfig = {
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      textColor: "text-amber-800",
      iconColor: "text-amber-600"
    },
    violation: {
      icon: Shield,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-800",
      iconColor: "text-orange-600"
    },
    critical: {
      icon: XCircle,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      iconColor: "text-red-600"
    }
  };

  const config = severityConfig[result.highestSeverity as keyof typeof severityConfig] || severityConfig.warning;
  const Icon = config.icon;

  return (
    <div className={cn(
      "p-3 rounded-lg border",
      config.bgColor,
      config.borderColor
    )}>
      <div className="flex items-start gap-2">
        <Icon className={cn("w-4 h-4 mt-0.5", config.iconColor)} />
        <div className="flex-1">
          <p className={cn("font-medium text-sm", config.textColor)}>
            {result.highestSeverity === "critical" 
              ? "Message blocked - Policy violation" 
              : result.highestSeverity === "violation"
              ? "Message flagged - Review required"
              : "Warning - Please review"
            }
          </p>
          <ul className={cn("text-xs mt-1 space-y-0.5", config.textColor)}>
            {result.violations.map((v, i) => (
              <li key={i} className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-current" />
                <span>
                  "{v.word}" - {v.category.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
          {result.highestSeverity === "critical" && (
            <p className="text-xs mt-2 font-medium">
              This message cannot be sent. Please rephrase to comply with company policy.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for use in other components
export function useMessageCompliance() {
  const [complianceWords, setComplianceWords] = useState<ComplianceWord[]>([]);

  useEffect(() => {
    const fetchWords = async () => {
      const { data } = await supabase
        .from("jbj_compliance_words")
        .select("word_pattern, category, severity, description")
        .eq("is_active", true);
      if (data) setComplianceWords(data);
    };
    fetchWords();
  }, []);

  const checkMessage = useCallback((text: string): ComplianceResult => {
    if (!text.trim() || complianceWords.length === 0) {
      return { isCompliant: true, violations: [], highestSeverity: "none" };
    }

    const lowerText = text.toLowerCase();
    const violations: ComplianceResult["violations"] = [];
    let highestSeverity: ComplianceResult["highestSeverity"] = "none";
    const severityPriority = { none: 0, warning: 1, violation: 2, critical: 3 };

    for (const word of complianceWords) {
      if (lowerText.includes(word.word_pattern.toLowerCase())) {
        violations.push({
          word: word.word_pattern,
          category: word.category,
          severity: word.severity
        });
        const currentPriority = severityPriority[highestSeverity];
        const newPriority = severityPriority[word.severity as keyof typeof severityPriority] || 0;
        if (newPriority > currentPriority) {
          highestSeverity = word.severity as ComplianceResult["highestSeverity"];
        }
      }
    }

    return { isCompliant: violations.length === 0, violations, highestSeverity };
  }, [complianceWords]);

  return { checkMessage, isLoaded: complianceWords.length > 0 };
}