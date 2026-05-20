import React from 'react';
import { cn } from '@/lib/utils';

export function Button({ className, disabled, children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:pointer-events-none disabled:opacity-50',
        'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
