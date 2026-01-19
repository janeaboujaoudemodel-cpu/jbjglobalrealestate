/**
 * DATE RANGE FILTER
 * Enhanced date range selector with custom date picker
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

export type PresetRange = 'today' | 'yesterday' | '7days' | '14days' | '30days' | '90days' | 'thisMonth' | 'lastMonth' | 'custom';

interface DateRangeFilterProps {
  onRangeChange: (range: { start: Date; end: Date }) => void;
  className?: string;
}

export function DateRangeFilter({ onRangeChange, className }: DateRangeFilterProps) {
  const [preset, setPreset] = useState<PresetRange>('7days');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const getPresetRange = (presetValue: PresetRange): { start: Date; end: Date } => {
    const now = new Date();
    switch (presetValue) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday':
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case '7days':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case '14days':
        return { start: startOfDay(subDays(now, 14)), end: endOfDay(now) };
      case '30days':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case '90days':
        return { start: startOfDay(subDays(now, 90)), end: endOfDay(now) };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfDay(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'custom':
        if (customRange?.from && customRange?.to) {
          return { start: startOfDay(customRange.from), end: endOfDay(customRange.to) };
        }
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      default:
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    }
  };

  const handlePresetChange = (value: PresetRange) => {
    setPreset(value);
    if (value !== 'custom') {
      onRangeChange(getPresetRange(value));
    } else {
      setIsCalendarOpen(true);
    }
  };

  const handleCustomRangeSelect = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      onRangeChange({ start: startOfDay(range.from), end: endOfDay(range.to) });
      setIsCalendarOpen(false);
    }
  };

  const getDisplayText = (): string => {
    if (preset === 'custom' && customRange?.from && customRange?.to) {
      return `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d, yyyy')}`;
    }
    const presetLabels: Record<PresetRange, string> = {
      today: 'Today',
      yesterday: 'Yesterday',
      '7days': 'Last 7 Days',
      '14days': 'Last 14 Days',
      '30days': 'Last 30 Days',
      '90days': 'Last 90 Days',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      custom: 'Custom Range',
    };
    return presetLabels[preset];
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
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
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customRange?.from ? (
                customRange.to ? (
                  <>
                    {format(customRange.from, 'LLL dd')} -{' '}
                    {format(customRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(customRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={customRange?.from}
              selected={customRange}
              onSelect={handleCustomRangeSelect}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export default DateRangeFilter;
