import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export default function CompetenceTags({ label, tags, selected, onToggle }) {
  return (
    <div>
      <Label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
        {label}
      </Label>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggle(tag)}
              className={cn(
                'text-[11px] px-2 py-1 rounded-md border transition-all leading-tight',
                active
                  ? 'bg-primary text-white border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              )}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
