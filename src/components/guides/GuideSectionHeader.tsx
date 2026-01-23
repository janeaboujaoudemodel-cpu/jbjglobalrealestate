import { LucideIcon } from "lucide-react";

interface GuideSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  centered?: boolean;
}

/**
 * Standardized section header for all Guides and Market Intelligence pages.
 * Matches the approved "Market Context & Government Planning" style:
 * - Active champagne icon box (jj-icon-box-active) with black icon
 * - Split-color title: first word gold, rest black
 * - Consistent sizing: icon box w-12 h-12, title text-2xl md:text-3xl
 */
export const GuideSectionHeader = ({ 
  icon: Icon, 
  title,
  centered = false 
}: GuideSectionHeaderProps) => {
  const words = title.split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');

  return (
    <div className={`flex items-center gap-4 mb-8 ${centered ? 'justify-center' : ''}`}>
      <div className="jj-icon-box-active w-12 h-12 rounded-xl flex-shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold">
        <span className="text-gold">{firstWord}</span>
        {restWords && <span className="text-black ml-2">{restWords}</span>}
      </h2>
    </div>
  );
};

export default GuideSectionHeader;
