/**
 * aiEnergy — Énergie IA quotidienne (jetons ⚡).
 *
 * Couche UX de temporisation : chaque génération IA personnalisée coûte 1 ⚡.
 * L'énergie se recharge chaque jour. Objectif double : lisser l'usage (coût) et
 * créer un rendez-vous quotidien (rétention, façon Duolingo).
 *
 * IMPORTANT — ce n'est PAS la sécurité : la vraie limite reste imposée côté
 * serveur (claude-proxy + check_quota). Ici c'est l'expérience : une jauge, une
 * recharge, et jamais de mur sec (on propose toujours une issue).
 *
 * Ce qui NE coûte PAS d'énergie : tout le contenu non-IA (aptitudes logique/
 * numérique/verbal, codes/SJT, parcours, bilan, banque d'entretien QCM).
 * Ce qui coûte 1 ⚡ : une génération IA (lettre, test de recrutement, oral,
 * optimisation CV, session d'entretien IA…). 1 « module » = 1 ⚡.
 *
 * Persistance : localStorage 'altio_energy' = { day:'YYYY-MM-DD', spent:N }.
 * Synchronisé multi-appareil via progressSync (fusion par jour → anti-contournement).
 */
const LS_KEY = 'altio_energy';

/** Coût en ⚡ par module IA (1 par défaut). */
export const ENERGY_COST = 1;

/** Capacité quotidienne par forfait. Le staff = illimité (géré par le hook). */
export const DAILY_ENERGY = {
  free:     5,
  personal: 40,
  cowork:   40,       // membre d'une petite équipe (coach)
  school:   40,       // élève parrainé par son école
  business: Infinity,
};

/** Erreur dédiée : plus d'énergie pour aujourd'hui. */
export class EnergyError extends Error {
  constructor(message = 'Plus d\'énergie IA pour aujourd\'hui.') {
    super(message);
    this.name = 'EnergyError';
  }
}

/** Capacité quotidienne pour un forfait (staff = illimité). */
export function capForTier(tier, isStaff = false) {
  if (isStaff) return Infinity;
  return DAILY_ENERGY[tier] ?? DAILY_ENERGY.free;
}

/** Énergie restante (pure). */
export function computeRemaining(spent, cap) {
  if (cap === Infinity) return Infinity;
  return Math.max(0, cap - (spent || 0));
}

/** Clé du jour 'YYYY-MM-DD' (heure locale). */
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Millisecondes avant la prochaine recharge (minuit local). Pure. */
export function msUntilReset(now = new Date()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next - now;
}

/** Libellé court de la prochaine recharge (ex. « dans 5 h »). */
export function resetLabel(now = new Date()) {
  const h = Math.ceil(msUntilReset(now) / 3_600_000);
  return h <= 1 ? 'dans moins d\'1 h' : `dans ${h} h`;
}

// ── Stockage (auto-reset quotidien) ───────────────────────────────────────────

/** Lit l'état du jour, en réinitialisant si on a changé de jour. */
export function readEnergy() {
  const today = dayKey();
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    if (raw && raw.day === today) return { day: today, spent: Math.max(0, raw.spent || 0) };
  } catch { /* ignore */ }
  return { day: today, spent: 0 };
}

function write(state) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

/** ⚡ dépensée aujourd'hui. */
export function getSpent() {
  return readEnergy().spent;
}

/** Dépense n ⚡ (par défaut 1). Renvoie le nouvel état. */
export function spendEnergy(n = ENERGY_COST) {
  const s = readEnergy();
  s.spent += Math.max(0, n);
  write(s);
  return s;
}

/** État complet pour une capacité donnée. */
export function energyState(cap) {
  const { day, spent } = readEnergy();
  const unlimited = cap === Infinity;
  return {
    day, spent, cap,
    remaining: computeRemaining(spent, cap),
    unlimited,
    empty: !unlimited && computeRemaining(spent, cap) <= 0,
  };
}
