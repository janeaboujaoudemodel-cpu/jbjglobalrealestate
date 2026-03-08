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
          bgColor: 'bg-violet-500/20',
          textColor: 'text-violet-400',
          borderColor: 'border-violet-500/30',
          label: 'Meeting',
        };
      case 'call':
        return {
          icon: Phone,
          bgColor: 'bg-orange-500/20',
          textColor: 'text-orange-400',
          borderColor: 'border-orange-500/30',
          label: 'Call',
        };
      case 'voice-ai':
        return {
          icon: Mic,
          bgColor: 'bg-gold/20',
          textColor: 'text-gold',
          borderColor: 'border-gold/30',
          label: 'Voice AI',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div className={`bg-zinc-900/80 border ${config.borderColor} hover:border-opacity-60 rounded-xl transition-colors`}>
      {/* Header - always visible */}
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.bgColor} ${config.textColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-400" />
                {item.clientName}
              </h3>
              <p className="text-sm text-zinc-400 flex items-center gap-1">
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

        <p className="text-zinc-200 line-clamp-2">{item.summary}</p>

        {/* Action Items Preview */}
        {item.actionItems.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
            <ArrowRight className="w-3 h-3" />
            <span>{item.actionItems.length} action item{item.actionItems.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      {(item.actionItems.length > 0 || item.rawData) && (
        <>
          <div className="border-t border-zinc-700">
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-white bg-zinc-800/80 hover:bg-zinc-700 hover:text-white rounded-none font-medium"
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
            <div className="p-4 md:p-6 pt-4 space-y-4 bg-zinc-800/50">
              {/* Full Summary */}
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Summary</h4>
                <p className="text-zinc-200">{item.summary}</p>
              </div>

              {/* Action Items */}
              {item.actionItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">Action Items</h4>
                  <ul className="space-y-1">
                    {item.actionItems.map((action, i) => (
                      <li key={i} className="text-sm text-zinc-200 flex items-start gap-2">
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
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">Call Duration</h4>
                  <p className="text-zinc-200">
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
