/**
 * DatePopover — shared controlled date picker.
 *
 * Fixes:
 *  - Controlled `month` state so prev/next arrows always advance correctly
 *    (previous version re-mounted Calendar on width changes, causing the
 *    "stuck on May 2026" bug).
 *  - Fixed 300px panel width so the calendar does not visually resize across
 *    breakpoints.
 *  - Champagne / gold / ink tokens only. No blue selected/today/hover states.
 *  - pointer-events-auto so it remains interactive inside dialogs/sheets.
 *
 * Usage:
 *   <DatePopover value={date} onChange={setDate} placeholder="Pick a date" />
 */
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  placeholder?: string;
  disablePast?: boolean;
  disabled?: (d: Date) => boolean;
  clearable?: boolean;
  className?: string;
  align?: "start" | "center" | "end";
}

export function DatePopover({
  value,
  onChange,
  placeholder = "Pick a date",
  disablePast,
  disabled,
  clearable = true,
  className,
  align = "start",
}: Props) {
  const [open, setOpen] = useState(false);
  // Controlled month — start at value, today, or today on first open
  const [month, setMonth] = useState<Date>(value ?? new Date());

  // Keep month in sync when external value changes
  useEffect(() => {
    if (value) setMonth(value);
  }, [value]);

  const isDisabled = (d: Date) => {
    if (disablePast && d < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    if (disabled) return disabled(d);
    return false;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9 min-w-0",
            "bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]",
            "hover:bg-[#F7F2EA] hover:border-[#B89555]/50",
            "focus-visible:ring-2 focus-visible:ring-[#B89555]/40 focus-visible:ring-offset-0",
            !value && "text-[#1A1A1A]/50",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[#1A1A1A]/60 shrink-0" />
          <span className="truncate flex-1">
            {value ? format(value, "PPP") : placeholder}
          </span>
          {value && clearable && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear date"
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(undefined); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(undefined); } }}
              className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-[#EFE6D6] shrink-0"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-[300px] p-0 bg-[#FDFBF7] border-[#B89555]/30 shadow-lg crm-scope"
        sideOffset={4}
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={(d) => { onChange(d); if (d) setOpen(false); }}
          month={month}
          onMonthChange={setMonth}
          disabled={isDisabled}
          initialFocus
          className="p-3 pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePopover;
