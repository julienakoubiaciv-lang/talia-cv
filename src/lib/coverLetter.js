/**
 * coverLetter — Lettre / mail de motivation personnalisé(e), généré(e) par Claude.
 *
 * À partir du CV (+ offre visée), produit une lettre prête à envoyer, dans le
 * ton et le format choisis (lettre, email, message LinkedIn). Passe par
 * l'Edge Function claude-proxy via l'action 'coach' (déjà gérée par le quota)
 * → aucune modification serveur.
 */
import { callClaude } from '@/lib/claudeClient';
import { cvDataToText } from '@/lib/cvFeedback';

export const LETTER_FORMATS = {
  lettre:   { label: 'Lettre',          emoji: '✉️', hint: '≈ 250-350 mots, structure formelle' },
  email:    { label: 'Email',           emoji: '📧', hint: 'Court, avec objet, direct' },
  linkedin: { label: 'Message LinkedIn', emoji: '💬', hint: 'Très court, accroche personnalisée' },
};

export const LETTER_TONES = {
  formel:    { label: 'Formel' },
  equilibre: { label: 'Équilibré' },
  dynamique: { label: 'Dynamique' },
};

/** Types de message du kit de candidature. */
export const MESSAGE_TYPES = {
  motivation: {
    label: 'Motivation', emoji: '✍️', forceEmail: false,
    extraLabel: '',
    intro: 'une candidature (lettre ou mail de motivation) pour postuler à un poste',
    rules: 'Mets en avant la motivation et l\'adéquation entre le profil et le poste, preuve(s) concrète(s) à l\'appui.',
  },
  relance: {
    label: 'Relance', emoji: '🔔', forceEmail: true,
    extraLabel: 'Depuis quand as-tu postulé ? (optionnel)',
    intro: 'un email de RELANCE courtois après une candidature restée sans réponse',
    rules: 'Rappelle brièvement la candidature et le poste, réaffirme l\'intérêt, reste poli et non insistant, propose de fournir tout complément utile. Court (≈ 120-160 mots).',
  },
  remerciement: {
    label: 'Remerciement', emoji: '🙏', forceEmail: true,
    extraLabel: 'Personne rencontrée / échange marquant (optionnel)',
    intro: 'un email de REMERCIEMENT après un entretien d\'embauche',
    rules: 'Remercie pour l\'échange, rappelle un point marquant de l\'entretien et un atout clé, réaffirme la motivation. Sincère et concis (≈ 120-160 mots).',
  },
};

const LS_COUNT = 'talia_letters_count';

/** Incrémente le compteur de lettres générées (alimente le parcours). */
export function markLetterGenerated() {
  try {
    const n = (parseInt(localStorage.getItem(LS_COUNT) || '0', 10) || 0) + 1;
    localStorage.setItem(LS_COUNT, String(n));
    return n;
  } catch { return 0; }
}

/** Nombre de lettres générées. */
export function getLettersCount() {
  try { return parseInt(localStorage.getItem(LS_COUNT) || '0', 10) || 0; }
  catch { return 0; }
}

function systemFor(format, tone, messageType = 'motivation') {
  const fmt = LETTER_FORMATS[format] || LETTER_FORMATS.lettre;
  const ton = (LETTER_TONES[tone] || LETTER_TONES.equilibre).label;
  const mt = MESSAGE_TYPES[messageType] || MESSAGE_TYPES.motivation;
  return `Tu es un coach emploi. Tu rédiges pour un candidat ${mt.intro}.

OBJECTIF SPÉCIFIQUE : ${mt.rules}
FORMAT : ${fmt.label} (${fmt.hint}).
TON : ${ton}.

RÈGLES :
- Réponds UNIQUEMENT par un objet JSON valide, sans texte autour ni Markdown :
  { "subject": "<objet de l'email, sinon chaîne vide>", "paragraphs": ["par.1", "par.2", ...] }
- "subject" : rempli uniquement pour le format Email, sinon "".
- Adapte précisément la lettre à la CIBLE fournie :
  · si une annonce est donnée, reprends ses mots-clés et exigences ;
  · si une entreprise est nommée, adresse-lui la lettre nommément ;
  · si seul un TYPE DE POSTE est donné, cible les attentes typiques de ce métier.
- Personnalise à partir du CV (parcours, compétences) ET de la cible.
- Pas de clichés creux ("dynamique et motivé", "depuis mon plus jeune âge").
- Mets en avant 1-2 atouts concrets reliés au besoin du poste.
- Reste honnête : n'invente aucune expérience absente du CV.
- Français impeccable, sans fautes. Termine par une formule adaptée au format.`;
}

/**
 * Décrit la cible de la lettre pour le prompt (fonction pure, testable).
 * Combine annonce, entreprise, intitulé et/ou type de poste.
 */
export function describeTarget({ offerText = '', company = '', roleTitle = '', targetRole = '' } = {}) {
  const lines = [];
  if (String(company).trim())   lines.push(`Entreprise : ${String(company).trim()}`);
  if (String(roleTitle).trim()) lines.push(`Intitulé du poste : ${String(roleTitle).trim()}`);
  if (String(targetRole).trim()) lines.push(`Type de poste visé : ${String(targetRole).trim()}`);
  const offer = String(offerText).trim();
  if (offer) lines.push(`Annonce :\n${offer.slice(0, 4000)}`);
  return lines.length ? lines.join('\n') : '(cible non précisée — déduis le poste le plus probable du CV)';
}

/**
 * Normalise la sortie de l'IA en { subject, paragraphs, text }.
 * Tolérante : accepte un objet JSON OU du texte brut.
 */
export function normalizeCoverLetter(raw) {
  let subject = '';
  let paragraphs = [];

  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if (typeof raw.subject === 'string') subject = raw.subject.trim();
    if (Array.isArray(raw.paragraphs)) paragraphs = raw.paragraphs;
    else if (typeof raw.letter === 'string') paragraphs = raw.letter.split(/\n{2,}/);
    else if (typeof raw.text === 'string') paragraphs = raw.text.split(/\n{2,}/);
  } else if (typeof raw === 'string') {
    paragraphs = raw.split(/\n{2,}/);
  } else if (Array.isArray(raw)) {
    paragraphs = raw;
  }

  paragraphs = paragraphs.map((p) => String(p).trim()).filter(Boolean);
  const text = paragraphs.join('\n\n');
  return { subject, paragraphs, text };
}

/**
 * Génère une lettre/mail/message de motivation via Claude.
 * @param {object} opts
 * @param {object} opts.cvData
 * @param {string} [opts.offerText]
 * @param {'lettre'|'email'|'linkedin'} [opts.format]
 * @param {'formel'|'equilibre'|'dynamique'} [opts.tone]
 * @returns {Promise<{subject:string, paragraphs:string[], text:string}>}
 */
export async function generateCoverLetter({
  cvData, offerText = '', company = '', roleTitle = '', targetRole = '',
  format = 'lettre', tone = 'equilibre', messageType = 'motivation', extra = '',
}) {
  const cvText = cvDataToText(cvData);
  if (!cvText.trim()) {
    throw new Error('CV vide : génère ou sélectionne d\'abord un CV.');
  }

  // Relance & remerciement sont des emails (avec objet).
  const mt = MESSAGE_TYPES[messageType] || MESSAGE_TYPES.motivation;
  const fmt = mt.forceEmail ? 'email' : format;

  const target = describeTarget({ offerText, company, roleTitle, targetRole });
  const extraTxt = String(extra).trim();
  const userContent =
    `CIBLE DE LA CANDIDATURE :\n${target}\n\n` +
    (extraTxt ? `ÉLÉMENTS À INTÉGRER :\n${extraTxt.slice(0, 1000)}\n\n` : '') +
    `CV DU CANDIDAT :\n${cvText}\n\n` +
    `Rédige le message, adapté à cette cible.`;

  const res = await callClaude({
    action: 'coach',
    model: 'claude-haiku-4-5',
    max_tokens: 1500,
    system: systemFor(fmt, tone, messageType),
    messages: [{ role: 'user', content: userContent }],
    metadata: {
      feature: 'cover_letter', messageType, format: fmt, tone,
      hasOffer: !!String(offerText).trim(), hasRole: !!String(targetRole).trim(), hasCompany: !!String(company).trim(),
    },
  });

  let text = (res?.content || []).map((b) => b.text || '').join('').trim();
  text = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const o = text.indexOf('{'), c = text.lastIndexOf('}');
    parsed = (o >= 0 && c > o) ? JSON.parse(text.slice(o, c + 1)) : text; // fallback texte brut
  }

  const letter = normalizeCoverLetter(parsed);
  if (!letter.text || letter.text.length < 40) {
    throw new Error('La génération n\'a produit aucune lettre exploitable. Réessaie.');
  }
  return letter;
}
