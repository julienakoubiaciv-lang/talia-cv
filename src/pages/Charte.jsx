/**
 * Charte — « Charte vivante » Altio CV (page /charte).
 *
 * Référence de design interactive : marque, couleurs, typographie, composants
 * et tokens. Recréée à partir du bundle Claude Design. Le switch A/B pilote le
 * vrai thème de l'app (clair/sombre) via useTheme → la charte se montre dans les
 * deux directions et sert aussi de démo du mode sombre réel.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme.jsx';
import '@/styles/charte.css';

// ── Données de la charte (hex canoniques, thème clair) ───────────────────────
const TEXT_TOKENS = [
  { name: 'ink', hex: '#0A1740', use: 'Titres, texte fort' },
  { name: 'ink2', hex: '#2A3559', use: 'Texte courant' },
  { name: 'mute', hex: '#6B7390', use: 'Légendes, labels' },
  { name: 'faint', hex: '#9AA1B9', use: 'Texte atténué' },
];
const SURFACE_TOKENS = [
  { name: 'bg', hex: '#EEF1F7', use: "Fond d'écran", ring: true },
  { name: 'bg2', hex: '#E4E9F2', use: 'Fond secondaire (survol)', ring: true },
  { name: 'card', hex: '#FFFFFF', use: 'Cartes, panneaux', ring: true },
  { name: 'card2', hex: '#F8FAFC', use: 'Surface alternative', ring: true },
];
const BLUE_TOKENS = [
  { name: 'blue (navy)', hex: '#0033A0', use: 'Primaire — CTA, liens, états actifs' },
  { name: 'blueSoft', hex: '#E8EEFB', use: 'Fond de pastille navy', ring: true },
  { name: 'blueHover', hex: '#002280', use: 'Survol du primaire' },
  { name: 'yellow', hex: '#FACC15', use: 'Accent — logo, actions IA' },
];
const SEMANTIC = [
  { name: 'green', hex: '#1F9D6A', soft: '#E2F5EC', label: 'Succès / validé', emoji: '✅' },
  { name: 'red', hex: '#D83A52', soft: '#FBE8EB', label: 'Erreur / rompu', emoji: '⛔' },
  { name: 'amber', hex: '#D98A13', soft: '#FCF0D8', label: 'En attente', emoji: '⚠️' },
  { name: 'boss', hex: '#7B5CD6', soft: '#EDE8FA', label: 'Catégorie / soft-skills', emoji: '🧠' },
  { name: 'teal', hex: '#0F9B9B', soft: '#DEF2F1', label: 'Catégorie', emoji: '🌊' },
];
const MODULES = [
  { name: 'Recrutement', emoji: '🎯', hex: '#0033A0' },
  { name: 'Entretien', emoji: '🎤', hex: '#1F9D6A' },
  { name: 'Soft-skills', emoji: '🧠', hex: '#7B5CD6' },
  { name: 'CV', emoji: '📄', hex: '#D98A13' },
  { name: 'Réseau', emoji: '🤝', hex: '#0F9B9B' },
  { name: 'Motivation', emoji: '🔥', hex: '#D83A52' },
];
const CV_PALETTES = [
  ['Navy', '#1A3A5C'], ['Bleu roi', '#1A3A8C'], ['Midnight', '#18243C'], ['Bleu moyen', '#1E88E5'],
  ['Noir', '#14161A'], ['Gris foncé', '#374151'], ['Sauge', '#6E7F6B'], ['Vert forêt', '#2E7D46'],
  ['Vert olive', '#5A6E22'], ['Rouge', '#E02020'], ['Violet', '#7B1FA2'], ['Rose vif', '#E91E8C'],
  ['Orange', '#FB8C00'], ['Pêche', '#F4A988'], ['Cyan foncé', '#00838F'],
];
const TYPE_SCALE = [
  { tag: 'H1', px: 32, weight: 800, tracking: '-1px', lh: 1.15, sample: 'Prépare ton premier entretien' },
  { tag: 'H2', px: 24, weight: 800, tracking: '-0.5px', lh: 1.2, sample: 'Module Entretien — Niveau 3' },
  { tag: 'H3', px: 18, weight: 700, tracking: '-0.2px', lh: 1.3, sample: 'Ta progression cette semaine' },
  { tag: 'Body', px: 14.5, weight: 500, tracking: '0', lh: 1.6, sample: "Réponds à 5 questions pour gagner de l'XP." },
  { tag: 'Label', px: 11.5, weight: 800, tracking: '0.6px', lh: 1.4, sample: 'SECTION · ÉPREUVE', upper: true },
];
const FONTS = [
  { name: 'Manrope', role: 'Titres & display (--font-display)', weights: '500 · 700 · 800', stack: "'Manrope', Inter, system-ui, sans-serif", big: 'Gagne de l’XP' },
  { name: 'Inter', role: 'Corps de texte de l’app (--font)', weights: '400 – 700', stack: "Inter, 'SF Pro Text', system-ui, sans-serif", big: 'Lisible partout' },
  { name: 'DM Sans', role: 'Rendu des CV', weights: '300 – 700', stack: "'DM Sans', system-ui, sans-serif", big: 'Ton CV, au propre' },
  { name: 'Playfair Display', role: 'Titres éditoriaux CV', weights: '600 · 700', stack: "'Playfair Display', Georgia, serif", big: 'Élégance éditoriale' },
];
const RADII = [
  { name: 'xs', px: 8, use: 'Petits éléments' },
  { name: 'sm', px: 10, use: 'Champs & boutons' },
  { name: 'md', px: 14, use: 'Standard' },
  { name: 'lg', px: 22, use: 'Cartes' },
  { name: 'xl', px: 28, use: 'Grandes surfaces' },
  { name: 'pill', px: 999, use: 'Pills & chips' },
];
const SHADOWS = [
  { name: 'sh-1', css: '0 1px 2px rgba(10,23,64,.04), 0 1px 1px rgba(10,23,64,.03)', use: 'Filet, élévation minimale' },
  { name: 'sh-2', css: '0 4px 16px rgba(10,23,64,.08), 0 2px 4px rgba(10,23,64,.04)', use: 'Cartes, surfaces' },
  { name: 'sh-3', css: '0 16px 48px rgba(10,23,64,.14), 0 4px 8px rgba(10,23,64,.06)', use: 'Modales, popovers' },
  { name: 'CTA', css: '0 8px 24px rgba(0,51,160,.28)', use: 'Bouton primaire' },
];

const TABS = [
  { id: 'marque', label: 'Marque', emoji: '🐺' },
  { id: 'couleurs', label: 'Couleurs', emoji: '🎨' },
  { id: 'typo', label: 'Typo', emoji: '🔤' },
  { id: 'composants', label: 'Composants', emoji: '🧩' },
  { id: 'tokens', label: 'Tokens', emoji: '📐' },
];

const copyText = (t) => { try { navigator.clipboard?.writeText(t); } catch { /* noop */ } };

// ── Primitives ────────────────────────────────────────────────────────────────
function Swatch({ hex, name, use, soft, ring, large }) {
  const [copied, setCopied] = useState(false);
  return (
    <button className={'swatch' + (large ? ' swatch--lg' : '')} title={'Copier ' + hex}
      onClick={() => { copyText(hex); setCopied(true); setTimeout(() => setCopied(false), 1100); }}>
      <span className={'swatch__chip' + (ring ? ' swatch__chip--ring' : '')} style={{ background: hex }}>
        {soft && <span className="swatch__soft" style={{ background: soft }} />}
        <span className={'swatch__copied' + (copied ? ' is-on' : '')}>Copié ✓</span>
      </span>
      <span className="swatch__meta">
        <span className="swatch__name">{name}</span>
        <span className="swatch__hex">{hex}</span>
        {use && <span className="swatch__use">{use}</span>}
      </span>
    </button>
  );
}

function Section({ kicker, title, desc, children }) {
  return (
    <section className="sec" data-reveal>
      <header className="sec__head">
        {kicker && <span className="sec__kicker">{kicker}</span>}
        <h2 className="sec__title">{title}</h2>
        {desc && <p className="sec__desc">{desc}</p>}
      </header>
      {children}
    </section>
  );
}

const SAM_LINES = {
  good: [{ msg: 'Énorme ! +50 XP. Tu gères cet entretien 💪' }, { msg: '3 jours d’affilée ! Ta série est en feu 🔥' }, { msg: 'Réponse béton. Le recruteur a adoré 👏' }],
  mid: [{ msg: 'Pas mal ! Reformule ta motivation et c’est parfait.' }, { msg: 'Bon début — ajoute un exemple concret.' }, { msg: 'Tu y es presque, encore un effort 💡' }],
  bad: [{ msg: 'Aïe ! On respire et on recommence ensemble 🐺' }, { msg: 'Réponse trop courte — développe ton parcours.' }, { msg: 'L’erreur fait partie du jeu. On reprend !' }],
};
const TONE_COLOR = { good: 'var(--green)', mid: 'var(--amber)', bad: 'var(--red)' };
const TONE_LABEL = { good: 'Bravo', mid: 'Presque', bad: 'Oups' };

function CoachSamPlay() {
  const tones = ['good', 'mid', 'bad'];
  const [ti, setTi] = useState(0);
  const [li, setLi] = useState(0);
  const [bursts, setBursts] = useState([]);
  const [bump, setBump] = useState(false);
  const idRef = useRef(0);
  const tone = tones[ti];
  const line = SAM_LINES[tone][li];
  const poke = () => {
    const nextL = (li + 1) % SAM_LINES[tone].length;
    setLi(nextL); setTi(nextL === 0 ? (ti + 1) % tones.length : ti);
    setBump(true); setTimeout(() => setBump(false), 480);
    const sparks = '✨🎉⭐⚡💫'.split('');
    const batch = Array.from({ length: 7 }).map(() => ({
      id: idRef.current++, e: sparks[Math.floor(Math.random() * sparks.length)],
      x: (Math.random() * 120 - 60) | 0, y: -(Math.random() * 70 + 40) | 0, r: (Math.random() * 60 - 30) | 0,
    }));
    setBursts((b) => [...b, ...batch]);
    setTimeout(() => setBursts((b) => b.slice(batch.length)), 900);
  };
  return (
    <div className="samplay" style={{ '--tc': TONE_COLOR[tone] }}>
      <div className="samplay__stageglow" />
      <button className={'samplay__avatar' + (bump ? ' is-bump' : '')} onClick={poke} aria-label="Parler à Coach Sam">
        <span className="samplay__face">🐺</span>
        {bursts.map((b) => (
          <span key={b.id} className="samplay__spark" style={{ '--sx': b.x + 'px', '--sy': b.y + 'px', '--sr': b.r + 'deg' }}>{b.e}</span>
        ))}
      </button>
      <div className="samplay__bubble" key={tone + li}>
        <span className="samplay__tone" style={{ background: TONE_COLOR[tone] }}>{TONE_LABEL[tone]}</span>
        <p className="samplay__msg">{line.msg}</p>
      </div>
      <div className="samplay__hint">Clique sur Sam pour changer de ton →</div>
    </div>
  );
}

function SamStatic({ tone, message, sub }) {
  return (
    <div className="sam" style={{ '--tc': TONE_COLOR[tone] }}>
      <div className="sam__avatar"><span className="sam__face">🐺</span></div>
      <div>
        <div className="sam__name">Coach Sam</div>
        <div className="sam__msg">{message}</div>
        {sub && <div className="sam__sub">{sub}</div>}
      </div>
    </div>
  );
}

function Progress({ value, color = 'var(--blue)', label }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(value), 150); return () => clearTimeout(t); }, [value]);
  return (
    <div className="prog">
      {label && <div className="prog__top"><span>{label}</span><span className="prog__pct">{Math.round(w)}%</span></div>}
      <div className="prog__track" style={{ height: 12 }}>
        <div className="prog__fill" style={{ width: w + '%', background: color }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Charte() {
  const navigate = useNavigate();
  const { mode, toggle } = useTheme();
  const [tab, setTab] = useState('marque');
  const [xp, setXp] = useState(1240);
  const [xpBump, setXpBump] = useState(false);
  const dir = mode === 'dark' ? 'B' : 'A';

  // Reveal au changement d'onglet
  useEffect(() => {
    const els = [...document.querySelectorAll('.scrollarea [data-reveal]')];
    const sa = document.querySelector('.scrollarea');
    if (sa) sa.scrollTop = 0;
    els.forEach((el, i) => { el.style.setProperty('--rd', (i % 8) * 45 + 'ms'); el.classList.remove('is-in'); });
    const t = setTimeout(() => els.forEach((el) => el.classList.add('is-in')), 30);
    return () => clearTimeout(t);
  }, [tab]);

  const setDir = (d) => { if ((d === 'B') !== (mode === 'dark')) toggle(); };
  const bumpXp = () => { setXp((x) => x + 50); setXpBump(true); setTimeout(() => setXpBump(false), 420); };

  return (
    <div className="altio" data-dir={dir}>
      <div className="altio__bgblobs"><span className="blob blob--1" /><span className="blob blob--2" /><span className="blob blob--3" /></div>

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar__brand">
          <div className="topbar__mark">A</div>
          <div className="topbar__word">Altio<span className="brandhero__cv"> CV</span></div>
        </div>
        <span className="topbar__sep" />
        <span className="topbar__sub">Charte vivante</span>

        <div className="dirswitch" data-active={dir}>
          <span className="dirswitch__thumb" />
          <button className={'dirswitch__opt' + (dir === 'A' ? ' is-on' : '')} onClick={() => setDir('A')}>☀️ Clair</button>
          <button className={'dirswitch__opt' + (dir === 'B' ? ' is-on' : '')} onClick={() => setDir('B')}>🌙 Arcade</button>
        </div>

        <div className="topbar__meta">
          <span className="topbar__badge">v1.0</span>
          <button className="topbar__back" onClick={() => navigate('/')}>← Accueil</button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabsnav"><div className="tabsnav__inner">
        {TABS.map((t) => (
          <button key={t.id} className={'tabbtn' + (tab === t.id ? ' is-on' : '')} onClick={() => setTab(t.id)}>
            <span className="tabbtn__emoji">{t.emoji}</span>{t.label}
          </button>
        ))}
      </div></nav>

      {/* Contenu */}
      <div className="scrollarea"><div className="scrollarea__inner"><div className="tabwrap">
        {tab === 'marque' && <TabMarque />}
        {tab === 'couleurs' && <TabCouleurs />}
        {tab === 'typo' && <TabTypo />}
        {tab === 'composants' && <TabComposants xp={xp} xpBump={xpBump} bumpXp={bumpXp} />}
        {tab === 'tokens' && <TabTokens />}

        <footer className="pagefoot">
          <span>Altio CV — Charte vivante</span>
          <span>Manrope · Inter · DM Sans · Playfair Display</span>
        </footer>
      </div></div></div>
    </div>
  );
}

function TabMarque() {
  return (
    <>
      <Section kicker="Identité" title="La marque Altio CV"
        desc="Un coach d'employabilité gamifié : on prépare les jeunes au monde du travail, avec la rigueur d'un pro et l'énergie d'un jeu.">
        <div className="brandgrid">
          <div className="brandhero">
            <div className="brandhero__logo">
              <div className="brandhero__mark">A</div>
              <div><div className="brandhero__word">Altio<span className="brandhero__cv"> CV</span></div>
                <div className="brandhero__sig">ALTIO · PRÊT POUR L'EMPLOI</div></div>
            </div>
            <div className="brandhero__tag">« Décroche, intègre, progresse. »</div>
            <div className="brandhero__chips">
              <span className="apill"><span className="apill__dot" />Gamifié</span>
              <span className="apill"><span className="apill__dot" />Bienveillant</span>
              <span className="apill"><span className="apill__dot" />Concret</span>
            </div>
          </div>
          <div className="tonecard">
            <div className="subh" style={{ margin: '0 0 4px' }}>Ton de voix</div>
            <ul className="tonelist">
              <li><b>Tutoiement</b> chaleureux, jamais infantilisant.</li>
              <li><b>Encourageant</b> : l'erreur fait partie du jeu.</li>
              <li><b>Concret</b> : un conseil actionnable à chaque étape.</li>
              <li><b>Fierté</b> : on célèbre chaque progrès (XP, séries, badges).</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section kicker="Mascotte" title="Coach Sam 🐺"
        desc="Sam accompagne l'utilisateur : il félicite, corrige et remotive. Clique pour le faire réagir.">
        <CoachSamPlay />
        <div className="samvariants">
          <SamStatic tone="good" message="Excellent réflexe, +50 XP !" sub="Ton · Réussite" />
          <SamStatic tone="mid" message="Bon début, ajoute un exemple." sub="Ton · Encouragement" />
          <SamStatic tone="bad" message="On respire et on recommence." sub="Ton · Soutien" />
        </div>
      </Section>

      <Section kicker="Univers" title="Les modules"
        desc="Chaque domaine de préparation a sa couleur d'identité.">
        <div className="modgrid">
          {MODULES.map((m) => (
            <div key={m.name} className="modcard" style={{ '--mc': m.hex }}>
              <span className="modcard__emoji">{m.emoji}</span>
              <span className="modcard__name">{m.name}</span>
              <span className="modcard__sig">Module Altio</span>
              <span className="modcard__bar" />
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function TabCouleurs() {
  return (
    <>
      <Section kicker="Fondations" title="Couleurs de base"
        desc="Texte, surfaces et bleu de marque. Clique une pastille pour copier le hex.">
        <div className="subh">Texte</div>
        <div className="hexrow">{TEXT_TOKENS.map((t) => <Swatch key={t.name} {...t} />)}</div>
        <div className="subh">Surfaces & bordures</div>
        <div className="hexrow">{SURFACE_TOKENS.map((t) => <Swatch key={t.name} {...t} />)}</div>
        <div className="subh">Bleu de marque</div>
        <div className="hexrow">{BLUE_TOKENS.map((t) => <Swatch key={t.name} {...t} />)}</div>
      </Section>

      <Section kicker="Sémantique" title="États & accents"
        desc="Chaque état a sa couleur pleine et sa déclinaison douce (fond).">
        <div className="semgrid">
          {SEMANTIC.map((s) => (
            <div key={s.name} className="semcard">
              <div className="semcard__head"><span className="semcard__emoji">{s.emoji}</span><span className="semcard__label">{s.label}</span></div>
              <div className="semcard__bars">
                <button className="semcard__bar" style={{ background: s.hex }} onClick={() => copyText(s.hex)}>{s.name}<code>{s.hex}</code></button>
                <button className="semcard__bar semcard__bar--soft" style={{ background: s.soft }} onClick={() => copyText(s.soft)}>{s.name}Soft<code>{s.soft}</code></button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="Modules" title="Couleurs d'identité">
        <div className="modcolors">
          {MODULES.map((m) => (
            <button key={m.name} className="modcolor" style={{ background: m.hex }} onClick={() => copyText(m.hex)}>
              <span className="modcolor__emoji">{m.emoji}</span>
              <span className="modcolor__name">{m.name}</span>
              <span className="modcolor__hex">{m.hex}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section kicker="CV" title="Palettes des templates"
        desc="15 palettes pour les CV générés, avec l'accent doré des titres.">
        <div className="cvpalettes">
          {CV_PALETTES.map(([name, hex]) => (
            <button key={name} className="cvpal" onClick={() => copyText(hex)}>
              <span className="cvpal__chip" style={{ background: hex }}><span className="cvpal__accent" style={{ background: '#FACC15' }} /></span>
              <span className="cvpal__name">{name}</span>
              <span className="cvpal__hex">{hex}</span>
            </button>
          ))}
        </div>
        <div className="cvaccent">
          <span className="cvaccent__sw" style={{ background: '#FACC15' }} />
          <div><b>Accent titres CV</b><code>#FACC15</code></div>
          <span className="cvaccent__note">Doré signature, réservé aux intitulés de sections des CV.</span>
        </div>
      </Section>
    </>
  );
}

function TabTypo() {
  const [sample, setSample] = useState('Prépare-toi à décrocher ton poste');
  const [weight, setWeight] = useState(800);
  return (
    <>
      <Section kicker="Polices" title="Trois familles"
        desc="Manrope pour les titres, Inter pour le corps de l'app, DM Sans et Playfair pour le rendu des CV.">
        <div className="fontgrid">
          {FONTS.map((f) => (
            <div key={f.name} className="fontcard">
              <div className="fontcard__big" style={{ fontFamily: f.stack }}>{f.big}</div>
              <div className="fontcard__row">
                <span className="fontcard__aa" style={{ fontFamily: f.stack }}>Aa</span>
                <div><div className="fontcard__name">{f.name}</div><div className="fontcard__role">{f.role}</div><div className="fontcard__w">{f.weights}</div></div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="Hiérarchie" title="Échelle typographique">
        <div className="scalecard">
          {TYPE_SCALE.map((r) => (
            <div key={r.tag} className="scalerow">
              <div className="scalerow__spec"><span className="scalerow__tag">{r.tag}</span><span className="scalerow__num">{r.px}px · {r.weight} · {r.tracking}</span></div>
              <div className="scalerow__sample" style={{ fontSize: r.px, fontWeight: r.weight, letterSpacing: r.tracking, lineHeight: r.lh, textTransform: r.upper ? 'uppercase' : 'none' }}>{r.sample}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="Bac à sable" title="Essaie un titre">
        <div className="scalecard" style={{ padding: 28 }}>
          <div style={{ fontFamily: "'Manrope', Inter, sans-serif", fontSize: 'clamp(28px,5vw,52px)', fontWeight: weight, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 22 }}>{sample || 'Ton texte ici…'}</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={sample} onChange={(e) => setSample(e.target.value)} placeholder="Écris un titre…"
              style={{ flex: 1, minWidth: 200, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: 'var(--ink)', background: 'var(--card-2)', border: '1.5px solid var(--line)', borderRadius: 13, padding: '12px 16px', outline: 'none' }} />
            <div style={{ display: 'flex', gap: 6, background: 'var(--seg-bg)', padding: 4, borderRadius: 12 }}>
              {[500, 700, 800].map((w) => (
                <button key={w} onClick={() => setWeight(w)}
                  style={{ border: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, color: weight === w ? 'var(--blue)' : 'var(--mute)', background: weight === w ? 'var(--card)' : 'transparent', padding: '8px 14px', borderRadius: 9, boxShadow: weight === w ? 'var(--shadow-card)' : 'none' }}>{w}</button>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

function TabComposants({ xp, xpBump, bumpXp }) {
  return (
    <>
      <Section kicker="Actions" title="Boutons"
        desc="Quatre variantes : primaire, fantôme, succès, boss.">
        <div className="compstage">
          <button className="abtn abtn--primary">▶ Lancer</button>
          <button className="abtn abtn--ghost">Annuler</button>
          <button className="abtn abtn--success">✓ Valider</button>
          <button className="abtn abtn--boss">🧠 Boss</button>
        </div>
      </Section>

      <Section kicker="Feedback" title="Pills, XP & séries">
        <div className="compstage">
          <span className="apill" style={{ '--pc': 'var(--blue)', '--ps': 'var(--blueSoft)' }}><span className="apill__dot" />En cours</span>
          <span className="apill" style={{ '--pc': 'var(--green)', '--ps': 'var(--greenSoft)' }}><span className="apill__dot" />Validé</span>
          <span className="apill" style={{ '--pc': 'var(--amber)', '--ps': 'var(--amberSoft)' }}><span className="apill__dot" />En attente</span>
          <span className={'xpchip' + (xpBump ? ' xpchip--bump' : '')} onClick={bumpXp}>⚡ {xp} XP</span>
        </div>
      </Section>

      <Section kicker="Progression" title="Barres de progression">
        <div className="proggrid">
          <Progress value={72} label="CV prêt à l'emploi" />
          <Progress value={45} color="var(--green)" label="Préparation à l'entretien" />
          <Progress value={88} color="var(--boss)" label="Soft-skills" />
          <Progress value={30} color="var(--amber)" label="Tests de recrutement" />
        </div>
      </Section>

      <Section kicker="Carte" title="Carte de quête" desc="Le bloc type d'un module : titre, série, action.">
        <div className="quest">
          <div className="quest__top">
            <div className="quest__emoji">🎤</div>
            <div><div className="quest__name">Entretien — Présentation</div><div className="quest__mod">Module Entretien · Niveau 3</div></div>
            <span className="quest__streak">🔥 4</span>
          </div>
          <Progress value={60} label="Progression" />
          <div className="quest__foot">
            <span className="apill" style={{ '--pc': 'var(--green)', '--ps': 'var(--greenSoft)' }}><span className="apill__dot" />+120 XP</span>
            <button className="abtn abtn--primary">Continuer →</button>
          </div>
        </div>
      </Section>
    </>
  );
}

function TabTokens() {
  return (
    <>
      <Section kicker="Formes" title="Rayons" desc="Quatre rayons pour toute l'interface.">
        <div className="radgrid">
          {RADII.map((r) => (
            <div key={r.name} className="radcard">
              <div className="radcard__demo" style={{ borderRadius: r.name === 'pill' ? 99 : r.px }} />
              <span className="radcard__name">{r.name}</span>
              <span className="radcard__val">{r.px}px</span>
              <span className="radcard__use">{r.use}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="Profondeur" title="Ombres">
        <div className="shadgrid">
          {SHADOWS.map((s) => (
            <div key={s.name} className="shadcard">
              <div className="shadcard__demo" style={{ boxShadow: s.css }} />
              <span className="shadcard__name">{s.name}</span>
              <span className="shadcard__css">{s.css}</span>
              <span className="shadcard__use">{s.use}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="Structure" title="Layout"
        desc="Conteneurs centrés : 600px pour les modules, 1180px pour l'accueil. Mobile-first.">
        <div className="proggrid">
          <Progress value={51} label="Module · max 600px" />
          <Progress value={100} color="var(--boss)" label="Accueil · max 1180px" />
        </div>
      </Section>
    </>
  );
}
