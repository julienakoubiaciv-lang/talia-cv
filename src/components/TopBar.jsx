import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { History, Plus } from 'lucide-react';

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <div className="max-w-[900px] mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <span className="text-white font-display font-bold text-sm tracking-wider">A</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-primary text-base tracking-wide">ALTIO</span>
            <span className="text-[9px] text-muted-foreground font-medium tracking-widest uppercase">CV Generator</span>
          </div>
        </button>

        <nav className="flex items-center gap-2">
          {!isHome && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-secondary"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouveau CV
            </button>
          )}
          <button
            onClick={() => navigate('/history')}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-1.5 rounded-md ${
              location.pathname === '/history'
                ? 'text-primary bg-secondary'
                : 'text-muted-foreground hover:text-primary hover:bg-secondary'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Historique
          </button>
        </nav>
      </div>
    </header>
  );
}
