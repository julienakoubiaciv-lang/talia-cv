import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const OPTIONS = [
  { value: 'M', label: 'M.' },
  { value: 'F', label: 'Mme' },
  { value: '',  label: 'Non précisé' },
];

export default function GenderSelector({ genre, onSelect }) {
  return (
    <div className="mb-3">
      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Genre</Label>
      <div className="flex gap-1.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all border',
              genre === opt.value
                ? 'bg-primary text-white border-primary'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
