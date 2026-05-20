import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

const SelectContext = React.createContext(null);

export function Select({ value, onValueChange, disabled, children }) {
  const [open, setOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, disabled }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children }) {
  const { open, setOpen, disabled } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => !disabled && setOpen(o => !o)}
      disabled={disabled}
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm',
        'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        open && 'ring-2 ring-primary',
        className
      )}
    >
      {children}
      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
    </button>
  );
}

export function SelectValue({ placeholder }) {
  const { value } = React.useContext(SelectContext);
  return <span className={cn(!value && 'text-muted-foreground')}>{value || placeholder}</span>;
}

export function SelectContent({ children }) {
  const { open, setOpen } = React.useContext(SelectContext);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg py-1 max-h-56 overflow-y-auto"
    >
      {children}
    </div>
  );
}

export function SelectItem({ value: itemValue, className, children }) {
  const { value, onValueChange, setOpen } = React.useContext(SelectContext);
  const selected = value === itemValue;
  return (
    <div
      className={cn(
        'flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-secondary text-sm',
        selected && 'bg-secondary font-medium',
        className
      )}
      onClick={() => { onValueChange(itemValue); setOpen(false); }}
    >
      {children}
      {selected && <Check className="h-3.5 w-3.5 text-primary" />}
    </div>
  );
}
