import React, { useState, useEffect } from 'react';
import { Search, Building2, MapPin, DollarSign, Calendar, ImageIcon, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePropertyPicker } from '../hooks/usePropertyPicker';
import { formatPriceShort } from '@/lib/formatPrice';
import type { PropertySnapshot } from '../types';

interface PropertyPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (propertyId: string, snapshot: PropertySnapshot) => void;
  selectedPropertyId?: string | null;
}

export function PropertyPicker({ isOpen, onClose, onSelect, selectedPropertyId }: PropertyPickerProps) {
  const {
    properties,
    isLoading,
    searchTerm,
    setSearchTerm,
    searchProperties,
    createPropertySnapshot,
  } = usePropertyPicker();

  useEffect(() => {
    if (isOpen) {
      searchProperties('');
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchProperties();
  };

  const handleSelect = (property: any) => {
    const snapshot = createPropertySnapshot(property);
    onSelect(property.id, snapshot);
    onClose();
  };

  // Use the shared formatter so prices render identically across the app.
  const formatPrice = (price: number | null | undefined) =>
    price ? formatPriceShort(price) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-[#1A1A1A] border-[#B89555]/30">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1A1A1A]" />
            Select Property
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/70" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, developer, or area..."
              className="pl-10 bg-[#1A1A1A] border-[#1A1A1A] text-white"
            />
          </div>
          <Button type="submit" className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
            Search
          </Button>
        </form>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#1A1A1A] animate-spin" />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20 text-[#1A1A1A]/70">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No properties found. Try a different search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => handleSelect(property)}
                  className={`flex gap-4 p-4 rounded-xl border transition-all text-left ${
                    selectedPropertyId === property.id
                      ? 'bg-[#EFE6D6]/10 border-[#B89555]'
                      : 'bg-[#1A1A1A]/50 border-[#1A1A1A] hover:border-[#B89555]/50'
                  }`}
                >
                  <div className="w-24 h-24 rounded-lg bg-[#1A1A1A] flex-shrink-0 overflow-hidden">
                    {property.cover_image_url ? (
                      <img
                        src={property.cover_image_url}
                        alt={property.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-[#1A1A1A]/70" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-white truncate">{property.name}</h3>
                      {selectedPropertyId === property.id && (
                        <Check className="w-5 h-5 text-[#1A1A1A] flex-shrink-0" />
                      )}
                    </div>

                    {property.developer_name && (
                      <p data-developer-name className="text-sm text-[#1A1A1A] whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">by {property.developer_name}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-[#1A1A1A]/70">
                      {property.area_name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.area_name}
                        </span>
                      )}
                      {property.price_from && (
                        <span className="flex items-center gap-1 text-price-orange font-semibold">
                          <DollarSign className="w-3 h-3" />
                          {formatPrice(property.price_from)}
                        </span>
                      )}
                      {property.expected_completion && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {property.expected_completion}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
