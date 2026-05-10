/**
 * ToolSuiteHeader - Standardized header component for all suite pages
 * Provides consistent, readable back button styling on dark backgrounds
 */

import { Link } from "react-router-dom";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ToolSuiteHeaderProps {
  /** Title of the suite */
  title: string;
  /** Highlighted word in title (shown in gold) */
  titleHighlight?: string;
  /** Subtitle/description */
  subtitle: string;
  /** Icon component to display */
  icon: LucideIcon;
  /** Back link URL (default: /toolkit) */
  backHref?: string;
  /** Back link text (default: "Back to Toolkit") */
  backText?: string;
}

export function ToolSuiteHeader({
  title,
  titleHighlight,
  subtitle,
  icon: Icon,
  backHref = "/ai-hub",
  backText = "Back to Royal Tools Hub",
}: ToolSuiteHeaderProps) {
  // Split title if titleHighlight is provided
  const titleParts = titleHighlight 
    ? title.split(titleHighlight)
    : [title];

  return (
    <div className="border-b border-[#B89555]/20 bg-gradient-to-r from-black via-zinc-900/50 to-black">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-4">
          <Link to={backHref}>
            {/* Using inline styles to bypass any class sanitization */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-[#1A1A1A] border border-[#1A1A1A] hover:border-[#1A1A1A]"
              style={{ 
                color: '#a1a1aa', // zinc-400
                backgroundColor: 'transparent'
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" style={{ color: '#a1a1aa' }} />
              <span style={{ color: '#a1a1aa' }}>{backText}</span>
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-[#B89555]/40 flex items-center justify-center">
            <Icon className="w-7 h-7 text-[#1A1A1A]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {titleHighlight ? (
                <>
                  {titleParts[0]}
                  <span className="text-[#1A1A1A]">{titleHighlight}</span>
                  {titleParts[1] || ''}
                </>
              ) : (
                title
              )}
            </h1>
            <p className="text-white/70 text-sm">{subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ToolSuiteHeader;
