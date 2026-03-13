/**
 * InteractiveStampCanvas — simplified pure container for the stamp preview.
 * No fake overlay layers. Visibility is controlled via form toggles.
 */
import React from 'react';

export interface StampLayer {
  id: string;
  type: 'text-top' | 'text-bottom' | 'monogram' | 'logo' | 'divider' | 'reg-number' | 'city-line';
  label: string;
  offsetX: number;
  offsetY: number;
  scale: number;
  locked: boolean;
  visible: boolean;
}

interface InteractiveStampCanvasProps {
  children: React.ReactNode;
  size: number;
  layers?: StampLayer[];
  onLayersChange?: (layers: StampLayer[]) => void;
  onDeleteLayer?: (layerId: string) => void;
  interactive?: boolean;
}

export function InteractiveStampCanvas({
  children,
  size,
}: InteractiveStampCanvasProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}

/** Generate default layers from stamp form state (kept for API compat) */
export function createDefaultLayers(form: {
  languageMode: string;
  iconStyle: string;
  density: number;
  registrationNumber?: string;
  showLicenseNumber?: boolean;
  city?: string;
}): StampLayer[] {
  return [];
}
