/**
 * employability — Diagnostic d'employabilité (bilan personnalisé).
 *
 * Synthétise toute l'activité de l'utilisateur (CV, entretien, métiers, codes,
 * candidature) en un score global + des piliers, des forces, des axes de
 * progression et un plan d'action. Effet « bilan de compétences ».
 *
 * `computeDiagnostic(stats)` est pur (testable) ; `getDiagnostic()` lit les stores.
 */
import { getHist } from '@/lib/cvData';
import { atsCheck } from '@/lib/smartMatcher';
import { getOverallCompletion } from '@/lib/interviewProgress';
import { getValidatedJobs } from '@/lib/jobsProgress';
import { listJobs } from '@/lib/jobIntel';
import { getCodesBest } from '@/lib/workCodes';
import { getLettersCount } from '@/lib/coverLetter';
import { getOralBest } from '@/lib/oralInterview';
import { getTestBest } from '@/lib/recruitTest';

const clamp = (v) => Math.max(0, Math.min(100, Math.round(v || 0)));

/** Paliers d'employabilité selon le score global. */
export function tierForScore(g) {
  if (g >= 85) return { label: 'Prêt à l\'emploi', emoji: '🏆', color: '#0CA678' };
  if (g >= 65) return { label: 'Solide',          emoji: '💪', color: '#0CA678' };
  if (g >= 40) return { label: 'En bonne voie',   emoji: '📈', color: '#E8A500' };
  return { label: 'À construire', emoji: '🌱', color: '#E03131' };
}

/**
 * Construit le diagnostic à partir de statistiques déjà collectées (pur).
 * @param {object} s
 * @param {boolean} s.cvExists
 * @param {number} s.cvAts            - score ATS du CV (0-100)
 * @param {number} s.interviewOverall - % de complétion entretien (tronc commun)
 * @param {number} s.jobsValidated    - métiers validés
 * @param {number} s.jobsCovered      - métiers disponibles
 * @param {number} s.codesBest        - meilleure note /20 aux codes
 * @param {number} s.lettersGenerated - lettres générées
 * @param {number} s.oralBest         - meilleure note /20 à l'entretien oral
 * @param {number} s.recruitBest      - meilleure note /20 au test de recrutement
 */
export function computeDiagnostic(s) {
  const {
    cvExists = false, cvAts = 0, interviewOverall = 0,
    jobsValidated = 0, jobsCovered = 0, codesBest = 0, lettersGenerated = 0,
    oralBest = 0, recruitBest = 0,
  } = s || {};

  // La préparation à l'entretien combine l'entraînement écrit (simulateur QCM)
  // et l'oral (note /20). Réussir l'oral fait monter ce pilier.
  const oralPct = clamp((oralBest / 20) * 100);
  const entretienScore = clamp((clamp(interviewOverall) + oralPct) / 2);

  const pillars = [
    {
      id: 'cv', emoji: '📄', label: 'CV prêt à l\'emploi',
      score: cvExists ? clamp(cvAts) : 0,
      cta: '/analyse', ctaLabel: 'Analyser & améliorer mon CV',
      reco: 'Complète et optimise ton CV (mots-clés de l\'offre, compatibilité ATS).',
    },
    {
      id: 'entretien', emoji: '🎤', label: 'Préparation à l\'entretien',
      score: entretienScore,
      cta: oralPct < clamp(interviewOverall) ? '/entretien-oral' : '/entretien',
      ctaLabel: oralPct < clamp(interviewOverall) ? 'M\'entraîner à l\'oral' : 'M\'entraîner à l\'entretien',
      reco: 'Entraîne-toi à l\'écrit (simulateur) ET à l\'oral jusqu\'à être à l\'aise.',
    },
    {
      id: 'metier', emoji: '🧭', label: 'Connaissance des métiers',
      score: jobsCovered ? clamp((jobsValidated / jobsCovered) * 100) : 0,
      cta: '/metiers', ctaLabel: 'Décrypter un métier',
      reco: 'Décrypte les compétences clés des métiers que tu vises.',
    },
    {
      id: 'codes', emoji: '🏢', label: 'Savoir-être en poste',
      score: clamp((codesBest / 20) * 100),
      cta: '/codes', ctaLabel: 'M\'entraîner aux codes',
      reco: 'Travaille les codes de l\'entreprise (savoir-être, situations).',
    },
    {
      id: 'candidature', emoji: '✉️', label: 'Kit de candidature',
      score: lettersGenerated > 0 ? 100 : 0,
      cta: '/lettre', ctaLabel: 'Rédiger ma lettre',
      reco: 'Génère ta lettre / mail de motivation personnalisé(e).',
    },
    {
      id: 'recrutement', emoji: '🧩', label: 'Tests de recrutement',
      score: clamp((recruitBest / 20) * 100),
      cta: '/test-recrutement', ctaLabel: 'Passer un test de recrutement',
      reco: 'Entraîne-toi aux tests de présélection : aptitudes, métier, mises en situation.',
    },
  ];

  const global = Math.round(pillars.reduce((a, p) => a + p.score, 0) / pillars.length);
  const tier = tierForScore(global);
  const strengths = pillars.filter((p) => p.score >= 70);
  const gaps = pillars.filter((p) => p.score < 50).sort((a, b) => a.score - b.score);

  return { global, tier, pillars, strengths, gaps };
}

/** Lit les stores et calcule le diagnostic complet. */
export function getDiagnostic() {
  let cv = null;
  try { cv = getHist()[0]?.data || null; } catch { cv = null; }

  return computeDiagnostic({
    cvExists: !!cv,
    cvAts: cv ? atsCheck(cv).score : 0,
    interviewOverall: getOverallCompletion(),
    jobsValidated: getValidatedJobs().length,
    jobsCovered: listJobs().length,
    codesBest: getCodesBest(),
    lettersGenerated: getLettersCount(),
    oralBest: getOralBest(),
    recruitBest: getTestBest(),
  });
}
