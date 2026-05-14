import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LeadStatusBadge, { PIPELINE_STATUSES } from "@/components/crm/LeadStatusBadge";

interface InlineStatusSelectProps {
  leadId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function InlineStatusSelect({ 
  leadId, 
  currentStatus, 
  onStatusChange 
}: InlineStatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({ pipeline_stage: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['crm-leads-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['owner-newest-leads'] });
      
      toast.success(`Status updated to ${PIPELINE_STATUSES.find(s => s.value === newStatus)?.label || newStatus}`);
      onStatusChange?.(newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select 
      value={currentStatus} 
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger 
        className="w-auto h-auto p-0 border-0 bg-transparent shadow-none rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#B89555]/40 focus:ring-offset-1 focus:ring-offset-[#FDFBF7] [&>svg]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <LeadStatusBadge status={currentStatus} size="sm" />
      </SelectTrigger>
      <SelectContent 
        position="popper"
        side="bottom"
        align="start"
        sideOffset={6}
        avoidCollisions={false}
        className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 shadow-xl max-h-96 rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {(['positive','neutral','negative'] as const).map((cat) => {
          const headerClass =
            cat === 'positive' ? 'text-emerald-700'
            : cat === 'negative' ? 'text-red-700'
            : 'text-blue-700';
          const headerDot =
            cat === 'positive' ? 'bg-emerald-500'
            : cat === 'negative' ? 'bg-red-500'
            : 'bg-blue-500';
          const label = cat[0].toUpperCase() + cat.slice(1);
          const items = PIPELINE_STATUSES.filter(s => s.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div className={`px-2 py-1.5 text-xs font-bold uppercase tracking-wide mt-1 flex items-center gap-2 ${headerClass}`}>
                <span className={`w-2 h-2 rounded-full ${headerDot}`} />
                {label}
              </div>
              {items.map(status => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                  className="pl-3 pr-3 py-1.5 focus:bg-[#B89555]/10 hover:bg-[#B89555]/10 cursor-pointer rounded-md [&>span:first-child]:hidden"
                >
                  <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#1A1A1A]">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: status.dotColor }}
                    />
                    {status.label}
                  </span>
                </SelectItem>
              ))}
            </div>
          );
        })}
      </SelectContent>
    </Select>
  );
}
