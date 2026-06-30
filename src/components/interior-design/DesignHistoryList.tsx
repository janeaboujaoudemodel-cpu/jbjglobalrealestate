import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  ChevronDown, 
  ChevronUp,
  Trash2,
  Eye,
  Calendar,
  Palette
} from 'lucide-react';
import { DesignHistoryItem } from '@/hooks/useInteriorDesignHistory';

interface DesignHistoryListProps {
  history: DesignHistoryItem[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<boolean>;
  onSelect: (item: DesignHistoryItem) => void;
}

const modeLabels: Record<string, { label: string; color: string }> = {
  concept: { label: 'Concept', color: 'bg-fuchsia-500/20 text-fuchsia-300' },
  redesign: { label: 'Redesign', color: 'bg-blue-500/20 text-blue-300' },
  staging: { label: 'Staging', color: 'jj-surface-emerald-soft text-[color:var(--emerald-on)]' },
  chat: { label: 'Chat', color: 'bg-amber-500/20 text-amber-300' },
};

const DesignHistoryList = ({
  history,
  isLoading,
  onDelete,
  onSelect,
}: DesignHistoryListProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-[#FDFBF7]/60 border border-[#1A1A1A] rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-white/90 animate-pulse" />
            <span className="text-white/90">Loading history...</span>
          </div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-[#FDFBF7]/60 border border-[#1A1A1A] rounded-2xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#1A1A1A]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-white/70" />
            <span className="font-medium text-white">Your Design History</span>
            <Badge variant="secondary" className="bg-[#1A1A1A]">
              {history.length}
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/70" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/70" />
          )}
        </button>

        {/* History Items */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="border-t border-[#1A1A1A] max-h-[400px] overflow-y-auto">
                {history.map((item) => {
                  const modeInfo = modeLabels[item.mode] || modeLabels.concept;
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelect(item)}
                      className="p-4 border-b border-[#1A1A1A]/50 hover:bg-[#1A1A1A]/30 cursor-pointer transition-colors flex gap-4"
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#1A1A1A] flex-shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.projectName}
                            className="w-full h-full object-cover"
                           loading="lazy" decoding="async" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Palette className="w-6 h-6 text-[#1A1A1A]/70" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white truncate">
                            {item.projectName || 'Untitled Design'}
                          </h4>
                          <Badge className={modeInfo.color}>
                            {modeInfo.label}
                          </Badge>
                        </div>
                        
                        {item.roomName && (
                          <p className="text-sm text-white/70 truncate">
                            {item.roomName}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-white/90">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.createdAt)}
                          {item.designStyle && (
                            <>
                              <span className="text-[#1A1A1A]/70">•</span>
                              <span className="capitalize">{item.designStyle}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(item);
                          }}
                          className="text-white/70 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleDelete(item.id, e)}
                          disabled={deletingId === item.id}
                          className="text-white/70 hover:text-red-400"
                        >
                          {deletingId === item.id ? (
                            <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DesignHistoryList;
