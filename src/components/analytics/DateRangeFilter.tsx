/**
 * DATE RANGE FILTER
 * Preset ranges + a robust custom range editor with explicit From / To
 * popovers featuring Day / Month / Year navigation.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

export type PresetRange = 'today' | 'yesterday' | '7days' | '14days' | '30days' | '90days' | 'thisMonth' | 'lastMonth' | 'custom';

interface DateRangeFilterProps {
  onRangeChange: (range: { start: Date; end: Date }) => void;
  className?: string;
}

const CURRENT_YEAR = new Date().getFullYear();

export function DateRangeFilter({ onRangeChange, className }: DateRangeFilterProps) {
  const [preset, setPreset] = useState<PresetRange>('7days');
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const getPresetRange = (presetValue: PresetRange): { start: Date; end: Date } | null => {
    const now = new Date();
    switch (presetValue) {
      case 'today': return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday': return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case '7days': return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case '14days': return { start: startOfDay(subDays(now, 14)), end: endOfDay(now) };
      case '30days': return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case '90days': return { start: startOfDay(subDays(now, 90)), end: endOfDay(now) };
      case 'thisMonth': return { start: startOfMonth(now), end: endOfDay(now) };
      case 'lastMonth': {
        const lm = subMonths(now, 1);
        return { start: startOfMonth(lm), end: endOfMonth(lm) };
      }
      default: return null;
    }
  };

  const handlePresetChange = (value: PresetRange) => {
    setPreset(value);
    if (value !== 'custom') {
      const r = getPresetRange(value);
      if (r) onRangeChange(r);
    }
  };

  const apply = () => {
    if (!from || !to) return;
    if (to < from) return;
    onRangeChange({ start: startOfDay(from), end: endOfDay(to) });
  };

  const invalid = !!(from && to && to < from);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Select value={preset} onValueChange={(v) => handlePresetChange(v as PresetRange)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="7days">Last 7 Days</SelectItem>
          <SelectItem value="14days">Last 14 Days</SelectItem>
          <SelectItem value="30days">Last 30 Days</SelectItem>
          <SelectItem value="90days">Last 90 Days</SelectItem>
          <SelectItem value="thisMonth">This Month</SelectItem>
          <SelectItem value="lastMonth">Last Month</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-2">
          {/* FROM */}
          <Popover open={fromOpen} onOpenChange={setFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal whitespace-nowrap',
                  !from && 'text-[#1A1A1A]/60',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {from ? `From: ${format(from, 'dd MMM yyyy')}` : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
              <Calendar
                mode="single"
                selected={from}
                onSelect={(d) => { setFrom(d ?? undefined); setFromOpen(false); }}
                captionLayout="dropdown-buttons"
                fromYear={2015}
                toYear={CURRENT_YEAR + 1}
                disabled={{ after: new Date() }}
                defaultMonth={from ?? new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* TO */}
          <Popover open={toOpen} onOpenChange={setToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal whitespace-nowrap',
                  !to && 'text-[#1A1A1A]/60',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {to ? `To: ${format(to, 'dd MMM yyyy')}` : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
              <Calendar
                mode="single"
                selected={to}
                onSelect={(d) => { setTo(d ?? undefined); setToOpen(false); }}
                captionLayout="dropdown-buttons"
                fromYear={2015}
                toYear={CURRENT_YEAR + 1}
                disabled={{ after: new Date(), before: from }}
                defaultMonth={to ?? from ?? new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="gold"
            onClick={apply}
            disabled={!from || !to || invalid}
          >
            Apply
          </Button>

          {invalid && (
            <span className="text-xs text-red-700">End date must be after start date.</span>
          )}
        </div>
      )}
    </div>
  );
}

export default DateRangeFilter;
