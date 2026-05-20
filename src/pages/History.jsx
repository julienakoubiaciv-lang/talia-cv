import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import TopBar from '@/components/TopBar';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function History() {
  const navigate = useNavigate();
  const [cvList, setCvList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.GeneratedCV.list().then((data) => {
      setCvList(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <div className="max-w-[800px] mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-display font-bold text-primary">Historique des CV</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{cvList.length} CV généré{cvList.length > 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau CV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : cvList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary">
              <FileText className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">Aucun CV généré</p>
              <p className="text-sm text-muted-foreground mt-1">Commencez par créer votre premier CV Talia.</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Créer un CV
            </button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-0 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2.5 border-b border-border bg-muted/30">
              <span>Candidat</span>
              <span>Formation</span>
              <span>Date</span>
              <span></span>
            </div>
            {cvList.map((cv, i) => (
              <div
                key={cv.id}
                className={`grid grid-cols-[1fr_1fr_1fr_auto] gap-0 items-center px-4 py-3 hover:bg-secondary/40 transition-colors ${
                  i < cvList.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{cv.candidate_name || 'Candidat'}</p>
                  {cv.poste && <p className="text-xs text-muted-foreground truncate">{cv.poste}</p>}
                </div>
                <p className="text-xs text-muted-foreground truncate pr-4">{cv.formation || '—'}</p>
                <p className="text-xs text-muted-foreground">{formatDate(cv.created_at)}</p>
                <button
                  onClick={() => navigate(`/editor/${cv.id}`)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 px-2 py-1.5 rounded-md hover:bg-primary/10 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Voir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
