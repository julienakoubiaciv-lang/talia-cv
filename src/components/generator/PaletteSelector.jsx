import React from 'react';
import { Check } from 'lucide-react';
import { PALETTES } from '@/lib/cvData';

export default function PaletteSelector({ selected, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTES.map((p) => {
        const isSelected = selected?.id === p.id;
        return (
          <button
            key={p.id}
            title={p.name}
            onClick={() => onSelect(p)}
            className="relative flex-shrink-0 group"
          >
            <div
              className={`w-7 h-7 rounded-full transition-all ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-primary scale-110'
                  : 'hover:scale-110 hover:ring-2 hover:ring-offset-1 hover:ring-border'
              }`}
              style={{ backgroundColor: p.primary }}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </div>
              )}
            </div>
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {p.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
