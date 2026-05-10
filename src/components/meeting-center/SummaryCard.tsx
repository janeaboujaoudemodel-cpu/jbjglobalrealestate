import { Video, Phone, Mic, User, Clock, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SummaryItem } from "@/hooks/useMeetingCenterData";

interface SummaryCardProps {
  item: SummaryItem;
}

const SummaryCard = ({ item }: SummaryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTypeConfig = () => {
    switch (item.type) {
      case 'meeting':
        return {
          icon: Video,
          bgColor: 'bg-[#EFE6D6]/20',
          textColor: 'text-[#1A1A1A]-dark',
          borderColor: 'border-[#B89555]/30',
          label: 'Meeting',
        };
      case 'call':
        return {
          icon: Phone,
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-300/50',
          label: 'Call',
        };
      case 'voice-ai':
        return {
          icon: Mic,
          bgColor: 'bg-[#EFE6D6]/20',
          textColor: 'text-[#1A1A1A]-dark',
          borderColor: 'border-[#B89555]/30',
          label: 'Voice AI',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div className={`bg-[#FDFBF7]/90 border-2 ${config.borderColor} hover:border-opacity-60 rounded-xl transition-colors shadow-sm`}>
      {/* Header - always visible */}
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bgColor} ${config.textColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1A1A1A] flex items-center gap-2">
                <User className="w-4 h-4 text-[#1A1A1A]/70" />
                {item.clientName}
              </h3>
              <p className="text-sm text-[#1A1A1A]/70 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(item.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
            {config.label}
          </span>
        </div>

        <p className="text-[#1A1A1A]/70 line-clamp-2">{item.summary}</p>

        {/* Action Items Preview */}
        {item.actionItems.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-[#1A1A1A]/70">
            <ArrowRight className="w-3 h-3" />
            <span>{item.actionItems.length} action item{item.actionItems.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      {(item.actionItems.length > 0 || item.rawData) && (
        <>
          <div className="border-t border-[#B89555]/20">
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[#1A1A1A] bg-[#F7F1E6]/50 hover:bg-[#ECE2D2]/60 hover:text-[#1A1A1A] rounded-none font-medium"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  View Details
                </>
              )}
            </Button>
          </div>

          {isExpanded && (
            <div className="p-4 md:p-6 pt-4 space-y-4 bg-[#FDFBF7]">
              {/* Full Summary */}
              <div>
                <h4 className="text-sm font-medium text-[#1A1A1A]/70 mb-2">Summary</h4>
                <p className="text-[#1A1A1A]">{item.summary}</p>
              </div>

              {/* Action Items */}
              {item.actionItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#1A1A1A]/70 mb-2">Action Items</h4>
                  <ul className="space-y-1">
                    {item.actionItems.map((action, i) => (
                      <li key={i} className="text-sm text-[#1A1A1A]/70 flex items-start gap-2">
                        <ArrowRight className={`w-3 h-3 ${config.textColor} mt-1 flex-shrink-0`} />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Voice AI specific data */}
              {item.type === 'voice-ai' && item.rawData?.duration_seconds && (
                <div>
                  <h4 className="text-sm font-medium text-[#1A1A1A]/70 mb-2">Call Duration</h4>
                  <p className="text-[#1A1A1A]">
                    {Math.floor(Number(item.rawData.duration_seconds) / 60)} min {Number(item.rawData.duration_seconds) % 60} sec
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SummaryCard;
