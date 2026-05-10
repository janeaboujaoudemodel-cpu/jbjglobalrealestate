import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Building2, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDevelopers } from '@/hooks/useProjects';
import { SafeImage } from '@/components/SafeImage';

interface DeveloperSelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const DeveloperSelectDropdown: React.FC<DeveloperSelectDropdownProps> = ({
  value,
  onChange,
  placeholder = 'Select developer...',
  className = '',
}) => {
  const { data: developers, isLoading } = useDevelopers(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Deduplicate developers by name (case-insensitive)
  const uniqueDevelopers = useMemo(() => {
    if (!developers) return [];
    const seen = new Set<string>();
    return developers.filter(d => {
      const key = d.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
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
      setTimeout(() => searchRef.current?.focus(), 100);
    } else {
      setSearch('');
    }
  }, [open]);

  const getLogoUrl = (dev: typeof uniqueDevelopers[0]) => {
    // LOCKED: canonical logo_url is the single source of truth.
    return dev.logo_url || null;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-3 w-full h-12 px-4 rounded-xl border-2 border-[#B89555]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] via-[hsl(38,30%,95%)] to-[hsl(36,28%,91%)] text-left hover:border-[#B89555] transition-colors ${className}`}
        >
          {selectedDev ? (
            <>
              <div className="w-7 h-7 rounded-md bg-[#FDFBF7] border border-[#B89555]/20 flex items-center justify-center overflow-hidden shrink-0">
                {getLogoUrl(selectedDev) ? (
                  <SafeImage
                    src={getLogoUrl(selectedDev)!}
                    alt={selectedDev.name}
                    className="w-6 h-6 object-contain"
                  />
                ) : (
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-sm font-medium text-foreground truncate flex-1">{selectedDev.name}</span>
            </>
          ) : (
            <>
              <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground flex-1">{placeholder}</span>
            </>
          )}
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 border-2 border-[#B89555]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] via-[hsl(38,30%,95%)] to-[hsl(36,28%,91%)]"
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
            filtered.map(dev => {
              const logo = getLogoUrl(dev);
              const isSelected = dev.name === value;
              return (
                <button
                  key={dev.id}
                  type="button"
                  onClick={() => {
                    onChange(dev.name);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#EFE6D6]/10 ${
                    isSelected ? 'bg-[#EFE6D6]/15 border-l-2 border-[#B89555]' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-md bg-[#FDFBF7] border border-[#B89555]/20 flex items-center justify-center overflow-hidden shrink-0">
                    {logo ? (
                      <SafeImage
                        src={logo}
                        alt={dev.name}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground truncate">{dev.name}</span>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DeveloperSelectDropdown;
