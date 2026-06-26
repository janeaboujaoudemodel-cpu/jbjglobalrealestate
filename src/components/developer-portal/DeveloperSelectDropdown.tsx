import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { DeveloperLogo } from '@/components/ui/DeveloperLogo';

interface DeveloperSelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

type LightDev = { id: string; name: string; logo_url: string | null };

export const DeveloperSelectDropdown: React.FC<DeveloperSelectDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Select developer...',
  className = '',
}) => {
  // Lightweight query: only the 3 columns this dropdown needs.
  // Avoids pulling every column from every developer row (which made open
  // feel laggy when the cache had to deserialize a large payload).
  const { data: developers, isLoading } = useQuery({
    queryKey: ['developers-light'],
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('developers')
        .select('id, name, logo_url, is_hidden, rank')
        .or('is_hidden.is.null,is_hidden.eq.false')
        .order('rank', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((d: any): LightDev => ({
        id: d.id,
        name: d.name,
        logo_url: d.logo_url ?? null,
      }));
    },
  });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Deduplicate developers by name (case-insensitive)
  const uniqueDevelopers = useMemo(() => {
    if (!developers) return [] as LightDev[];
    const seen = new Set<string>();
    return developers.filter(d => {
      const key = d.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [developers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return uniqueDevelopers;
    const q = search.toLowerCase();
    return uniqueDevelopers.filter(d => d.name.toLowerCase().includes(q));
  }, [uniqueDevelopers, search]);

  const selectedDev = useMemo(() =>
    uniqueDevelopers.find(d => d.name === value),
    [uniqueDevelopers, value]
  );

  useEffect(() => {
    if (open) {
      // requestAnimationFrame is snappier than setTimeout(100) and still
      // waits for the popover to mount before grabbing focus.
      const id = requestAnimationFrame(() => searchRef.current?.focus());
      return () => cancelAnimationFrame(id);
    } else {
      setSearch('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-3 w-full h-12 px-3 rounded-xl border border-[#B89555]/35 bg-[#FDFBF7] text-left hover:border-[#B89555] transition-colors overflow-hidden ${className}`}
        >
          {selectedDev ? (
            <>
              <DeveloperLogo
                src={selectedDev.logo_url}
                alt={selectedDev.name}
                name={selectedDev.name}
                variant="bare"
                renderFallback
                className="!w-8 !h-8 !min-w-8 !min-h-8 !rounded-md !p-[3px]"
              />
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground whitespace-normal break-words [overflow-wrap:anywhere]">{selectedDev.name}</span>
            </>
          ) : (
            <>
              <DeveloperLogo
                alt={placeholder}
                name={placeholder}
                variant="bare"
                renderFallback
                className="!w-8 !h-8 !min-w-8 !min-h-8 !rounded-md !p-[3px]"
              />
              <span className="min-w-0 flex-1 text-sm leading-snug text-[#1A1A1A]/70 whitespace-normal break-words [overflow-wrap:anywhere]">{placeholder}</span>
            </>
          )}
          <ChevronDown className="w-4 h-4 text-[#064E3B] shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 border border-[#B89555]/35 bg-[#FDFBF7] overflow-hidden shadow-xl"
        align="start"
        sideOffset={4}
      >
        {/* Search */}
        <div className="p-3 border-b border-[#B89555]/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search developers..."
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-[280px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading developers...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No developers found</div>
          ) : (
            filtered.slice(0, 120).map(dev => {
              const isSelected = dev.name === value;
              return (
                <button
                  key={dev.id}
                  type="button"
                  onClick={() => {
                    onChange(dev.name);
                    setOpen(false);
                  }}
                  className={`w-full min-h-12 flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#EFE6D6]/60 overflow-hidden ${
                    isSelected ? 'bg-[#EFE6D6]/50 border-l-2 border-[#B89555]' : 'border-l-2 border-transparent'
                  }`}
                >
                  <DeveloperLogo
                    src={dev.logo_url}
                    alt={dev.name}
                    name={dev.name}
                    variant="bare"
                    renderFallback
                    className="!w-9 !h-9 !min-w-9 !min-h-9 !rounded-md !p-[3px]"
                  />
                  <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground whitespace-normal break-words [overflow-wrap:anywhere]">{dev.name}</span>
                </button>
              );
            })
          )}
          {!isLoading && filtered.length > 120 && (
            <div className="px-4 py-2 text-[11px] text-[#1A1A1A]/55 border-t border-[#B89555]/20">
              Showing first 120 developers — type to narrow instantly.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DeveloperSelectDropdown;
