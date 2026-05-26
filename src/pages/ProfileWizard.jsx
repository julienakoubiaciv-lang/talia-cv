import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  saveProfile, updateProfile, getProfile,
  MOT_CHIPS, EMOJI_CHOICES, INTERDITS_SUGGESTIONS,
} from '@/lib/profileData';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const C = {
  blue:    '#1539B7',
  blueHov: '#1F4FE0',
  blueSoft:'#EEF2FF',
  ink:     '#0B1020',
  ink2:    '#3A4156',
  mute:    '#9AA0AE',
  rule:    '#ECEDF1',
  surface: '#F7F8FA',
  bg:      '#FFFFFF',
};
const FONT = "'Manrope', system-ui, sans-serif";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: 'Personnalité', icon: '🧠' },
  { id: 2, label: 'Trajectoire',  icon: '🗺️'  },
  { id: 3, label: 'Poste visé',   icon: '🎯' },
  { id: 4, label: 'Ton & style',  icon: '✍️'  },
];

const EMPTY_PROFILE = {
  nom: '',
  emoji: '🚀',
  personnalite: { mots: [], style: '', collegues: '' },
  trajectoire:  { contexte: '', trous: '', fierte: '' },
  cible:        { secteur: '', offreType: '', eviter: '' },
  ton:          { style: '', interdits: [] },
};

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
        border: `1.5px solid ${active ? C.blue : C.rule}`,
        background: active ? C.blueSoft : C.bg,
        color: active ? C.blue : C.ink2,
        cursor: 'pointer', transition: 'all .15s',
        fontFamily: FONT,
      }}
    >{label}</button>
  );
}

function Radio({ name, value, current, onChange, label, description }) {
  const active = current === value;
  return (
    <label style={{
      display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
      borderRadius: 10, border: `1.5px solid ${active ? C.blue : C.rule}`,
      background: active ? C.blueSoft : C.bg,
      cursor: 'pointer', transition: 'all .15s',
    }}>
      <input type="radio" name={name} value={value}
        checked={active} onChange={() => onChange(value)}
        style={{ marginTop: 3, accentColor: C.blue }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: C.mute, marginTop: 2 }}>{description}</div>}
      </div>
    </label>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>{label}</label>
      {hint && <p style={{ margin: 0, fontSize: 12, color: C.mute, lineHeight: 1.5 }}>{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLength }) {
  return (
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} maxLength={maxLength}
      style={{
        width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
        border: `1.5px solid ${C.rule}`, outline: 'none', fontFamily: FONT,
        color: C.ink, background: C.bg, boxSizing: 'border-box',
      }}
      onFocus={e => e.target.style.borderColor = C.blue}
      onBlur={e => e.target.style.borderColor = C.rule}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{
        width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
        border: `1.5px solid ${C.rule}`, outline: 'none', fontFamily: FONT,
        color: C.ink, background: C.bg, resize: 'vertical', boxSizing: 'border-box',
        lineHeight: 1.6,
      }}
      onFocus={e => e.target.style.borderColor = C.blue}
      onBlur={e => e.target.style.borderColor = C.rule}
    />
  );
}

/* ─── Step 1 : Personnalité ────────────────────────────────────────────── */
function Step1({ data, onChange }) {
  const toggleMot = (mot) => {
    const current = data.personnalite.mots;
    const next = current.includes(mot)
      ? current.filter(m => m !== mot)
      : current.length < 5 ? [...current, mot] : current;
    onChange('personnalite', { ...data.personnalite, mots: next });
  };
  const [motLibre, setMotLibre] = useState('');
  const addLibre = () => {
    const v = motLibre.trim();
    if (!v || data.personnalite.mots.includes(v) || data.personnalite.mots.length >= 5) return;
    onChange('personnalite', { ...data.personnalite, mots: [...data.personnalite.mots, v] });
    setMotLibre('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Field
        label="3 à 5 mots qui te définissent"
        hint="Clique pour sélectionner, ou tape le tien et appuie sur Entrée."
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {MOT_CHIPS.map(m => (
            <Chip key={m} label={m} active={data.personnalite.mots.includes(m)} onClick={() => toggleMot(m)} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text" value={motLibre} onChange={e => setMotLibre(e.target.value)}
            placeholder="Autre mot…" maxLength={20}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLibre())}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13,
              border: `1.5px solid ${C.rule}`, outline: 'none', fontFamily: FONT,
            }}
            onFocus={e => e.target.style.borderColor = C.blue}
            onBlur={e => e.target.style.borderColor = C.rule}
          />
          <button type="button" onClick={addLibre} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: C.blue, color: '#fff', border: 'none', cursor: 'pointer',
            fontFamily: FONT,
          }}>Ajouter</button>
        </div>
        {data.personnalite.mots.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {data.personnalite.mots.map(m => (
              <span key={m} style={{
                padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 600,
                background: C.blue, color: '#fff', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {m}
                <button type="button"
                  onClick={() => onChange('personnalite', { ...data.personnalite, mots: data.personnalite.mots.filter(x => x !== m) })}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontSize: 12, lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        )}
      </Field>

      <Field label="Ton style de travail">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Radio name="style" value="execution" current={data.personnalite.style}
            onChange={v => onChange('personnalite', { ...data.personnalite, style: v })}
            label="Dans l'action" description="J'aime livrer, exécuter, avancer vite" />
          <Radio name="style" value="reflexion" current={data.personnalite.style}
            onChange={v => onChange('personnalite', { ...data.personnalite, style: v })}
            label="Dans la réflexion" description="J'aime concevoir, analyser, structurer" />
          <Radio name="style" value="lien" current={data.personnalite.style}
            onChange={v => onChange('personnalite', { ...data.personnalite, style: v })}
            label="Dans le lien" description="J'aime fédérer, animer, faire collaborer" />
        </div>
      </Field>

      <Field
        label="Ce que tes collègues diraient de toi"
        hint="Complète : « La personne à qui on vient quand… »"
      >
        <TextArea
          value={data.personnalite.collegues}
          onChange={v => onChange('personnalite', { ...data.personnalite, collegues: v })}
          placeholder="…quand il y a un bug impossible à résoudre, ou qu'on a besoin d'une autre perspective."
          rows={3}
        />
      </Field>
    </div>
  );
}

/* ─── Step 2 : Trajectoire ─────────────────────────────────────────────── */
function Step2({ data, onChange }) {
  const CONTEXTES = [
    { value: 'premier-emploi', label: 'Premier emploi / alternance', icon: '🌱' },
    { value: 'evolution',      label: 'Évolution dans le même domaine', icon: '📈' },
    { value: 'reconversion',   label: 'Reconversion professionnelle', icon: '🔄' },
    { value: 'pause',          label: 'Retour après une pause', icon: '⏸️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Field label="Contexte de ta recherche">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CONTEXTES.map(c => {
            const active = data.trajectoire.contexte === c.value;
            return (
              <button key={c.value} type="button"
                onClick={() => onChange('trajectoire', { ...data.trajectoire, contexte: c.value })}
                style={{
                  padding: '14px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${active ? C.blue : C.rule}`,
                  background: active ? C.blueSoft : C.bg,
                  color: active ? C.blue : C.ink2,
                  cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{ fontSize: 20 }}>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Trous de CV, reconversion ou contexte à valoriser"
        hint="Optionnel — si tu as une période à expliquer, l'IA s'en servira pour faire les ponts."
      >
        <TextArea
          value={data.trajectoire.trous}
          onChange={v => onChange('trajectoire', { ...data.trajectoire, trous: v })}
          placeholder="Ex : J'ai arrêté 1 an pour développer une app mobile publiée sur l'App Store. / Je passe de la restauration au dev web — j'ai géré des équipes, des plannings et de la pression client."
          rows={3}
        />
      </Field>

      <Field
        label="Ta plus grande fierté professionnelle"
        hint="Même petite — c'est souvent là que se cachent les meilleures accroches."
      >
        <TextArea
          value={data.trajectoire.fierte}
          onChange={v => onChange('trajectoire', { ...data.trajectoire, fierte: v })}
          placeholder="Ex : J'ai migré un monolithe vers des microservices seul, réduisant la latence de 40%. / J'ai créé le poste de référent digital dans mon équipe de 0."
          rows={3}
        />
      </Field>
    </div>
  );
}

/* ─── Step 3 : Poste visé ──────────────────────────────────────────────── */
function Step3({ data, onChange }) {
  const SECTEURS = [
    { value: 'startup',      label: 'Startup / Scale-up', icon: '🚀' },
    { value: 'grand-groupe', label: 'Grand groupe',        icon: '🏢' },
    { value: 'collectivite', label: 'Secteur public',      icon: '🏛️' },
    { value: 'freelance',    label: 'Freelance',           icon: '💻' },
    { value: 'autre',        label: 'Autre',               icon: '🌐' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Field label="Secteur cible">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SECTEURS.map(s => {
            const active = data.cible.secteur === s.value;
            return (
              <button key={s.value} type="button"
                onClick={() => onChange('cible', { ...data.cible, secteur: s.value })}
                style={{
                  padding: '10px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${active ? C.blue : C.rule}`,
                  background: active ? C.blueSoft : C.bg,
                  color: active ? C.blue : C.ink2,
                  cursor: 'pointer', fontFamily: FONT,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span>{s.icon}</span> {s.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Poste ou offre d'emploi visé"
        hint="Colle l'intitulé du poste, ou copie/colle l'offre directement — l'IA identifiera les mots-clés."
      >
        <TextArea
          value={data.cible.offreType}
          onChange={v => onChange('cible', { ...data.cible, offreType: v })}
          placeholder="Ex : Développeur fullstack React / Node.js — 3 ans d'expérience min, stack AWS, culture agile…"
          rows={4}
        />
      </Field>

      <Field
        label="Ce que tu ne veux PAS mettre en avant"
        hint="Optionnel — expériences à minimiser, compétences à ne pas surexposer."
      >
        <TextArea
          value={data.cible.eviter}
          onChange={v => onChange('cible', { ...data.cible, eviter: v })}
          placeholder="Ex : Mon passé en restauration / Mes 6 mois en startup qui a échoué / Ma connaissance de PHP (je veux aller vers JS)."
          rows={2}
        />
      </Field>
    </div>
  );
}

/* ─── Step 4 : Ton & style ─────────────────────────────────────────────── */
function Step4({ data, onChange }) {
  const TONS = [
    { value: 'authentique',   label: 'Authentique',   desc: 'Je parle vrai, sans jargon corporatiste', icon: '💬' },
    { value: 'professionnel', label: 'Professionnel', desc: 'Je respecte les codes du secteur',         icon: '👔' },
    { value: 'percutant',     label: 'Percutant',     desc: 'Chiffres, impact, résultats mesurables',   icon: '⚡' },
    { value: 'creatif',       label: 'Créatif',       desc: 'Je me démarque, originalité maîtrisée',    icon: '🎨' },
  ];

  const [interditLibre, setInterditLibre] = useState('');
  const addInterdit = (v) => {
    const val = v.trim();
    if (!val || data.ton.interdits.includes(val)) return;
    onChange('ton', { ...data.ton, interdits: [...data.ton.interdits, val] });
  };
  const removeInterdit = (v) => {
    onChange('ton', { ...data.ton, interdits: data.ton.interdits.filter(x => x !== v) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Field label="Ton souhaité pour le CV">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {TONS.map(t => {
            const active = data.ton.style === t.value;
            return (
              <button key={t.value} type="button"
                onClick={() => onChange('ton', { ...data.ton, style: t.value })}
                style={{
                  padding: '14px 16px', borderRadius: 10, fontSize: 13,
                  border: `1.5px solid ${active ? C.blue : C.rule}`,
                  background: active ? C.blueSoft : C.bg,
                  color: active ? C.blue : C.ink2,
                  cursor: 'pointer', textAlign: 'left', fontFamily: FONT,
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 6 }}>{t.icon}</div>
                <div style={{ fontWeight: 700 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: active ? C.blue : C.mute, marginTop: 2 }}>{t.desc}</div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Expressions à bannir"
        hint="L'IA ne les utilisera jamais dans tes reformulations."
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {INTERDITS_SUGGESTIONS.map(s => {
            const active = data.ton.interdits.includes(s);
            return (
              <Chip key={s} label={s} active={active}
                onClick={() => active ? removeInterdit(s) : addInterdit(s)} />
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text" value={interditLibre} onChange={e => setInterditLibre(e.target.value)}
            placeholder="Autre expression…"
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addInterdit(interditLibre); setInterditLibre(''); } }}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13,
              border: `1.5px solid ${C.rule}`, outline: 'none', fontFamily: FONT,
            }}
            onFocus={e => e.target.style.borderColor = C.blue}
            onBlur={e => e.target.style.borderColor = C.rule}
          />
          <button type="button"
            onClick={() => { addInterdit(interditLibre); setInterditLibre(''); }}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: C.blue, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: FONT,
            }}>Ajouter</button>
        </div>
        {data.ton.interdits.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {data.ton.interdits.map(v => (
              <span key={v} style={{
                padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 500,
                background: '#FEE2E2', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 6,
              }}>
                🚫 {v}
                <button type="button" onClick={() => removeInterdit(v)}
                  style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', padding: 0, fontSize: 12 }}>×</button>
              </span>
            ))}
          </div>
        )}
      </Field>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ProfileWizard — page principale
   Props attendues via router : ?edit=<id> pour éditer un profil existant
═══════════════════════════════════════════════════════════════════════════ */
export default function ProfileWizard() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEdit = Boolean(editId);

  const [step, setStep]     = useState(1);
  const [data, setData]     = useState(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Chargement si édition
  useEffect(() => {
    if (isEdit) {
      const existing = getProfile(editId);
      if (existing) setData(existing);
    }
  }, [editId]);

  const updateSection = (section, value) => {
    setData(prev => ({ ...prev, [section]: value }));
  };

  const canNext = () => {
    if (step === 1) return data.personnalite.mots.length > 0;
    if (step === 2) return Boolean(data.trajectoire.contexte);
    if (step === 3) return Boolean(data.cible.secteur);
    if (step === 4) return Boolean(data.ton.style);
    return true;
  };

  const handleSave = () => {
    if (!data.nom.trim()) {
      setError('Donne un nom à ce profil pour le retrouver facilement.');
      return;
    }
    setSaving(true);
    if (isEdit) {
      updateProfile(editId, data);
    } else {
      saveProfile(data);
    }
    navigate(-1);
  };

  const stepContent = [
    <Step1 key={1} data={data} onChange={updateSection} />,
    <Step2 key={2} data={data} onChange={updateSection} />,
    <Step3 key={3} data={data} onChange={updateSection} />,
    <Step4 key={4} data={data} onChange={updateSection} />,
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.surface, fontFamily: FONT }}>
      {/* Header */}
      <div style={{
        background: C.bg, borderBottom: `1px solid ${C.rule}`,
        padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={() => navigate(-1)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: C.ink2, fontWeight: 500, fontFamily: FONT,
        }}>
          ← Retour
        </button>
        <div style={{ width: 1, height: 20, background: C.rule }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>
          {isEdit ? 'Modifier le profil' : 'Nouveau profil'}
        </span>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Étape 4 finale : champ nom + emoji en tête */}
        {step === 4 && (
          <div style={{
            background: C.bg, borderRadius: 14, border: `1px solid ${C.rule}`,
            padding: 20, marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            {/* Emoji picker */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.mute, display: 'block', marginBottom: 6 }}>ICÔNE</label>
              <div style={{ position: 'relative' }}>
                <EmojiPicker value={data.emoji} onChange={v => setData(p => ({ ...p, emoji: v }))} />
              </div>
            </div>
            {/* Nom du profil */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.mute, display: 'block', marginBottom: 6 }}>NOM DU PROFIL *</label>
              <TextInput
                value={data.nom}
                onChange={v => { setData(p => ({ ...p, nom: v })); setError(''); }}
                placeholder="Ex : Dev Startup, Consultant ESN, Freelance…"
                maxLength={40}
              />
              {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{error}</p>}
            </div>
          </div>
        )}

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28, gap: 0 }}>
          {STEPS.map((s, i) => {
            const done    = step > s.id;
            const current = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', fontSize: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: done ? C.blue : current ? C.blueSoft : C.rule,
                    color:      done ? '#fff' : current ? C.blue : C.mute,
                    fontWeight: 700, border: `2px solid ${current ? C.blue : 'transparent'}`,
                    transition: 'all .2s',
                  }}>
                    {done ? '✓' : s.icon}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: current ? 700 : 500, color: current ? C.blue : C.mute }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: done ? C.blue : C.rule, margin: '0 8px', marginBottom: 20, transition: 'all .2s' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card de l'étape courante */}
        <div style={{
          background: C.bg, borderRadius: 16, border: `1px solid ${C.rule}`,
          padding: '28px 28px', marginBottom: 20,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: C.ink }}>
            {STEPS[step - 1].icon} {STEPS[step - 1].label}
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 13, color: C.mute }}>
            {step === 1 && 'Qui es-tu vraiment ? Ces infos guident la voix du CV.'}
            {step === 2 && 'Ton parcours et le contexte que tu veux qu\'on comprenne.'}
            {step === 3 && 'Vers quoi tu vises — l\'IA alignera le vocabulaire.'}
            {step === 4 && 'Le registre de la rédaction et les expressions à éviter.'}
          </p>
          {stepContent[step - 1]}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
            style={{
              padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: C.bg, border: `1.5px solid ${C.rule}`, color: C.ink2,
              cursor: 'pointer', fontFamily: FONT,
            }}
          >
            {step === 1 ? 'Annuler' : '← Précédent'}
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => canNext() && setStep(s => s + 1)}
              disabled={!canNext()}
              style={{
                padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: canNext() ? C.blue : C.rule,
                color: canNext() ? '#fff' : C.mute,
                border: 'none', cursor: canNext() ? 'pointer' : 'default',
                fontFamily: FONT, transition: 'all .15s',
              }}
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !data.ton.style}
              style={{
                padding: '10px 28px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                background: data.ton.style ? C.blue : C.rule,
                color: data.ton.style ? '#fff' : C.mute,
                border: 'none', cursor: data.ton.style ? 'pointer' : 'default',
                fontFamily: FONT,
              }}
            >
              {saving ? 'Enregistrement…' : isEdit ? '✓ Enregistrer' : '✓ Créer le profil'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── EmojiPicker ────────────────────────────────────────────────────────── */
function EmojiPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        width: 52, height: 52, borderRadius: 12, fontSize: 26,
        border: `1.5px solid ${C.rule}`, background: C.surface,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{value}</button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 10,
          }} />
          <div style={{
            position: 'absolute', top: 58, left: 0, zIndex: 11,
            background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 12,
            padding: 10, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}>
            {EMOJI_CHOICES.map(e => (
              <button key={e} type="button" onClick={() => { onChange(e); setOpen(false); }} style={{
                width: 36, height: 36, borderRadius: 8, fontSize: 20, border: 'none',
                background: value === e ? C.blueSoft : 'transparent',
                cursor: 'pointer',
              }}>{e}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
