/**
 * EditorAtelier — Nouveau layout d'édition à 3 colonnes (Direction A1 du design).
 *
 * Structure :
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │  Topbar 48px  : Logo · Breadcrumb étapes · Actions          │
 *   ├──────────────┬─────────────────────────┬────────────────────┤
 *   │              │                         │                    │
 *   │  Édition     │  Aperçu (héros)         │  Design            │
 *   │  380px       │  flex 1                 │  320px             │
 *   │              │  CV + score badge       │  Template · Accent │
 *   │              │  Bottom rail tâches     │  Typo · Texture    │
 *   │              │                         │                    │
 *   └──────────────┴─────────────────────────┴────────────────────┘
 *
 * Réutilise tous les hooks/libs existants pour ne pas dupliquer la logique.
 * MVP : édition identité + accroche + sélection template + sauvegarder + télécharger.
 * Les autres sections (expériences, formation…) sont accessibles via le breadcrumb.
 */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PALETTES,
  saveEditorState, loadEditorState,
} from '@/lib/cvData';
import { TEMPLATES, renderCVFromData } from '@/lib/cvTemplates';
import {
  saveHistory, updateHistory, getHistorySync,
} from '@/lib/historySync';
import { uploadMedia } from '@/lib/mediaUpload';
import { loadScript, loadCSS } from '@/lib/editorHelpers.js';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useRole } from '@/hooks/useRole';
import { usePlan } from '@/hooks/usePlan';
import { useEditorLayout } from '@/hooks/useEditorLayout';
import { injectWatermark, shouldWatermark } from '@/lib/watermark';
import { track } from '@/lib/monitoring';
import CVFeedbackPanel from '@/components/CVFeedbackPanel.jsx';

// ─── Tokens visuels du design ──────────────────────────────────────────────
const TOK = {
  ink:        '#0B1B33',
  inkSoft:    '#4A5B78',
  mute:       '#8390A6',
  blue:       '#1539B7',
  blueSoft:   '#EEF2FF',
  blueRing:   'rgba(21,57,183,.14)',
  line:       '#E6EAF1',
  line2:      '#EFF2F7',
  paper:      '#FFFFFF',
  wash:       '#F6F7FB',
  wash2:      '#F1F3F8',
  shellBg:    '#F4F6FA',
  canvasBg:   '#ECEEF4',
  green:      '#15A36B',
  greenSoft:  '#E6F5EE',
  amber:      '#E8A500',
  amberSoft:  '#FBF3DE',
  violet:     '#6E5BD9',
  rose:       '#D9536B',
  shadowSm:   '0 1px 0 rgba(11,27,51,.04), 0 1px 2px rgba(11,27,51,.04)',
  shadowMd:   '0 1px 0 rgba(11,27,51,.04), 0 6px 18px -6px rgba(11,27,51,.10)',
  shadowLg:   '0 1px 0 rgba(11,27,51,.04), 0 24px 48px -24px rgba(11,27,51,.18)',
};

const FONT = "'Manrope', 'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";

// ─── Étapes du breadcrumb (mappées sur les sections du CV) ─────────────────
const STEPS = [
  { id: 'identite',    label: 'Identité',       short: 'Identité' },
  { id: 'experiences', label: 'Expériences',    short: 'Exp.' },
  { id: 'formations',  label: 'Formation',      short: 'Form.' },
  { id: 'competences', label: 'Compétences',    short: 'Comp.' },
  { id: 'langues',     label: 'Langues',        short: 'Langues' },
  { id: 'interets',    label: "Centres d'intérêt", short: 'Intérêts' },
];

// ─── Tâches "À faire ensuite" calculées depuis cvData ──────────────────────
function computeTasks(cvData) {
  if (!cvData) return [];
  const tasks = [];
  const expCount = (cvData.experiences || []).length;
  if (expCount < 2) {
    tasks.push({ label: 'Ajoute une 2ème expérience', pts: 5, time: '≈ 8 min' });
  }
  if (!cvData.linkedin) {
    tasks.push({ label: 'Renseigne ton URL LinkedIn', pts: 2, time: '≈ 30 s' });
  }
  if (!cvData.dateNaissance) {
    tasks.push({ label: 'Ajoute ta date de naissance', pts: 1, time: '≈ 15 s' });
  }
  if ((cvData.competences?.techniques || []).length < 5) {
    tasks.push({ label: 'Atteins 5 compétences techniques', pts: 3, time: '≈ 2 min' });
  }
  if (!cvData.accroche || cvData.accroche.length < 100) {
    tasks.push({ label: 'Étoffe ton accroche (100+ caractères)', pts: 4, time: '≈ 3 min' });
  }
  return tasks;
}

// ─── Score CV simple (basé sur complétude) ─────────────────────────────────
function computeScore(cvData) {
  if (!cvData) return 0;
  let score = 0;
  const max = 14;
  if (cvData.prenom) score++;
  if (cvData.nom) score++;
  if (cvData.email) score++;
  if (cvData.telephone) score++;
  if (cvData.adresse) score++;
  if (cvData.dateNaissance) score++;
  if (cvData.linkedin) score++;
  if (cvData.accroche?.length >= 100) score++;
  if ((cvData.experiences || []).length >= 1) score++;
  if ((cvData.experiences || []).length >= 2) score++;
  if ((cvData.formations || []).length >= 1) score++;
  if ((cvData.competences?.techniques || []).length >= 5) score++;
  if ((cvData.competences?.comportementales || []).length >= 3) score++;
  if ((cvData.langues || []).length >= 2) score++;
  return Math.round((score / max) * 100);
}

// ─── Complétude d'une étape (= toutes les cases essentielles remplies) ──────
function isStepComplete(stepId, d) {
  if (!d) return false;
  switch (stepId) {
    case 'identite':
      return !!(d.prenom && d.nom && d.email && d.telephone && d.poste && (d.accroche || '').trim());
    case 'experiences':
      return (d.experiences || []).some(e => e && e.poste && e.entreprise);
    case 'formations':
      return (d.formations || []).some(f => f && (f.titre || f.isTalia));
    case 'competences':
      return ((d.competences?.techniques || []).filter(Boolean).length > 0)
        || ((d.competences?.comportementales || []).filter(Boolean).length > 0);
    case 'langues':
      return (d.langues || []).some(l => l && (typeof l === 'string' ? l.trim() : l.langue));
    case 'interets':
      return (d.centresInteret || []).filter(Boolean).length > 0;
    default:
      return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//                                COMPOSANT
// ═══════════════════════════════════════════════════════════════════════════
export default function EditorAtelier() {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const { user } = useAuth();
  const { isStaff } = useRole();
  const { tier } = usePlan();
  const { setLayout } = useEditorLayout();

  // ── State principal ───────────────────────────────────────────────────────
  const [cvData, setCvData]         = useState(null);
  const [edFields, setEdFields]     = useState(null);   // édition live
  const [selectedPal, setSelectedPal] = useState(PALETTES[0]);
  const [templateId, setTemplateId] = useState('classic');
  const [croppedPhoto, setCroppedPhoto] = useState('');
  const [logoDataURL, setLogoDataURL] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [currentStep, setCurrentStep] = useState('identite');
  const [currentHistId, setCurrentHistId] = useState(null);
  const [isDirty, setIsDirty]       = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [zoom, setZoom]             = useState(0.82);
  const [dlLoading, setDlLoading]   = useState(false);
  const [generatedHTML, setGeneratedHTML] = useState('');
  const [noCVState, setNoCVState]   = useState(false);
  const [toastMsg, setToastMsg]     = useState(null);

  const iframeRef = useRef(null);

  // Toast helper
  const showToast = useCallback((msg, type = 'success', dur = 3000) => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), dur);
  }, []);

  // ── Helper : injecter photo & logo dans le HTML ──────────────────────────
  const injectMedia = useCallback((html, photo, logo) => {
    if (!photo && !logo) return html;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      if (photo) {
        const el = doc.querySelector('.block-photo');
        if (el) el.innerHTML = `<div class="block-photo-inner"><img src="${photo}" style="width:100%;height:auto;object-fit:cover;display:block;" /></div>`;
      }
      if (logo) {
        const el = doc.querySelector('.logo-zone');
        if (el) el.innerHTML = `<img src="${logo}" style="max-width:80%;max-height:40px;object-fit:contain;display:block;margin:auto;" />`;
      }
      return '<!DOCTYPE html>' + doc.documentElement.outerHTML;
    } catch {
      return html;
    }
  }, []);

  // ── Chargement initial du CV ─────────────────────────────────────────────
  useEffect(() => {
    let s = null;
    if (routeId) {
      const hist = getHistorySync();
      const entry = hist.find(h => String(h.id) === String(routeId));
      if (entry) {
        // Récupérer photo/logo depuis URL OU base64 embedded
        let recoveredPhoto = entry.photoUrl || '';
        let recoveredLogo  = entry.logoUrl  || '';
        if (entry.html) {
          try {
            const parser = new DOMParser();
            const dom    = parser.parseFromString(entry.html, 'text/html');
            if (!recoveredPhoto) {
              const photoImg = dom.querySelector('.block-photo img');
              if (photoImg?.src) recoveredPhoto = photoImg.src;
            }
            if (!recoveredLogo) {
              const logoImg = dom.querySelector('.logo-zone img');
              if (logoImg?.src) recoveredLogo = logoImg.src;
            }
          } catch {/* ignore */}
        }
        s = {
          generatedHTML: entry.html,
          cvData:        entry.data,
          palette:       PALETTES[0],
          croppedPhoto:  recoveredPhoto,
          logoDataURL:   recoveredLogo,
          name:          entry.name,
          templateId:    entry.data?.templateId || 'classic',
        };
        setCurrentHistId(entry.id);
      }
    }
    if (!s) s = loadEditorState();
    if (!s) { setNoCVState(true); return; }

    setCvData(s.cvData || null);
    setEdFields(s.cvData ? JSON.parse(JSON.stringify(s.cvData)) : null);
    setSelectedPal(s.palette ? (PALETTES.find(p => p.id === s.palette.id) || s.palette) : PALETTES[0]);
    setCroppedPhoto(s.croppedPhoto || '');
    setLogoDataURL(s.logoDataURL || '');
    setCandidateName(s.name || '');
    setTemplateId(s.templateId || 'classic');
  }, [routeId]);

  // ── Rendu HTML quand edFields ou template change ─────────────────────────
  // Utilise srcDoc plutôt que doc.write (plus fiable, pas de race condition)
  useEffect(() => {
    if (!edFields) return;
    try {
      const html = renderCVFromData(edFields, selectedPal, undefined, templateId);
      const withMedia = injectMedia(html, croppedPhoto, logoDataURL);
      setGeneratedHTML(withMedia);
    } catch (err) {
      console.error('[EditorAtelier] render error:', err);
    }
  }, [edFields, selectedPal, templateId, croppedPhoto, logoDataURL, injectMedia]);

  // ── Marquer dirty au moindre changement ──────────────────────────────────
  const updateField = useCallback((key, value) => {
    setEdFields(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!edFields) return;
    const html = generatedHTML;
    const name = candidateName || [edFields.prenom, edFields.nom].filter(Boolean).join(' ') || 'CV';

    const [photoUrl, logoUrl] = await Promise.all([
      croppedPhoto ? uploadMedia(croppedPhoto, 'photo', currentHistId || Date.now()) : Promise.resolve(null),
      logoDataURL  ? uploadMedia(logoDataURL,  'logo',  currentHistId || Date.now()) : Promise.resolve(null),
    ]);

    if (currentHistId) {
      await updateHistory(currentHistId, {
        html, data: edFields, name,
        ...(photoUrl && { photoUrl }),
        ...(logoUrl  && { logoUrl  }),
      });
    } else {
      const newId = await saveHistory(name, html, edFields, edFields?.formation || '', {
        photoUrl: photoUrl || null,
        logoUrl:  logoUrl  || null,
      });
      setCurrentHistId(newId);
      window.history.replaceState(null, '', '/editor/' + newId);
    }

    saveEditorState({
      generatedHTML: html, cvData: edFields, palette: selectedPal,
      croppedPhoto, logoDataURL, name, templateId,
    });
    setCvData(edFields);
    setIsDirty(false);
    setLastSavedAt(Date.now());
    showToast('CV sauvegardé ✓', 'success');
    track('cv_saved', { layout: 'atelier' });
  }, [edFields, generatedHTML, candidateName, croppedPhoto, logoDataURL, currentHistId, selectedPal, templateId, showToast]);

  // Ctrl+S
  useEffect(() => {
    const h = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [handleSave]);

  // ── Téléchargement PDF (avec fallback client-side) ───────────────────────
  const handleDownloadPDF = useCallback(async () => {
    if (!generatedHTML) return;
    setDlLoading(true);
    try {
      const name     = candidateName || 'Talia';
      const filename = `CV_${name}.pdf`;
      const applyWm  = shouldWatermark({ tier, isStaff });
      const html     = injectWatermark(generatedHTML, applyWm);

      // 1. API Vercel/Puppeteer
      let downloaded = false;
      try {
        const res = await fetch('/api/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html, filename }),
        });
        if (res.ok) {
          const blob = await res.blob();
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href = url; a.download = filename;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
          downloaded = true;
        }
      } catch {/* fallback */}

      // 2. Fallback client-side
      if (!downloaded) {
        const { renderPdfFromIframe } = await import('@/lib/pdfClient');
        await renderPdfFromIframe(iframeRef.current, filename);
      }
      track('cv_exported', { format: 'pdf', layout: 'atelier' });
      showToast('PDF téléchargé ✓', 'success');
    } catch (err) {
      showToast('Erreur PDF : ' + err.message, 'error');
    } finally {
      setDlLoading(false);
    }
  }, [generatedHTML, candidateName, tier, isStaff, showToast]);

  // ── Upload photo + recadrage (CropperJS) ───────────────────────────────────
  const photoInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const cropperRef = useRef(null);
  const cropImgRef = useRef(null);
  const [photoMode, setPhotoMode] = useState(false);
  const [photoDraft, setPhotoDraft] = useState('');

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setPhotoDraft(ev.target.result); setPhotoMode(true); };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  // Initialise Cropper quand le mode recadrage s'ouvre
  useEffect(() => {
    if (!photoMode || !photoDraft || !cropImgRef.current) return;
    loadCSS('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.css');
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.2/cropper.min.js').then(() => {
      if (cropperRef.current) { cropperRef.current.destroy(); cropperRef.current = null; }
      if (!window.Cropper || !cropImgRef.current) return;
      cropImgRef.current.src = photoDraft;
      cropperRef.current = new window.Cropper(cropImgRef.current, {
        aspectRatio: 1, viewMode: 1, autoCropArea: 0.9, guides: true, movable: true, zoomable: true,
      });
    });
    return () => { if (cropperRef.current) { cropperRef.current.destroy(); cropperRef.current = null; } };
  }, [photoMode, photoDraft]);

  const confirmCrop = useCallback(() => {
    if (!cropperRef.current) return;
    const canvas = cropperRef.current.getCroppedCanvas({ width: 600, height: 600 });
    setCroppedPhoto(canvas.toDataURL('image/jpeg', 0.98));
    setIsDirty(true);
    setPhotoMode(false); setPhotoDraft('');
    showToast('Photo mise à jour ✓', 'success');
  }, [showToast]);

  const cancelCrop = useCallback(() => { setPhotoMode(false); setPhotoDraft(''); }, []);

  // ── Upload logo ─────────────────────────────────────────────────────────────
  const handleLogoChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setLogoDataURL(ev.target.result); setIsDirty(true); showToast('Logo mis à jour ✓', 'success'); };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [showToast]);

  // ── Empty state ───────────────────────────────────────────────────────────
  if (noCVState) {
    return (
      <div style={{
        minHeight: '100vh', background: TOK.shellBg, display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: FONT,
      }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: TOK.ink, margin: '0 0 8px' }}>Aucun CV en cours d'édition</h1>
          <p style={{ fontSize: 14, color: TOK.inkSoft, lineHeight: 1.5, marginBottom: 20 }}>
            Génère un nouveau CV ou choisis-en un dans ton historique.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => navigate('/generate')} style={btnPrimary}>+ Nouveau CV</button>
            <button onClick={() => navigate('/')} style={btnGhost}>← Accueil</button>
          </div>
        </div>
      </div>
    );
  }

  const tasks = computeTasks(edFields);
  const score = computeScore(edFields);
  const tasksPts = tasks.reduce((s, t) => s + t.pts, 0);

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      width: '100%', minHeight: '100vh', background: TOK.shellBg,
      fontFamily: FONT, color: TOK.ink,
      display: 'grid', gridTemplateRows: '48px auto 1fr',
    }}>
      <style>{`@keyframes stepIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {/* ──────────────────────── TOPBAR ──────────────────────── */}
      <Topbar
        candidateName={candidateName}
        isDirty={isDirty}
        lastSavedAt={lastSavedAt}
        onSave={handleSave}
        onDownload={handleDownloadPDF}
        dlLoading={dlLoading}
        onSwitchClassic={() => setLayout('classique')}
        onHome={() => navigate('/')}
        onHistory={() => navigate('/history')}
      />

      {/* ──────────────── FIL DES ÉTAPES (sous la topbar) ──────────────── */}
      <StepsBar currentStep={currentStep} onStepChange={setCurrentStep} fields={edFields} />

      {/* ──────────────────────── BODY (3 colonnes) ──────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '380px 1fr 320px',
        minHeight: 0, overflow: 'hidden',
      }}>
        {/* ── COLONNE GAUCHE : ÉDITION ── */}
        <EditPanel
          step={currentStep}
          fields={edFields}
          onUpdate={updateField}
          onCropPhoto={() => photoInputRef.current?.click()}
          onPickLogo={() => logoInputRef.current?.click()}
          photo={croppedPhoto}
          logo={logoDataURL}
          onNextStep={() => {
            const idx = STEPS.findIndex(s => s.id === currentStep);
            if (idx < STEPS.length - 1) setCurrentStep(STEPS[idx + 1].id);
          }}
          onPrevStep={() => {
            const idx = STEPS.findIndex(s => s.id === currentStep);
            if (idx > 0) setCurrentStep(STEPS[idx - 1].id);
          }}
        />

        {/* ── COLONNE CENTRE : APERÇU ── */}
        <CenterPreview
          iframeRef={iframeRef}
          html={generatedHTML}
          zoom={zoom}
          onZoomIn={() => setZoom(z => Math.min(1.5, +(z + 0.05).toFixed(2)))}
          onZoomOut={() => setZoom(z => Math.max(0.4, +(z - 0.05).toFixed(2)))}
          onZoomFit={() => setZoom(0.82)}
          score={score}
          tasks={tasks}
          tasksPts={tasksPts}
        />

        {/* ── COLONNE DROITE : DESIGN ── */}
        <DesignPanel
          templateId={templateId}
          onTemplateChange={(id) => { setTemplateId(id); setIsDirty(true); }}
          palette={selectedPal}
          onPaletteChange={(pal) => { setSelectedPal(pal); setIsDirty(true); }}
          canUsePremiumTemplate={!!(isStaff || tier !== 'free')}
          cvData={edFields}
        />
      </div>

      {/* Inputs fichiers cachés (photo + logo) */}
      <input
        ref={photoInputRef} type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={handlePhotoChange}
      />
      <input
        ref={logoInputRef} type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={handleLogoChange}
      />

      {/* Modale de recadrage de la photo */}
      {photoMode && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.45)', backdropFilter: 'blur(3px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: 480, maxWidth: '94vw', boxShadow: '0 40px 100px rgba(11,16,32,.28)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: TOK.ink }}>Recadrer la photo</span>
              <button onClick={cancelCrop} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: TOK.mute }}>×</button>
            </div>
            <div style={{ maxHeight: 380, overflow: 'hidden', borderRadius: 10, background: TOK.wash }}>
              <img ref={cropImgRef} style={{ display: 'block', maxWidth: '100%' }} alt="recadrage" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={cancelCrop} style={{ ...btnGhost }}>Annuler</button>
              <button onClick={confirmCrop} style={{ ...btnPrimary }}>Valider</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toastMsg.type === 'error' ? '#FEE2E2' : TOK.greenSoft,
          color: toastMsg.type === 'error' ? '#991B1B' : '#0E6E48',
          border: `1px solid ${toastMsg.type === 'error' ? '#FCA5A5' : '#86EFAC'}`,
          padding: '12px 18px', borderRadius: 12,
          fontSize: 13, fontWeight: 600,
          boxShadow: TOK.shadowMd,
          fontFamily: FONT,
        }}>
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//                               TOPBAR
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
//                       FIL DES ÉTAPES (sous la topbar)
// ═══════════════════════════════════════════════════════════════════════════
function StepsBar({ currentStep, onStepChange, fields }) {
  // « Validé » = toutes les cases essentielles de l'étape sont remplies (pas la simple navigation)
  const completeById = Object.fromEntries(STEPS.map(s => [s.id, isStepComplete(s.id, fields)]));
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2,
      background: '#fff', borderBottom: `1px solid ${TOK.line}`,
      padding: '9px 14px', overflowX: 'auto',
    }}>
      {STEPS.map((s, i) => {
        const active = currentStep === s.id;
        const done = completeById[s.id];
        const prevDone = i > 0 && completeById[STEPS[i - 1].id];
        // badge : vert ✓ si rempli ; sinon bleu si actif ; sinon neutre
        const badgeBg = done ? TOK.green : active ? TOK.blue : 'transparent';
        const badgeColor = (done || active) ? '#fff' : TOK.mute;
        return (
          <React.Fragment key={s.id}>
            {i > 0 && <span style={{ width: 14, height: 2, borderRadius: 2, background: prevDone ? TOK.green : TOK.line, flexShrink: 0 }} />}
            <button
              onClick={() => onStepChange(s.id)}
              title={done ? 'Étape complète' : 'À compléter'}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 13px', borderRadius: 99,
                background: active ? TOK.blueSoft : 'transparent',
                border: active ? `1px solid ${TOK.blue}33` : '1px solid transparent',
                cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12.5, color: active ? TOK.blue : done ? TOK.ink : TOK.inkSoft,
                fontWeight: (active || done) ? 700 : 500,
                whiteSpace: 'nowrap', transition: 'all .15s',
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: 99,
                display: 'grid', placeItems: 'center',
                background: badgeBg, color: badgeColor,
                border: (done || active) ? 'none' : `1px solid ${TOK.line}`,
                fontSize: 10, fontWeight: 700,
              }}>{done ? '✓' : i + 1}</span>
              {s.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Topbar({
  candidateName,
  isDirty, lastSavedAt,
  onSave, onDownload, dlLoading,
  onSwitchClassic, onHome, onHistory,
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
      background: '#fff',
      borderBottom: `1px solid ${TOK.line}`,
      padding: '0 14px 0 18px',
      gap: 18,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <button onClick={onHome} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: TOK.blue, color: '#fff',
            display: 'grid', placeItems: 'center',
            fontWeight: 700, fontSize: 12, letterSpacing: -0.2,
          }}>A</div>
          <div style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: -0.2, color: TOK.ink }}>
            Altio <span style={{ color: TOK.blue, fontWeight: 700 }}>CV</span>
          </div>
        </button>
        {candidateName && (
          <>
            <div style={{ width: 1, height: 18, background: TOK.line }} />
            <div style={{ fontSize: 12.5, color: TOK.inkSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {candidateName}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 8,
          background: isDirty ? '#FEF3C7' : TOK.greenSoft,
          color: isDirty ? '#92400E' : '#0E6E48',
          fontSize: 11.5, fontWeight: 600,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 99,
            background: isDirty ? TOK.amber : TOK.green,
          }} />
          {isDirty
            ? 'Modifications non enregistrées'
            : lastSavedAt
              ? `Enregistré · ${new Date(lastSavedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Tout est enregistré'}
        </div>
        <button onClick={onSave} style={btnGhost} title="Sauvegarder (Ctrl+S)">Sauvegarder</button>
        <button onClick={onHistory} style={btnGhost}>Historique</button>
        <button
          onClick={onDownload}
          disabled={dlLoading}
          style={{ ...btnPrimary, opacity: dlLoading ? 0.7 : 1, cursor: dlLoading ? 'wait' : 'pointer' }}
        >
          {dlLoading ? 'Génération…' : 'Télécharger'}
        </button>
        <button onClick={onSwitchClassic} style={{ ...btnGhost, fontSize: 11 }} title="Revenir à l'ancien éditeur">
          Mode classique
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//                            COLONNE ÉDITION
// ═══════════════════════════════════════════════════════════════════════════
function EditPanel({ step, fields, onUpdate, onCropPhoto, onPickLogo, photo, logo, onNextStep, onPrevStep }) {
  if (!fields) {
    return (
      <div style={{ borderRight: `1px solid ${TOK.line}`, background: '#fff', padding: 20 }}>
        <div style={{ color: TOK.mute, fontSize: 13 }}>Aucune donnée chargée</div>
      </div>
    );
  }

  const stepIdx = STEPS.findIndex(s => s.id === step);
  const stepCfg = STEPS[stepIdx];

  return (
    <div style={{
      borderRight: `1px solid ${TOK.line}`,
      background: '#fff',
      display: 'grid',
      gridTemplateRows: 'auto 1fr auto',
      minHeight: 0,
      overflow: 'hidden',
    }}>
      {/* En-tête */}
      <div style={{ padding: '18px 22px 14px', borderBottom: `1px solid ${TOK.line2}`, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 18, bottom: 14, width: 3, borderRadius: 99, background: TOK.blue }} />
        <div style={{
          fontSize: 10.5, letterSpacing: 0.8, color: TOK.blue,
          textTransform: 'uppercase', fontWeight: 700,
        }}>Étape {stepIdx + 1} / {STEPS.length}</div>
        <h2 style={{ margin: '4px 0 0', fontSize: 22, letterSpacing: -0.4, fontWeight: 700, color: TOK.ink }}>
          {stepCfg.label}
        </h2>
        {/* mini barre de progression des étapes */}
        <div style={{ marginTop: 12, height: 4, borderRadius: 99, background: TOK.line2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((stepIdx + 1) / STEPS.length) * 100}%`, background: TOK.blue, borderRadius: 99, transition: 'width .3s ease' }} />
        </div>
      </div>

      {/* Contenu scrollable (réanimé à chaque étape) */}
      <div key={step} style={{ padding: '16px 22px 18px', overflowY: 'auto', animation: 'stepIn .28s ease both' }}>
        {step === 'identite' && (
          <IdentiteStep fields={fields} onUpdate={onUpdate} onCropPhoto={onCropPhoto} onPickLogo={onPickLogo} photo={photo} logo={logo} />
        )}
        {step === 'experiences' && (
          <ExperiencesStep fields={fields} onUpdate={onUpdate} />
        )}
        {step === 'formations' && (
          <FormationsStep fields={fields} onUpdate={onUpdate} />
        )}
        {step === 'competences' && (
          <CompetencesStep fields={fields} onUpdate={onUpdate} />
        )}
        {step === 'langues' && (
          <LanguesStep fields={fields} onUpdate={onUpdate} />
        )}
        {step === 'interets' && (
          <InteretsStep fields={fields} onUpdate={onUpdate} />
        )}
      </div>

      {/* Footer nav */}
      <div style={{
        padding: '14px 22px',
        borderTop: `1px dashed ${TOK.line}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: TOK.wash,
      }}>
        <button
          onClick={onPrevStep}
          disabled={stepIdx === 0}
          style={{ ...btnGhost, opacity: stepIdx === 0 ? 0.4 : 1, cursor: stepIdx === 0 ? 'default' : 'pointer' }}
        >← Précédent</button>
        <span style={{ fontSize: 11, color: TOK.mute, fontFamily: MONO }}>
          {stepIdx + 1} / {STEPS.length}
        </span>
        <button
          onClick={onNextStep}
          disabled={stepIdx === STEPS.length - 1}
          style={{ ...btnPrimary, opacity: stepIdx === STEPS.length - 1 ? 0.4 : 1 }}
        >Suivant →</button>
      </div>
    </div>
  );
}

// ─── Étape Identité ────────────────────────────────────────────────────────
function IdentiteStep({ fields, onUpdate, onCropPhoto, onPickLogo, photo, logo }) {
  return (
    <>
      {/* Médias : photo (avec recadrage) + logo — placés en premier */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
        <MediaUploader
          label="Photo de profil" preview={photo} round
          onClick={onCropPhoto}
          cta={photo ? 'Changer / recadrer' : '📷 Ajouter une photo'}
        />
        <MediaUploader
          label="Logo établissement" preview={logo}
          onClick={onPickLogo}
          cta={logo ? 'Changer le logo' : '🏢 Ajouter un logo'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 10px' }}>
        <Field label="Prénom" value={fields.prenom} onChange={v => onUpdate('prenom', v)} />
        <Field label="Nom" value={fields.nom} onChange={v => onUpdate('nom', v)} />
        <Field label="Date de naissance" value={fields.dateNaissance} onChange={v => onUpdate('dateNaissance', v)} placeholder="JJ/MM/AAAA" />
        <Field label="Ville · Adresse" value={fields.adresse} onChange={v => onUpdate('adresse', v)} />
        <Field label="Email" value={fields.email} onChange={v => onUpdate('email', v)} fullWidth type="email" />
        <Field label="Téléphone" value={fields.telephone} onChange={v => onUpdate('telephone', v)} />
        <Field label="LinkedIn" value={fields.linkedin} onChange={v => onUpdate('linkedin', v)} />
      </div>

      {/* Poste visé */}
      <div style={{ marginTop: 18 }}>
        <Field label="Poste visé" value={fields.poste} onChange={v => onUpdate('poste', v.toUpperCase())} fullWidth />
      </div>

      {/* Accroche */}
      <div style={{ marginTop: 18 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', marginBottom: 6,
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: TOK.ink }}>Accroche professionnelle</div>
          <div style={{ fontSize: 11, color: TOK.mute, fontFamily: MONO }}>
            {(fields.accroche || '').length} / 400
          </div>
        </div>
        <textarea
          value={fields.accroche || ''}
          onChange={e => onUpdate('accroche', e.target.value.slice(0, 400))}
          rows={5}
          style={{
            width: '100%',
            border: `1px solid ${TOK.line}`, borderRadius: 10,
            padding: '12px 13px', fontSize: 13, lineHeight: 1.55,
            color: TOK.ink, background: '#fff',
            fontFamily: 'inherit', resize: 'vertical', outline: 'none',
            transition: 'border-color .15s, box-shadow .15s',
          }}
          onFocus={e => {
            e.target.style.borderColor = TOK.blue;
            e.target.style.boxShadow = `0 0 0 3px ${TOK.blueRing}`;
          }}
          onBlur={e => {
            e.target.style.borderColor = TOK.line;
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
    </>
  );
}

// ─── Bloc d'upload média (photo / logo) avec aperçu ────────────────────────
function MediaUploader({ label, preview, onClick, cta, round }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: TOK.ink, marginBottom: 6 }}>{label}</div>
      <button
        onClick={onClick}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', border: `1px dashed ${TOK.line}`, borderRadius: 10,
          background: TOK.wash, color: TOK.inkSoft, fontSize: 12.5,
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, textAlign: 'left',
        }}
      >
        <span style={{
          width: 38, height: 38, flexShrink: 0,
          borderRadius: round ? '50%' : 8,
          border: `1px solid ${TOK.line}`, background: '#fff',
          display: 'grid', placeItems: 'center', overflow: 'hidden',
          fontSize: 16,
        }}>
          {preview
            ? <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: round ? 'cover' : 'contain' }} />
            : (round ? '📷' : '🏢')}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>{cta}</span>
      </button>
    </div>
  );
}

// ─── Étape Expériences (liste éditable) ────────────────────────────────────
function ExperiencesStep({ fields, onUpdate }) {
  const expList = fields.experiences || [];
  const updateExp = (idx, key, value) => {
    const next = expList.map((e, i) => i === idx ? { ...e, [key]: value } : e);
    onUpdate('experiences', next);
  };
  const addExp = () => {
    onUpdate('experiences', [...expList, { poste: '', entreprise: '', lieu: '', periode: '', missions: [''] }]);
  };
  const removeExp = (idx) => {
    onUpdate('experiences', expList.filter((_, i) => i !== idx));
  };
  return (
    <>
      {expList.map((exp, i) => (
        <div key={i} style={{
          marginBottom: 14, padding: 14,
          border: `1px solid ${TOK.line}`, borderRadius: 12,
          background: TOK.wash,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: TOK.mute, fontFamily: MONO, fontWeight: 600 }}>EXP {i + 1}</span>
            <button onClick={() => removeExp(i)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: TOK.rose, fontSize: 11, fontWeight: 600,
            }}>Supprimer</button>
          </div>
          <Field label="Poste" value={exp.poste} onChange={v => updateExp(i, 'poste', v)} fullWidth />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <Field label="Entreprise" value={exp.entreprise} onChange={v => updateExp(i, 'entreprise', v)} />
            <Field label="Lieu" value={exp.lieu} onChange={v => updateExp(i, 'lieu', v)} />
          </div>
          <div style={{ marginTop: 10 }}>
            <Field label="Période" value={exp.periode} onChange={v => updateExp(i, 'periode', v)} fullWidth placeholder="Janv. 2024 — Août 2024" />
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: TOK.inkSoft, fontWeight: 500, marginBottom: 5 }}>Missions (une par ligne)</div>
            <textarea
              value={(exp.missions || []).join('\n')}
              onChange={e => updateExp(i, 'missions', e.target.value.split('\n'))}
              rows={3}
              style={{
                width: '100%', border: `1px solid ${TOK.line}`, borderRadius: 8,
                padding: '8px 10px', fontSize: 12.5, color: TOK.ink,
                fontFamily: 'inherit', resize: 'vertical', outline: 'none',
              }}
            />
          </div>
        </div>
      ))}
      <button onClick={addExp} style={{
        width: '100%', padding: '10px 14px',
        border: `1px dashed ${TOK.line}`, borderRadius: 10,
        background: TOK.wash, color: TOK.inkSoft, fontSize: 12.5,
        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
      }}>+ Ajouter une expérience</button>
    </>
  );
}

// ─── Étape Formations ──────────────────────────────────────────────────────
function FormationsStep({ fields, onUpdate }) {
  const formList = fields.formations || [];
  const updateForm = (idx, key, value) => {
    const next = formList.map((f, i) => i === idx ? { ...f, [key]: value } : f);
    onUpdate('formations', next);
  };
  const addForm = () => {
    onUpdate('formations', [...formList, { titre: '', etablissement: '', periode: '', isTalia: false }]);
  };
  const removeForm = (idx) => {
    onUpdate('formations', formList.filter((_, i) => i !== idx));
  };
  return (
    <>
      {formList.map((f, i) => (
        <div key={i} style={{
          marginBottom: 12, padding: 14,
          border: `1px solid ${f.isTalia ? TOK.amber : TOK.line}`,
          background: f.isTalia ? TOK.amberSoft : TOK.wash,
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: TOK.mute, fontFamily: MONO, fontWeight: 600 }}>
              FORM {i + 1} {f.isTalia && '· Talia'}
            </span>
            <button onClick={() => removeForm(i)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: TOK.rose, fontSize: 11, fontWeight: 600,
            }}>Supprimer</button>
          </div>
          <Field label="Titre du diplôme" value={f.titre} onChange={v => updateForm(i, 'titre', v)} fullWidth />
          <div style={{ marginTop: 10 }}>
            <Field label="Établissement" value={f.etablissement} onChange={v => updateForm(i, 'etablissement', v)} fullWidth />
          </div>
          <div style={{ marginTop: 10 }}>
            <Field label="Période" value={f.periode} onChange={v => updateForm(i, 'periode', v)} fullWidth />
          </div>
        </div>
      ))}
      <button onClick={addForm} style={{
        width: '100%', padding: '10px 14px',
        border: `1px dashed ${TOK.line}`, borderRadius: 10,
        background: TOK.wash, color: TOK.inkSoft, fontSize: 12.5,
        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
      }}>+ Ajouter une formation</button>
    </>
  );
}

// ─── Étape Compétences ─────────────────────────────────────────────────────
function CompetencesStep({ fields, onUpdate }) {
  const comp = fields.competences || { techniques: [], comportementales: [], outils: [] };
  const updateCat = (cat, items) => {
    onUpdate('competences', { ...comp, [cat]: items });
  };
  return (
    <>
      <CompetenceCategory
        title="Techniques"
        hint="Savoir-faire métier"
        items={comp.techniques}
        onChange={items => updateCat('techniques', items)}
      />
      <CompetenceCategory
        title="Comportementales"
        hint="Soft skills"
        items={comp.comportementales}
        onChange={items => updateCat('comportementales', items)}
      />
      <CompetenceCategory
        title="Outils"
        hint="Logiciels, frameworks"
        items={comp.outils}
        onChange={items => updateCat('outils', items)}
      />
    </>
  );
}

function CompetenceCategory({ title, hint, items, onChange }) {
  const text = (items || []).join(', ');
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: TOK.ink }}>{title}</div>
        <div style={{ fontSize: 10.5, color: TOK.mute }}>{hint} · {(items || []).length}</div>
      </div>
      <textarea
        value={text}
        onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
        placeholder="Sépare par des virgules…"
        rows={2}
        style={{
          width: '100%', border: `1px solid ${TOK.line}`, borderRadius: 8,
          padding: '8px 10px', fontSize: 12.5, color: TOK.ink,
          fontFamily: 'inherit', resize: 'vertical', outline: 'none',
        }}
      />
    </div>
  );
}

// ─── Étape Langues ─────────────────────────────────────────────────────────
function LanguesStep({ fields, onUpdate }) {
  const list = fields.langues || [];
  const update = (idx, key, val) => {
    onUpdate('langues', list.map((l, i) => i === idx ? { ...l, [key]: val } : l));
  };
  const add = () => onUpdate('langues', [...list, { langue: '', niveau: '' }]);
  const remove = (idx) => onUpdate('langues', list.filter((_, i) => i !== idx));
  return (
    <>
      {list.map((l, i) => (
        <div key={i} style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr auto',
          gap: 8, marginBottom: 8, alignItems: 'center',
        }}>
          <input
            value={l.langue || ''}
            onChange={e => update(i, 'langue', e.target.value)}
            placeholder="Langue"
            style={inputStyle}
          />
          <input
            value={l.niveau || ''}
            onChange={e => update(i, 'niveau', e.target.value)}
            placeholder="Niveau (A1-C2, Natif…)"
            style={inputStyle}
          />
          <button onClick={() => remove(i)} style={{
            border: 'none', background: 'none', cursor: 'pointer',
            color: TOK.rose, fontSize: 16, padding: 4,
          }}>×</button>
        </div>
      ))}
      <button onClick={add} style={{
        width: '100%', padding: '10px 14px',
        border: `1px dashed ${TOK.line}`, borderRadius: 10,
        background: TOK.wash, color: TOK.inkSoft, fontSize: 12.5,
        cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
      }}>+ Ajouter une langue</button>
    </>
  );
}

// ─── Étape Centres d'intérêt ───────────────────────────────────────────────
function InteretsStep({ fields, onUpdate }) {
  const text = (fields.centresInteret || []).join(', ');
  return (
    <>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: TOK.ink, marginBottom: 6 }}>
        Centres d'intérêt
      </div>
      <div style={{ fontSize: 11, color: TOK.mute, marginBottom: 8 }}>
        Sépare-les par des virgules. Évite les clichés (lecture, voyage, sport) → privilégie le concret (semi-marathon 2024, podcasts éco…).
      </div>
      <textarea
        value={text}
        onChange={e => onUpdate('centresInteret', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
        rows={4}
        style={{
          width: '100%', border: `1px solid ${TOK.line}`, borderRadius: 8,
          padding: '10px 12px', fontSize: 13, color: TOK.ink,
          fontFamily: 'inherit', resize: 'vertical', outline: 'none',
        }}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//                            COLONNE CENTRE (APERÇU)
// ═══════════════════════════════════════════════════════════════════════════
function CenterPreview({ iframeRef, html, zoom, onZoomIn, onZoomOut, onZoomFit, score, tasks, tasksPts }) {
  return (
    <div style={{
      background: TOK.canvasBg,
      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(11,27,51,.07) 1px, transparent 0)',
      backgroundSize: '20px 20px',
      display: 'grid', gridTemplateRows: 'auto 1fr auto',
      minHeight: 0, position: 'relative',
    }}>
      {/* Mini toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11.5, color: TOK.inkSoft, fontWeight: 500 }}>Aperçu en direct</span>
          <span style={{ fontSize: 11, color: TOK.mute }}>·</span>
          <span style={{ fontSize: 11.5, color: TOK.mute, fontFamily: MONO }}>A4 · page 1/1</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#fff', border: `1px solid ${TOK.line}`, padding: 3, borderRadius: 8,
        }}>
          <button onClick={onZoomOut} style={zoomBtn}>−</button>
          <span style={{ fontSize: 11.5, fontWeight: 600, padding: '0 6px', fontFamily: MONO }}>
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={onZoomIn} style={zoomBtn}>+</button>
          <span style={{ width: 1, height: 14, background: TOK.line }} />
          <button onClick={onZoomFit} style={{ ...zoomBtn, padding: '0 8px' }}>Ajuster</button>
        </div>
      </div>

      {/* Page CV */}
      <div style={{
        display: 'grid', placeItems: 'start center',
        overflow: 'auto', padding: '0 24px 24px',
        position: 'relative',
      }}>
        <div style={{
          width: 794 * zoom, height: 1122 * zoom,
          position: 'relative', flexShrink: 0,
          boxShadow: '0 1px 0 rgba(11,27,51,.04), 0 24px 60px -24px rgba(11,27,51,.25)',
          borderRadius: 4, overflow: 'hidden',
        }}>
          <iframe
            ref={iframeRef}
            title="CV preview"
            srcDoc={html}
            style={{
              width: 794, height: 1122, border: 'none',
              transformOrigin: 'top left',
              transform: `scale(${zoom})`,
              background: '#fff',
            }}
          />
          {/* Badge score en surimpression */}
          <ScoreBadge score={score} />
        </div>
      </div>

      {/* Bottom rail : tâches */}
      <div style={{ padding: '14px 24px 18px' }}>
        <div style={{
          background: '#fff', borderRadius: 12, border: `1px solid ${TOK.line}`,
          boxShadow: TOK.shadowSm, padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 14, overflow: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: tasks.length ? TOK.amberSoft : TOK.greenSoft,
              color: tasks.length ? TOK.amber : TOK.green,
              display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13,
            }}>{tasks.length ? '!' : '✓'}</div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: TOK.ink }}>
                À faire ensuite — {tasks.length} item{tasks.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 10.5, color: TOK.mute }}>
                {tasks.length ? `+${tasksPts} pts pour atteindre 100 %` : 'Tu as tout complété 🎉'}
              </div>
            </div>
          </div>
          {tasks.length > 0 && <div style={{ width: 1, height: 28, background: TOK.line }} />}
          {tasks.slice(0, 3).map((t, i) => (
            <TaskChip key={i} pts={t.pts} label={t.label} time={t.time} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreBadge({ score }) {
  const c = score >= 80 ? TOK.green : score >= 50 ? TOK.amber : TOK.rose;
  const label = score >= 90 ? 'parfait' : score >= 70 ? 'solide' : score >= 50 ? 'à compléter' : 'incomplet';
  return (
    <div style={{
      position: 'absolute', top: 14, right: 14, zIndex: 1,
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(6px)',
      border: `1px solid ${TOK.line}`, borderRadius: 99,
      padding: '4px 10px 4px 4px', fontSize: 11,
      boxShadow: TOK.shadowSm,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 99,
        background: `conic-gradient(${c} 0% ${score}%, ${TOK.line2} ${score}% 100%)`,
        display: 'grid', placeItems: 'center',
      }}>
        <div style={{
          width: 16, height: 16, borderRadius: 99, background: '#fff',
          display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 700,
          fontFamily: MONO,
        }}>{score}</div>
      </div>
      <span style={{ fontWeight: 600 }}>CV Score</span>
      <span style={{ color: c, fontWeight: 600 }}>· {label}</span>
    </div>
  );
}

function TaskChip({ pts, label, time }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <span style={{
        fontSize: 10.5, fontWeight: 700, color: TOK.green,
        background: TOK.greenSoft, padding: '2px 6px', borderRadius: 99,
        fontFamily: MONO,
      }}>+{pts}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: TOK.ink }}>{label}</div>
        <div style={{ fontSize: 10.5, color: TOK.mute, fontFamily: MONO }}>{time}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//                            COLONNE DROITE (DESIGN)
// ═══════════════════════════════════════════════════════════════════════════
function DesignPanel({ templateId, onTemplateChange, palette, onPaletteChange, canUsePremiumTemplate, cvData }) {
  const templates = [
    { id: 'classic',  name: 'Classique',  bg: '#0e2a44',  premium: false },
    { id: 'minimal',  name: 'Minimaliste',bg: '#1B3A2D',  premium: false },
    { id: 'compact',  name: 'Colonne',    bg: '#E8DFCD',  premium: true  },
    { id: 'impact',   name: 'Impact',     bg: '#7C3AED',  premium: true  },
  ];

  return (
    <div style={{
      borderLeft: `1px solid ${TOK.line}`,
      background: '#fff',
      display: 'grid', gridTemplateRows: 'auto 1fr',
      minHeight: 0,
    }}>
      <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${TOK.line2}` }}>
        <div style={{
          fontSize: 10.5, letterSpacing: 0.8, color: TOK.mute,
          textTransform: 'uppercase', fontWeight: 600,
        }}>Design</div>
        <h2 style={{ margin: '4px 0 0', fontSize: 18, letterSpacing: -0.3, fontWeight: 700, color: TOK.ink }}>
          Mise en forme
        </h2>
      </div>

      <div style={{
        padding: '14px 18px 18px', overflowY: 'auto',
        display: 'grid', gap: 18, alignContent: 'start',
      }}>
        {/* Avis recruteur IA — driver d'upgrade (action 'coach', verrouillé Free) */}
        <CVFeedbackPanel cvData={cvData} />

        {/* Templates */}
        <DesignBlock title="Template">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {templates.map(t => {
              const locked = t.premium && !canUsePremiumTemplate;
              const active = templateId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => !locked && onTemplateChange(t.id)}
                  disabled={locked}
                  style={{
                    border: active ? `1.5px solid ${TOK.ink}` : `1px solid ${TOK.line}`,
                    borderRadius: 8, padding: 4, cursor: locked ? 'not-allowed' : 'pointer',
                    boxShadow: active ? `0 0 0 3px rgba(11,27,51,.08)` : 'none',
                    background: '#fff', fontFamily: 'inherit',
                    opacity: locked ? 0.55 : 1,
                    position: 'relative',
                  }}
                >
                  <div style={{
                    background: t.bg, height: 56, borderRadius: 4,
                    display: 'grid', gridTemplateColumns: '40% 1fr',
                  }}>
                    <div style={{ background: 'rgba(255,255,255,.1)' }} />
                  </div>
                  <div style={{
                    fontSize: 10.5, fontWeight: 500, padding: '4px 2px 1px',
                    display: 'flex', justifyContent: 'space-between',
                  }}>
                    {t.name}
                    {active && <span style={{ color: TOK.green }}>●</span>}
                    {locked && <span style={{
                      fontSize: 9, fontWeight: 700,
                      background: TOK.amberSoft, color: TOK.amber,
                      padding: '1px 5px', borderRadius: 99,
                    }}>PRO</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </DesignBlock>

        {/* Palette de couleurs */}
        <DesignBlock title="Palette">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PALETTES.map(p => {
              const active = palette.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onPaletteChange(p)}
                  style={{
                    border: active ? `1.5px solid ${TOK.ink}` : `1px solid ${TOK.line}`,
                    borderRadius: 8, padding: 4, cursor: 'pointer',
                    boxShadow: active ? '0 0 0 3px rgba(11,27,51,.08)' : 'none',
                    background: '#fff', fontFamily: 'inherit',
                  }}
                  title={p.name || p.id}
                >
                  <div style={{
                    height: 32, borderRadius: 4,
                    background: p.c, position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0, width: '35%',
                      background: p.d || p.c,
                    }} />
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{
            marginTop: 8, fontSize: 11, color: TOK.mute, fontFamily: MONO,
            textAlign: 'right',
          }}>
            {palette.c}
          </div>
        </DesignBlock>

        {/* Info qualité */}
        <DesignBlock title="Astuce">
          <div style={{
            background: TOK.wash, border: `1px solid ${TOK.line}`,
            borderRadius: 10, padding: '10px 12px',
            fontSize: 11.5, color: TOK.inkSoft, lineHeight: 1.5,
          }}>
            Le template <strong style={{ color: TOK.ink }}>Impact</strong> est idéal pour les profils commerciaux et marketing — il met les chiffres en évidence.
          </div>
        </DesignBlock>
      </div>
    </div>
  );
}

function DesignBlock({ title, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11.5, fontWeight: 600, color: TOK.ink,
        marginBottom: 9,
      }}>{title}</div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//                            HELPERS UI (champs & styles)
// ═══════════════════════════════════════════════════════════════════════════
function Field({ label, value, onChange, placeholder, type = 'text', fullWidth }) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
      <div style={{
        fontSize: 11, color: TOK.inkSoft, fontWeight: 500, marginBottom: 4,
      }}>{label}</div>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={e => { e.target.style.borderColor = TOK.blue; e.target.style.boxShadow = `0 0 0 3px ${TOK.blueRing}`; }}
        onBlur={e => { e.target.style.borderColor = TOK.line; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

const inputStyle = {
  width: '100%',
  border: `1px solid ${TOK.line}`, borderRadius: 8,
  padding: '9px 11px', fontSize: 13,
  color: TOK.ink, background: '#fff',
  fontFamily: 'inherit', outline: 'none',
  transition: 'border-color .15s, box-shadow .15s',
};

const btnGhost = {
  border: `1px solid ${TOK.line}`, background: '#fff', color: TOK.ink,
  padding: '6px 11px', borderRadius: 8, fontSize: 12.5, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
};
const btnPrimary = {
  border: 'none', background: TOK.blue, color: '#fff',
  padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
  boxShadow: '0 6px 16px -6px rgba(21,57,183,.5)',
};
const zoomBtn = {
  border: 'none', background: 'transparent', color: TOK.ink,
  padding: '4px 8px', fontSize: 13, cursor: 'pointer', borderRadius: 5,
  fontFamily: 'inherit', fontWeight: 500,
};
