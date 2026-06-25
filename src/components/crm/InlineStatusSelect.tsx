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
        className="border border-[#B89555]/40 shadow-2xl max-h-96 rounded-xl p-1.5 z-[200] min-w-[200px]"
        style={{ backgroundColor: '#FDFBF7', color: '#1A1A1A' }}
        onClick={(e) => e.stopPropagation()}
      >
        {(['positive','neutral','negative'] as const).map((cat) => {
          const headerColor = cat === 'positive' ? '#064E3B' : cat === 'negative' ? '#7F1D1D' : '#1A1A1A';
          const headerDotColor = cat === 'positive' ? '#064E3B' : cat === 'negative' ? '#7F1D1D' : '#B89555';
          const label = cat[0].toUpperCase() + cat.slice(1);
          const items = PIPELINE_STATUSES.filter(s => s.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div
                className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide mt-1 flex items-center gap-2"
                style={{ color: headerColor }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: headerDotColor }} />
                {label}
              </div>
              {items.map(status => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                  className="pl-3 pr-3 py-1.5 focus:bg-[#B89555]/15 hover:bg-[#B89555]/15 cursor-pointer rounded-md [&>span:first-child]:hidden"
                  style={{ color: '#1A1A1A' }}
                >
                  <span
                    className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide"
                    style={{ color: '#1A1A1A' }}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: status.dotColor }}
                    />
                    <span style={{ color: '#1A1A1A' }}>{status.label}</span>
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
