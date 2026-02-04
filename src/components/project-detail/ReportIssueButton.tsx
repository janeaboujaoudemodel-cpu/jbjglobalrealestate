import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACT_INFO } from "@/constants/stats";

interface ReportIssueButtonProps {
  projectName: string;
  projectSlug?: string;
  className?: string;
}

export default function ReportIssueButton({ 
  projectName, 
  projectSlug,
  className = "" 
}: ReportIssueButtonProps) {
  const handleReport = () => {
    const subject = encodeURIComponent(`Data Issue Report: ${projectName}`);
    const body = encodeURIComponent(
      `Hello JBJ Global Real Estate,\n\n` +
      `I noticed incorrect information on the listing for "${projectName}".\n\n` +
      `Issue details:\n` +
      `[Please describe what information is incorrect]\n\n` +
      `Correct information:\n` +
      `[Please provide the correct details]\n\n` +
      `Page URL: ${window.location.href}\n\n` +
      `Thank you for your attention to this matter.`
    );
    
    window.open(
      `mailto:${CONTACT_INFO.email}?subject=${subject}&body=${body}`,
      '_blank'
    );
  };

  return (
    <button
      onClick={handleReport}
      className={`flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors text-sm ${className}`}
    >
      <AlertCircle className="w-4 h-4" />
      <span>Notice something incorrect? Report an issue</span>
    </button>
  );
}
