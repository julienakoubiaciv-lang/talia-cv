import React from 'react';

export default function FormCard({ step, title, children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-[11px] font-bold flex-shrink-0">
          {step}
        </div>
        <h2 className="text-sm font-semibold text-foreground tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}
